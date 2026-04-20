// Normalize text into a URL-safe slug. Strips accents, lowercases,
// collapses whitespace, and trims to 60 chars.
export function toSlug(text: string, suffix?: string): string {
  const base = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60)
    .replace(/^-|-$/g, "");
  return suffix ? `${base}-${suffix}` : base;
}
