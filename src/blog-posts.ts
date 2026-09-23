/* Blog post registry — one entry per post, for the index at /blog.html.
   Each post is its own vite entry (see vite.config.ts) with its own
   component; this file just lists them so the index can render cards
   without importing every post's JSX. */

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  /** Big word or number on the generated cover art, e.g. "153". */
  coverLabel?: string;
  /** Small mono caption under the cover label. */
  coverCaption?: string;
  /** A product shot to float on the cover instead of the label. */
  coverImage?: string;
}

export const BLOG_POSTS: readonly BlogPost[] = [
  {
    slug: "openmouse-bridge",
    title: "OpenMouse Bridge is here, and Razer mice work on Windows again",
    description:
      "A small helper app that runs next to your browser and talks to your mouse directly, so a browser update can't lock it out again.",
    date: "2026-09-23",
    coverLabel: "Bridge",
    coverImage: "/bridge-panel.png",
    coverCaption: "1.0 beta · Windows · macOS",
  },
  {
    slug: "razer-windows-chrome-153",
    title: "Every Razer mouse stopped connecting on Windows this week",
    description:
      "Not a Windows driver, not Razer Synapse, not anything in OpenMouse. A years-old bug in Chrome itself, and the fix for it, landing in Chrome 153.",
    date: "2026-09-12",
    coverLabel: "153",
    coverCaption: "Chrome · Windows · WebHID",
  },
];
