/**
 * Logo.dev URL builder and domain consistency checks.
 * Set LOGODEV_API_KEY in .env (from Analyst Dashboard).
 */

export function logoDevUrl(domain: string): string {
  const key = process.env.LOGODEV_API_KEY;
  const clean = domain.replace(/^www\./, "");
  if (key) {
    return `https://img.logo.dev/${clean}?token=${key}`;
  }
  return `https://img.logo.dev/${clean}`;
}

export function validateLogoDomain(logoUrl: string, websiteUrl: string): string | null {
  try {
    const siteHost = new URL(websiteUrl).hostname.replace(/^www\./, "");
    if (!logoUrl.includes("logo.dev")) return null;
    const logoHost = logoUrl.match(/logo\.dev\/([^?/]+)/)?.[1]?.replace(/^www\./, "");
    if (logoHost && logoHost !== siteHost && !siteHost.endsWith(logoHost) && !logoHost.endsWith(siteHost)) {
      return `logo_url domain "${logoHost}" does not match website domain "${siteHost}"`;
    }
  } catch {
    return null;
  }
  return null;
}
