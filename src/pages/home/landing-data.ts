import { MICE, type Mouse, type Status } from "../../data/supported-mice.ts";
import { withRegistryMice } from "../../data/supported-registry.ts";

export interface LandingData {
  supportedModels: number;
  supportedBrands: string[];
  search: (query: string, limit?: number) => Mouse[];
}

const STATUS_RANK: Record<Status, number> = {
  supported: 0, bridge: 1, pr: 2, quickwin: 3, likely: 4, driver: 5, unknown: 6, pending: 7,
};

function fold(value: string): string {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

export function buildLandingData(rows: readonly Mouse[]): LandingData {
  const supported = rows.filter((row) => row.status === "supported");
  const perBrand = new Map<string, number>();
  for (const row of supported) perBrand.set(row.brand, (perBrand.get(row.brand) ?? 0) + 1);
  const supportedBrands = [...perBrand.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([brand]) => brand);

  const index = rows.map((row) => ({ row, text: fold(`${row.brand} ${row.model}`) }));
  const search = (query: string, limit = 6): Mouse[] => {
    const terms = fold(query).split(" ").filter(Boolean);
    if (terms.length === 0) return [];
    return index
      .filter(({ text }) => terms.every((term) => text.includes(term)))
      .sort((a, b) => {
        const aStarts = a.text.startsWith(terms[0]) || a.text.includes(` ${terms[0]}`) ? 0 : 1;
        const bStarts = b.text.startsWith(terms[0]) || b.text.includes(` ${terms[0]}`) ? 0 : 1;
        return STATUS_RANK[a.row.status] - STATUS_RANK[b.row.status] || aStarts - bStarts || a.text.localeCompare(b.text);
      })
      .slice(0, limit)
      .map(({ row }) => row);
  };

  return { supportedModels: supported.length, supportedBrands, search };
}

export function loadLandingData(): LandingData {
  return buildLandingData(withRegistryMice(MICE));
}
