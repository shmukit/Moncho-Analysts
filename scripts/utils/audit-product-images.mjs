#!/usr/bin/env node

/**
 * Product-image contact-sheet audit (employer-owned, sector-agnostic).
 *
 * Tier 0 (default, no AI or paid APIs):
 * - downloads product shots for a reliable local contact sheet
 * - flags stock/decorative/people/nature filename and host signals
 * - flags service/advisory images for mandatory visual confirmation
 * - detects unreachable/non-image responses, extreme banners, tiny files,
 *   duplicate URLs, and byte-identical images
 *
 * Tier 1 (optional, local CLIP):
 *   npm install --no-save @huggingface/transformers
 *   npm run audit:product-images -- --file <json> --clip
 *
 * CLIP downloads open model weights once, then inference runs locally. It
 * never calls a paid inference API. Use --clip-local-only after the model is
 * cached to prohibit remote model downloads.
 *
 * Optional sector token pack:
 *   --terms-file path/to/terms.json
 *   { "product_terms": ["..."], "deny_terms": ["..."], "decorative_terms": ["..."] }
 *
 * PRD: docs/prd/PRODUCT_IMAGE_CONTACT_SHEET_AUDIT.md
 * Skill: skills/product_image_audit.md
 */

import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const STOCK_HOSTS = [
  "unsplash.com",
  "images.unsplash.com",
  "pexels.com",
  "pixabay.com",
  "shutterstock.com",
  "istockphoto.com",
  "freepik.com",
  "dreamstime.com",
  "123rf.com",
];

const HARD_DENY_TERMS = [
  "unsplash",
  "pexels",
  "pixabay",
  "shutterstock",
  "istock",
  "mangrove",
  "forest",
  "landscape",
  "nature",
  "chairman",
  "director",
  "founder",
  "team-member",
  "portrait",
  "headshot",
  "testimonial",
  "partner-logo",
  "client-logo",
  "customer-logo",
];

const DECORATIVE_TERMS = [
  "hero",
  "banner",
  "about-us",
  "about_",
  "mission",
  "vision",
  "og-image",
  "og_image",
  "background",
  "bg.",
  "cover",
  "placeholder",
  "favicon",
  "award",
  "certificate",
];

const SERVICE_TYPES = new Set([
  "service",
  "epc_service",
  "software_platform",
  "advisory",
  "consulting",
]);

/** Sector-agnostic CLIP prompts (product / reject classes). */
const DEFAULT_CLIP_LABELS = [
  "an identifiable product, device, app interface, installed system, or concrete service deliverable",
  "only a person or group of people, with no identifiable product or installed system visible",
  "only nature, landscape, or a generic building, with no identifiable product or installed system visible",
  "a company logo, certificate, document, text graphic, or decorative website banner",
  "a generic stock photograph or decorative website image with no identifiable product",
];

function usage() {
  return `
Product-image contact-sheet audit (free, sector-agnostic, standalone)

Usage:
  npm run audit:product-images -- --file <products.json> [options]
  node scripts/utils/audit-product-images.mjs --file <products.json> [options]

Options:
  --out-dir <dir>        Output directory (default: data/qa-reports/<stem>-image-audit)
  --concurrency <n>      Concurrent image downloads (default: 8)
  --timeout-ms <n>       Per-image timeout (default: 20000)
  --terms-file <json>    Optional sector token pack (product_terms, deny_terms, decorative_terms)
  --clip                  Run optional local CLIP after Tier 0
  --clip-model <id>      Hugging Face model (default: Xenova/clip-vit-base-patch32)
  --clip-local-only       Forbid model downloads; use cached/local weights only
  --fail-on-flags         Exit 2 when Tier 0/CLIP flags exist
  --help                  Show this help

Outputs:
  contact-sheet.html     Interactive local thumbnail grid; decisions persist in browser
  audit.json             Machine-readable findings and metadata
  assets/                Downloaded image files used by the contact sheet and CLIP

Tier 1 setup (optional; no package.json change):
  npm install --no-save @huggingface/transformers
  npm run audit:product-images -- --file <products.json> --clip
`.trim();
}

function parseArgs(argv) {
  const args = {
    file: "",
    outDir: "",
    concurrency: 8,
    timeoutMs: 20_000,
    termsFile: "",
    clip: false,
    clipModel: "Xenova/clip-vit-base-patch32",
    clipLocalOnly: false,
    failOnFlags: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      console.log(usage());
      process.exit(0);
    } else if (arg === "--file") args.file = argv[++i] ?? "";
    else if (arg === "--out-dir") args.outDir = argv[++i] ?? "";
    else if (arg === "--concurrency") args.concurrency = Number(argv[++i]);
    else if (arg === "--timeout-ms") args.timeoutMs = Number(argv[++i]);
    else if (arg === "--terms-file") args.termsFile = argv[++i] ?? "";
    else if (arg === "--clip") args.clip = true;
    else if (arg === "--clip-model") args.clipModel = argv[++i] ?? args.clipModel;
    else if (arg === "--clip-local-only") {
      args.clip = true;
      args.clipLocalOnly = true;
    } else if (arg === "--fail-on-flags") args.failOnFlags = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  if (!args.file) throw new Error("--file is required");
  if (!Number.isInteger(args.concurrency) || args.concurrency < 1) {
    throw new Error("--concurrency must be a positive integer");
  }
  if (!Number.isFinite(args.timeoutMs) || args.timeoutMs < 1_000) {
    throw new Error("--timeout-ms must be at least 1000");
  }
  return args;
}

async function loadTermsPack(termsFile) {
  const pack = {
    product_terms: [],
    deny_terms: [...HARD_DENY_TERMS],
    decorative_terms: [...DECORATIVE_TERMS],
    clip_labels: [...DEFAULT_CLIP_LABELS],
  };
  if (!termsFile) return pack;
  const raw = JSON.parse(await fs.readFile(path.resolve(termsFile), "utf8"));
  if (Array.isArray(raw.product_terms)) pack.product_terms = raw.product_terms.map(String);
  if (Array.isArray(raw.deny_terms)) {
    pack.deny_terms = [...new Set([...pack.deny_terms, ...raw.deny_terms.map(String)])];
  }
  if (Array.isArray(raw.decorative_terms)) {
    pack.decorative_terms = [
      ...new Set([...pack.decorative_terms, ...raw.decorative_terms.map(String)]),
    ];
  }
  if (Array.isArray(raw.clip_labels) && raw.clip_labels.length >= 2) {
    pack.clip_labels = raw.clip_labels.map(String);
  }
  return pack;
}

function slug(value) {
  return String(value)
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90)
    .toLowerCase();
}

function extensionFor(contentType, url) {
  const types = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/avif": ".avif",
    "image/svg+xml": ".svg",
  };
  const normalized = String(contentType).split(";")[0].trim().toLowerCase();
  if (types[normalized]) return types[normalized];
  try {
    const ext = path.extname(new URL(url).pathname).toLowerCase();
    if (/^\.(jpe?g|png|webp|gif|avif|svg)$/.test(ext)) return ext;
  } catch {}
  return ".img";
}

function imageDimensions(buffer, contentType) {
  try {
    if (contentType.startsWith("image/png") && buffer.length >= 24) {
      return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
    }
    if (contentType.startsWith("image/gif") && buffer.length >= 10) {
      return { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) };
    }
    if (contentType.startsWith("image/jpeg")) {
      let offset = 2;
      while (offset + 9 < buffer.length) {
        if (buffer[offset] !== 0xff) {
          offset++;
          continue;
        }
        const marker = buffer[offset + 1];
        const length = buffer.readUInt16BE(offset + 2);
        if (
          [0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(
            marker
          )
        ) {
          return {
            width: buffer.readUInt16BE(offset + 7),
            height: buffer.readUInt16BE(offset + 5),
          };
        }
        if (length < 2) break;
        offset += 2 + length;
      }
    }
    if (contentType.startsWith("image/webp") && buffer.length >= 30) {
      const chunk = buffer.toString("ascii", 12, 16);
      if (chunk === "VP8X") {
        const width = 1 + buffer.readUIntLE(24, 3);
        const height = 1 + buffer.readUIntLE(27, 3);
        return { width, height };
      }
    }
  } catch {}
  return null;
}

function hostMatches(host, domain) {
  return host === domain || host.endsWith(`.${domain}`);
}

function addIssue(entry, code, severity, detail) {
  if (!entry.issues.some((issue) => issue.code === code)) {
    entry.issues.push({ code, severity, detail });
  }
}

function tier0Heuristics(entry, terms) {
  const urlLower = entry.image_url.toLowerCase();
  let host = "";
  let pathname = "";
  try {
    const parsed = new URL(entry.image_url);
    host = parsed.hostname.toLowerCase();
    pathname = decodeURIComponent(parsed.pathname).toLowerCase();
  } catch {
    addIssue(entry, "invalid-url", "flag", "Image URL cannot be parsed.");
    return;
  }

  if (STOCK_HOSTS.some((domain) => hostMatches(host, domain))) {
    addIssue(entry, "stock-image-host", "flag", `Known stock-image host: ${host}`);
  }

  for (const term of terms.deny_terms) {
    if (urlLower.includes(term.toLowerCase())) {
      addIssue(entry, "human-nature-or-stock-signal", "flag", `URL contains deny term: ${term}`);
      break;
    }
  }

  for (const term of terms.decorative_terms) {
    if (urlLower.includes(term.toLowerCase())) {
      addIssue(entry, "decorative-asset-signal", "review", `URL contains decorative term: ${term}`);
      break;
    }
  }

  const basename = path.basename(pathname, path.extname(pathname));
  const alphanumeric = basename.replace(/[^a-z0-9]+/g, "");
  if (alphanumeric.length <= 6 || /^\d+$/.test(alphanumeric)) {
    addIssue(
      entry,
      "opaque-filename",
      "review",
      "Filename gives no product association; visually confirm the subject."
    );
  }

  // Sector token packs only: when product_terms are provided, missing tokens → review
  if (terms.product_terms.length > 0) {
    const hasProductTerm = terms.product_terms.some((term) =>
      urlLower.includes(String(term).toLowerCase())
    );
    if (!hasProductTerm) {
      addIssue(
        entry,
        "no-product-token-in-url",
        "review",
        "URL/filename contains no term from the sector terms file; visually confirm the subject."
      );
    }
  }

  if (SERVICE_TYPES.has(String(entry.offering_type))) {
    addIssue(
      entry,
      "service-offering-visual-check",
      "review",
      "Service/software/advisory shots require manual proof that a product, interface, installed system, or concrete deliverable is visible."
    );
  }
}

async function mapConcurrent(items, concurrency, fn) {
  const output = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      output[index] = await fn(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return output;
}

async function downloadEntry(entry, index, assetsDir, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(entry.image_url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": "MonchoProductImageAudit/1.0" },
    });
    entry.http_status = response.status;
    entry.content_type = response.headers.get("content-type") ?? "";
    if (!response.ok) {
      addIssue(entry, "unreachable-image", "flag", `HTTP ${response.status}`);
      return entry;
    }
    if (!entry.content_type.toLowerCase().startsWith("image/")) {
      addIssue(
        entry,
        "non-image-response",
        "flag",
        `Expected image content but received ${entry.content_type || "unknown content type"}.`
      );
      return entry;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    entry.bytes = buffer.length;
    entry.sha256 = createHash("sha256").update(buffer).digest("hex");
    entry.dimensions = imageDimensions(buffer, entry.content_type);
    const ext = extensionFor(entry.content_type, entry.image_url);
    const assetName = `${String(index + 1).padStart(3, "0")}-${slug(entry.product_name)}${ext}`;
    entry.asset = `assets/${assetName}`;
    entry.asset_path = path.join(assetsDir, assetName);
    await fs.writeFile(entry.asset_path, buffer);

    if (buffer.length < 10_000) {
      addIssue(entry, "tiny-file", "review", `Image is only ${buffer.length} bytes.`);
    }
    if (entry.dimensions) {
      const { width, height } = entry.dimensions;
      if (width < 250 || height < 150) {
        addIssue(entry, "low-resolution", "review", `Small dimensions: ${width}×${height}.`);
      }
      const ratio = Math.max(width / height, height / width);
      if (ratio > 3.2) {
        addIssue(entry, "extreme-banner-ratio", "review", `Extreme aspect ratio: ${width}×${height}.`);
      }
    }
  } catch (error) {
    const message = error?.name === "AbortError" ? `timeout after ${timeoutMs}ms` : String(error);
    addIssue(entry, "download-error", "flag", message);
  } finally {
    clearTimeout(timer);
  }
  return entry;
}

function flagDuplicates(entries) {
  const byUrl = new Map();
  const byHash = new Map();
  for (const entry of entries) {
    const normalizedUrl = entry.image_url.trim().toLowerCase();
    if (!byUrl.has(normalizedUrl)) byUrl.set(normalizedUrl, []);
    byUrl.get(normalizedUrl).push(entry);
    if (entry.sha256) {
      if (!byHash.has(entry.sha256)) byHash.set(entry.sha256, []);
      byHash.get(entry.sha256).push(entry);
    }
  }

  for (const group of byUrl.values()) {
    if (group.length < 2) continue;
    const orgs = new Set(group.map((entry) => entry.organization_name));
    for (const entry of group) {
      addIssue(
        entry,
        orgs.size > 1 ? "cross-org-url-reuse" : "within-org-url-reuse",
        orgs.size > 1 ? "flag" : "review",
        `Same image URL used by: ${group.map((item) => item.product_name).join(" | ")}`
      );
    }
  }

  for (const group of byHash.values()) {
    if (group.length < 2) continue;
    const urls = new Set(group.map((entry) => entry.image_url));
    if (urls.size < 2) continue;
    const orgs = new Set(group.map((entry) => entry.organization_name));
    for (const entry of group) {
      addIssue(
        entry,
        orgs.size > 1 ? "cross-org-byte-duplicate" : "within-org-byte-duplicate",
        orgs.size > 1 ? "flag" : "review",
        `Byte-identical image served by different URLs for: ${group
          .map((item) => item.product_name)
          .join(" | ")}`
      );
    }
  }
}

async function runClip(entries, args, clipLabels) {
  const packageName = "@huggingface/transformers";
  let transformers;
  try {
    transformers = await import(packageName);
  } catch {
    throw new Error(
      "Local CLIP requested but @huggingface/transformers is not installed. " +
        "Run: npm install --no-save @huggingface/transformers"
    );
  }

  const { pipeline, RawImage, env } = transformers;
  if (args.clipLocalOnly) env.allowRemoteModels = false;
  console.log(`Loading local CLIP model: ${args.clipModel}`);
  const classifier = await pipeline("zero-shot-image-classification", args.clipModel);

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (!entry.asset_path) continue;
    try {
      const image = await RawImage.read(entry.asset_path);
      const result = await classifier(image, clipLabels);
      entry.clip = result.map((item) => ({
        label: item.label,
        score: Number(item.score.toFixed(4)),
      }));
      const productScore =
        entry.clip.find((item) => item.label === clipLabels[0])?.score ?? 0;
      const strongestReject = Math.max(...entry.clip.slice(1).map((item) => item.score));
      if (productScore < 0.35 || strongestReject > productScore) {
        addIssue(
          entry,
          "clip-no-clear-product",
          "flag",
          `Local CLIP product score ${productScore.toFixed(3)}; strongest reject ${strongestReject.toFixed(3)}.`
        );
      }
      console.log(`CLIP ${i + 1}/${entries.length}: ${entry.product_name}`);
    } catch (error) {
      addIssue(entry, "clip-error", "review", String(error));
    }
  }
}

function statusFor(entry) {
  if (entry.issues.some((issue) => issue.severity === "flag")) return "flag";
  if (entry.issues.length) return "review";
  return "clean";
}

function htmlEscape(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function contactSheetHtml(report, sourceFile) {
  const data = JSON.stringify(report.entries).replaceAll("<", "\\u003c");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Product image audit — ${htmlEscape(path.basename(sourceFile))}</title>
  <style>
    :root { color-scheme: light dark; --bg:#f4f5f7; --panel:#fff; --text:#15171a; --muted:#62666d; --line:#d9dce1; --flag:#b42318; --review:#9a6700; --clean:#067647; --accent:#175cd3; }
    @media (prefers-color-scheme: dark) { :root { --bg:#111315; --panel:#1b1e22; --text:#f2f4f7; --muted:#a4a9b2; --line:#343840; --flag:#f97066; --review:#fdb022; --clean:#47cd89; --accent:#84adff; } }
    * { box-sizing:border-box; }
    body { margin:0; background:var(--bg); color:var(--text); font:14px/1.45 system-ui, sans-serif; }
    header { position:sticky; top:0; z-index:10; background:var(--panel); border-bottom:1px solid var(--line); padding:16px 20px; }
    h1 { margin:0 0 4px; font-size:22px; }
    .sub { color:var(--muted); }
    .toolbar { display:flex; flex-wrap:wrap; gap:8px; align-items:center; margin-top:12px; }
    button, input, select { font:inherit; border:1px solid var(--line); background:var(--panel); color:var(--text); border-radius:6px; padding:7px 10px; }
    button { cursor:pointer; }
    button.active { border-color:var(--accent); color:var(--accent); }
    input[type="search"] { min-width:260px; }
    .stats { display:flex; flex-wrap:wrap; gap:16px; margin-top:10px; color:var(--muted); }
    main { padding:18px; }
    .notice { max-width:1100px; margin:0 auto 16px; padding:12px 14px; border:1px solid var(--line); background:var(--panel); }
    .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(290px,1fr)); gap:14px; }
    article { background:var(--panel); border:2px solid var(--line); border-radius:8px; overflow:hidden; min-width:0; }
    article[data-status="flag"] { border-color:var(--flag); }
    article[data-status="review"] { border-color:var(--review); }
    article[data-decision="omit"] { opacity:.55; }
    .image-wrap { aspect-ratio:4/3; background:#080808; display:flex; align-items:center; justify-content:center; overflow:hidden; }
    img { width:100%; height:100%; object-fit:contain; }
    .body { padding:12px; }
    h2 { font-size:15px; margin:0 0 3px; }
    .org { color:var(--muted); margin-bottom:8px; }
    .badges { display:flex; flex-wrap:wrap; gap:5px; margin:8px 0; }
    .badge { border:1px solid var(--line); border-radius:999px; padding:2px 7px; font-size:12px; }
    .badge.flag { color:var(--flag); border-color:var(--flag); }
    .badge.review { color:var(--review); border-color:var(--review); }
    .meta { color:var(--muted); font-size:12px; overflow-wrap:anywhere; }
    .actions { display:flex; gap:6px; margin-top:10px; }
    .actions button { flex:1; }
    .actions button.selected { outline:2px solid var(--accent); }
    a { color:var(--accent); }
    details { margin-top:8px; }
    summary { cursor:pointer; color:var(--muted); }
    .hidden { display:none !important; }
  </style>
</head>
<body>
<header>
  <h1>Product image content audit</h1>
  <div class="sub">${htmlEscape(sourceFile)} · generated ${htmlEscape(report.generated_at)}</div>
  <div class="toolbar">
    <input id="search" type="search" placeholder="Search product or organization">
    <button data-filter="all" class="active">All</button>
    <button data-filter="flag">Flagged</button>
    <button data-filter="review">Needs review</button>
    <button data-filter="clean">No heuristic flags</button>
    <button data-filter="undecided">Undecided</button>
    <button id="export">Export decisions JSON</button>
    <button id="reset">Reset decisions</button>
  </div>
  <div class="stats" id="stats"></div>
</header>
<main>
  <div class="notice"><strong>Important:</strong> Tier 0 does not understand pixels. “No heuristic flags” is not proof that an image is relevant. Scan every thumbnail once. Mark <strong>Omit</strong> when no identifiable product, interface, installed system, or concrete service deliverable is visible. People or nature may appear only when the product/system remains visible.</div>
  <section class="grid" id="grid"></section>
</main>
<script>
const entries = ${data};
const source = ${JSON.stringify(sourceFile)};
const storageKey = "moncho-image-audit:" + source;
let decisions = JSON.parse(localStorage.getItem(storageKey) || "{}");
let filter = "all";
const grid = document.getElementById("grid");
const search = document.getElementById("search");

function render() {
  const query = search.value.trim().toLowerCase();
  grid.innerHTML = "";
  let shown = 0;
  for (const entry of entries) {
    const decision = decisions[entry.group_label] || "";
    const haystack = (entry.product_name + " " + entry.organization_name).toLowerCase();
    const matchesFilter = filter === "all" || entry.status === filter || (filter === "undecided" && !decision);
    if (!matchesFilter || (query && !haystack.includes(query))) continue;
    shown++;
    const card = document.createElement("article");
    card.dataset.status = entry.status;
    card.dataset.decision = decision;
    const issues = entry.issues.map(i => '<span class="badge ' + i.severity + '" title="' + escapeHtml(i.detail) + '">' + escapeHtml(i.code) + '</span>').join("");
    const dims = entry.dimensions ? entry.dimensions.width + "×" + entry.dimensions.height : "dimensions unknown";
    const clip = entry.clip ? '<details><summary>Local CLIP scores</summary><div class="meta">' + entry.clip.map(x => escapeHtml(x.score + " — " + x.label)).join("<br>") + '</div></details>' : "";
    card.innerHTML =
      '<div class="image-wrap">' + (entry.asset ? '<img loading="lazy" src="' + encodeURI(entry.asset) + '" alt="">' : '<div class="meta">Image unavailable</div>') + '</div>' +
      '<div class="body"><h2>' + escapeHtml(entry.product_name) + '</h2><div class="org">' + escapeHtml(entry.organization_name) + '</div>' +
      '<div class="badges"><span class="badge ' + entry.status + '">' + entry.status + '</span>' + issues + '</div>' +
      '<div class="meta">' + dims + ' · ' + formatBytes(entry.bytes || 0) + '<br><a target="_blank" rel="noreferrer" href="' + escapeHtml(entry.image_url) + '">Open source image</a></div>' +
      clip +
      '<div class="actions">' + ["keep","omit","review"].map(value => '<button data-value="' + value + '" class="' + (decision === value ? "selected" : "") + '">' + value[0].toUpperCase() + value.slice(1) + '</button>').join("") + '</div></div>';
    card.querySelectorAll(".actions button").forEach(button => button.addEventListener("click", () => {
      decisions[entry.group_label] = button.dataset.value;
      localStorage.setItem(storageKey, JSON.stringify(decisions));
      render();
    }));
    grid.appendChild(card);
  }
  const counts = { flag:0, review:0, clean:0, keep:0, omit:0, decisionReview:0 };
  entries.forEach(e => { counts[e.status]++; const d=decisions[e.group_label]; if(d==="keep")counts.keep++; if(d==="omit")counts.omit++; if(d==="review")counts.decisionReview++; });
  document.getElementById("stats").textContent = shown + " shown · " + entries.length + " total · " + counts.flag + " flagged · " + counts.review + " heuristic review · " + counts.clean + " clean-by-heuristic · decisions: " + counts.keep + " keep / " + counts.omit + " omit / " + counts.decisionReview + " review";
}
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c])); }
function formatBytes(bytes) { if (!bytes) return "0 B"; const units=["B","KB","MB"]; const i=Math.min(Math.floor(Math.log(bytes)/Math.log(1024)),2); return (bytes/1024**i).toFixed(i?1:0)+" "+units[i]; }
document.querySelectorAll("[data-filter]").forEach(button => button.addEventListener("click", () => {
  filter = button.dataset.filter;
  document.querySelectorAll("[data-filter]").forEach(b => b.classList.toggle("active", b === button));
  render();
}));
search.addEventListener("input", render);
document.getElementById("reset").addEventListener("click", () => { if(confirm("Clear all saved decisions?")) { decisions={}; localStorage.removeItem(storageKey); render(); }});
document.getElementById("export").addEventListener("click", () => {
  const payload = entries.map(e => ({ product_name:e.product_name, group_label:e.group_label, organization_name:e.organization_name, image_url:e.image_url, tier0_status:e.status, decision:decisions[e.group_label] || "undecided", issues:e.issues }));
  const blob = new Blob([JSON.stringify({source, exported_at:new Date().toISOString(), decisions:payload}, null, 2)], {type:"application/json"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="image-audit-decisions.json"; a.click(); URL.revokeObjectURL(a.href);
});
render();
</script>
</body>
</html>`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const terms = await loadTermsPack(args.termsFile);
  const sourceFile = path.resolve(args.file);
  const stem = path.basename(sourceFile, path.extname(sourceFile));
  const outDir = path.resolve(args.outDir || path.join("data", "qa-reports", `${stem}-image-audit`));
  const assetsDir = path.join(outDir, "assets");
  await fs.rm(assetsDir, { recursive: true, force: true });
  await fs.mkdir(assetsDir, { recursive: true });

  const input = JSON.parse(await fs.readFile(sourceFile, "utf8"));
  const products = Array.isArray(input) ? input : input.products;
  const media = Array.isArray(input?.product_media)
    ? input.product_media
    : Array.isArray(input)
      ? input.filter((row) => row?.media_type)
      : [];
  if (!Array.isArray(products) || !Array.isArray(media)) {
    throw new Error("Expected { products: [...], product_media: [...] } or a flat media array.");
  }

  const byName = new Map(products.map((product) => [product.product_name, product]));
  const shots = media.filter((item) => item.media_type === "product_shot");
  if (!shots.length) throw new Error("No product_shot media rows found.");

  const entries = shots.map((item) => {
    const product = byName.get(item.product_name) ?? {};
    const entry = {
      product_name: item.product_name,
      group_label: item.group_label,
      organization_name: product.organization_name ?? "Unknown organization",
      organization_website: product.organization_website ?? null,
      product_category: product.product_category ?? null,
      offering_type: product.offering_type ?? null,
      hs_code: product.hs_code ?? null,
      image_url: item.image_url,
      issues: [],
    };
    tier0Heuristics(entry, terms);
    return entry;
  });

  console.log(`Downloading ${entries.length} product shots to ${assetsDir}`);
  await mapConcurrent(entries, args.concurrency, (entry, index) =>
    downloadEntry(entry, index, assetsDir, args.timeoutMs)
  );
  flagDuplicates(entries);
  if (args.clip) await runClip(entries, args, terms.clip_labels);

  for (const entry of entries) {
    entry.status = statusFor(entry);
    delete entry.asset_path;
  }
  entries.sort((a, b) => {
    const order = { flag: 0, review: 1, clean: 2 };
    return order[a.status] - order[b.status] || a.organization_name.localeCompare(b.organization_name);
  });

  const counts = {
    total: entries.length,
    flag: entries.filter((entry) => entry.status === "flag").length,
    review: entries.filter((entry) => entry.status === "review").length,
    clean: entries.filter((entry) => entry.status === "clean").length,
  };
  const report = {
    source_file: sourceFile,
    generated_at: new Date().toISOString(),
    tier0: true,
    sector_agnostic: true,
    terms_file: args.termsFile || null,
    clip: args.clip
      ? { enabled: true, model: args.clipModel, local_only: args.clipLocalOnly }
      : { enabled: false },
    rule:
      "Keep only when an identifiable product, interface, installed system, or concrete service deliverable is visible. People/nature may surround it but cannot be the only subject.",
    counts,
    entries,
  };
  await fs.writeFile(path.join(outDir, "audit.json"), JSON.stringify(report, null, 2) + "\n");
  await fs.writeFile(
    path.join(outDir, "contact-sheet.html"),
    contactSheetHtml(report, sourceFile)
  );

  console.log(`Tier 0 result: ${counts.flag} flagged, ${counts.review} review, ${counts.clean} clean`);
  console.log(`Contact sheet: ${path.join(outDir, "contact-sheet.html")}`);
  console.log(`Audit JSON:    ${path.join(outDir, "audit.json")}`);
  if (args.failOnFlags && counts.flag > 0) process.exitCode = 2;
}

main().catch((error) => {
  console.error(`Image audit failed: ${error.message}`);
  process.exitCode = 1;
});
