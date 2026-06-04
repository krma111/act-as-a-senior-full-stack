export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function promptSlug(prompt: { id: string; title: string }) {
  const titleSlug = slugify(prompt.title);
  return titleSlug ? `${titleSlug}-${prompt.id}` : prompt.id;
}

export function creatorSlug(profile?: { id?: string; email?: string | null; full_name?: string | null; display_name?: string | null } | null) {
  const displayName = profile?.full_name ?? profile?.display_name ?? profile?.email?.split("@")[0] ?? "Creator";
  return slugify(displayName) || profile?.id || "creator";
}
