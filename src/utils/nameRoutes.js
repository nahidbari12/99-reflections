import names from "../data/names";

export function baseNameSlug(value) {
  return String(value || "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[‘’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function nameSlug(card, index = names.indexOf(card)) {
  const base = baseNameSlug(card?.name);
  const duplicateBefore = names.slice(0, Math.max(0, index)).some((item) => baseNameSlug(item.name) === base);
  return duplicateBefore ? `${base}-${index + 1}` : base;
}

export function findNameBySlug(slug) {
  return names.find((card, index) => nameSlug(card, index) === slug) || null;
}
