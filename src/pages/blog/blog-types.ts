export const BLOG_CATEGORIES = ["Announcements", "Guides", "Incident reports"] as const;
export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

export interface PostMeta {
  slug: string;
  title: string;
  description: string;
  summary: string;
  dek: string;
  date: string;
  updated: boolean;
  author: string;
  category: BlogCategory;
  kicker: string;
  cover?: string;
  coverLabel?: string;
  coverCaption?: string;
  hero?: string;
  heroAlt?: string;
  toc: boolean;
  outro?: string;
}

export interface Heading {
  id: string;
  label: string;
}

export const postPath = (slug: string): string => `/blog/${slug}`;

export function formatPostDate(iso: string, month: "long" | "short" = "long"): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month,
    day: "numeric",
    timeZone: "UTC",
  });
}
