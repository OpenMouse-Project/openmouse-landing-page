import { BLOG_DIR, loadPosts, postMeta } from "./blog.ts";
import { PAGES, type PageSpec } from "./pages.ts";
import { postPath } from "../src/pages/blog/blog-types.ts";

export interface SitePage extends PageSpec {
  html?: string;
}

export { BLOG_DIR };

export function sitePages(root: string): SitePage[] {
  const posts = loadPosts(root);
  const index: SitePage = {
    file: "blog.html",
    path: "/blog",
    entry: "/src/pages/blog/blog-index.tsx",
    title: "Blog — OpenMouse",
    description:
      "Incident reports, driver deep-dives, and everything else worth writing down about OpenMouse — the free, open source mouse configurator that runs entirely in your browser over WebHID.",
    socialDescription: "Incident reports, driver deep-dives, and everything else worth writing down.",
    prerender: true,
    data: { posts: posts.map(postMeta) },
    sitemap: { priority: 0.7, changefreq: "weekly", lastmod: posts[0]?.date },
  };
  const articles = posts.map(
    (post): SitePage => ({
      file: `blog/${post.slug}.html`,
      path: postPath(post.slug),
      entry: "/src/pages/blog/blog-post.tsx",
      title: `${post.title} — OpenMouse`,
      description: post.summary,
      socialTitle: post.title,
      type: "article",
      prerender: true,
      data: { post: postMeta(post), headings: post.headings },
      html: post.html,
      sitemap: { priority: 0.6, changefreq: "yearly", lastmod: post.date },
    }),
  );
  return [...PAGES, index, ...articles];
}

export function pageUrl(file: string): string {
  if (file === "index.html") return "/";
  return `/${file.replace(/\.html$/, "")}`;
}
