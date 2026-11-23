import type { Mouse } from "./supported-mice.ts";

// Lowercases, strips accents and turns punctuation into spaces, so "G-Wolves" and "g wolves" match.
export function foldSearchText(value: string): string {
  return value.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

export function searchTerms(query: string): string[] {
  return foldSearchText(query).split(" ").filter(Boolean);
}

export function mouseSearchText(mouse: Pick<Mouse, "brand" | "model">): string {
  return foldSearchText(`${mouse.brand} ${mouse.model}`);
}

// Every term has to appear in brand + model ("atk pro"), or the whole query in the note ("0x0084").
export function mouseMatchesQuery(mouse: Mouse, query: string): boolean {
  const terms = searchTerms(query);
  if (terms.length === 0) return true;
  const text = mouseSearchText(mouse);
  return terms.every((term) => text.includes(term)) || foldSearchText(mouse.note).includes(terms.join(" "));
}
