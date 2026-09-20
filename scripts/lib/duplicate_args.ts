export function parseDuplicateArgs(argv: string[]): {
  entityType: string;
  entityName: string;
  websiteUrl?: string;
} | null {
  const rest = argv.slice(2);
  const entityType = rest[0];
  if (!entityType || rest.length < 2) return null;
  const tail = rest.slice(1);
  const last = tail[tail.length - 1];
  const lastIsUrl = /^https?:\/\//i.test(last);
  const websiteUrl = lastIsUrl ? last : undefined;
  const nameParts = lastIsUrl ? tail.slice(0, -1) : tail;
  const entityName = nameParts.join(" ").trim();
  if (!entityName) return null;
  return { entityType, entityName, websiteUrl };
}
