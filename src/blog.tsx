import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";
// Blog shares landing.css so the header/footer render identically to the
// other marketing pages — see src/app/site-chrome.tsx for the shared nav.
import "./landing.css";
import "./blog.css";
import { mountOfflineBanner } from "./offline-banner";
import { registerServiceWorker } from "./register-sw";
import { SiteFooter, SiteNav } from "./app/site-chrome";
import { usePageLocale } from "./app/page-locale";
import { BLOG_POSTS } from "./blog-posts";

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function BlogIndex(): ReactNode {
  return (
    <section className="blog-index">
      <h1>Blog</h1>
      <p>Incident reports, driver deep-dives, and everything else worth writing down.</p>
      <div className="blog-list">
        {BLOG_POSTS.map((post) => (
          <a className="blog-card" href={`/blog-${post.slug}.html`} key={post.slug}>
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            <h2>{post.title}</h2>
            <p>{post.description}</p>
          </a>
        ))}
      </div>
    </section>
  );
}

function BlogIndexPage(): ReactNode {
  const [locale, setLocale] = usePageLocale();
  return (
    <div className="land-shell">
      <SiteNav locale={locale} onLocale={setLocale} />
      <BlogIndex />
      <SiteFooter locale={locale} />
    </div>
  );
}

const blogApp = document.querySelector<HTMLDivElement>("#blog-app");

if (!blogApp) {
  throw new Error("OpenMouse could not find the blog page root.");
}

createRoot(blogApp).render(<BlogIndexPage />);

registerServiceWorker();
mountOfflineBanner();
