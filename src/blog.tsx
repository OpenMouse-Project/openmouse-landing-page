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
import { BLOG_POSTS, type BlogPost } from "./blog-posts";

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function postUrl(post: BlogPost): string {
  return `/blog-${post.slug}.html`;
}

/** Generated cover art, so posts don't need a hand-made image. */
function BlogCover({ post }: { post: BlogPost }): ReactNode {
  if (post.coverImage) {
    return (
      <div className="blog-cover blog-cover-shot" aria-hidden="true">
        <img src={post.coverImage} alt="" loading="lazy" />
      </div>
    );
  }
  return (
    <div className="blog-cover" aria-hidden="true">
      <span className="blog-cover-label">{post.coverLabel ?? "OpenMouse"}</span>
      {post.coverCaption && <span className="blog-cover-caption">{post.coverCaption}</span>}
    </div>
  );
}

function FeaturedPost({ post }: { post: BlogPost }): ReactNode {
  return (
    <article className="blog-featured">
      <div className="blog-featured-body">
        <h2>
          <a href={postUrl(post)}>{post.title}</a>
        </h2>
        <p>{post.description}</p>
        <div className="blog-featured-actions">
          <a className="blog-read" href={postUrl(post)}>Read post</a>
          <time className="blog-date-pill" dateTime={post.date}>{formatDate(post.date)}</time>
        </div>
      </div>
      <a className="blog-featured-cover" href={postUrl(post)} tabIndex={-1}>
        <BlogCover post={post} />
      </a>
    </article>
  );
}

function PostCard({ post }: { post: BlogPost }): ReactNode {
  return (
    <a className="blog-card" href={postUrl(post)}>
      <BlogCover post={post} />
      <div className="blog-card-body">
        <h3>{post.title}</h3>
        <p>{post.description}</p>
        <time dateTime={post.date}>{formatDate(post.date)}</time>
      </div>
    </a>
  );
}

function BlogIndex(): ReactNode {
  const [latest, ...older] = BLOG_POSTS;
  return (
    <section className="blog-index">
      <h1 className="blog-visually-hidden">Blog</h1>
      {latest && <FeaturedPost post={latest} />}
      {older.length > 0 && (
        <div className="blog-grid">
          {older.map((post) => <PostCard post={post} key={post.slug} />)}
        </div>
      )}
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
