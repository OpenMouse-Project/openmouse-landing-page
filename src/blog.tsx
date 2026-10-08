import type { ReactNode } from "react";
// Blog shares landing.css so the header/footer render identically to the
// other marketing pages — see src/app/site-chrome.tsx for the shared nav.
import "./landing.css";
import "./blog.css";
import { SiteFooter, SiteNav } from "./app/site-chrome";
import { mountBlogPage } from "./blog-mount";
import { usePageLocale } from "./app/page-locale";
import { usePointerAurora, useScrollReveal } from "./app/motion";
import { BLOG_CATEGORIES, BLOG_POSTS, type BlogPost } from "./blog-posts";

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
    <article className="blog-featured" data-reveal>
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
    <a className="land-card blog-post-card" href={postUrl(post)} data-reveal>
      <BlogCover post={post} />
      <div className="blog-post-card-body">
        <h3>{post.title}</h3>
        <p>{post.description}</p>
        <time dateTime={post.date}>{formatDate(post.date)}</time>
      </div>
    </a>
  );
}

function BlogIndex(): ReactNode {
  const aurora = usePointerAurora();
  const [latest, ...older] = BLOG_POSTS;
  return (
    <div className="land-page">
      <header
        className="land-page-head land-aurora"
        ref={(node) => {
          aurora.current = node;
        }}
        data-reveal
      >
        <h1 className="land-page-title">Blog</h1>
        <p className="land-page-lead">
          Incident reports, driver deep-dives, and everything else worth writing down.
        </p>
      </header>

      {latest && (
        <section className="land-section">
          <FeaturedPost post={latest} />
        </section>
      )}

      {BLOG_CATEGORIES.map((category) => {
        const posts = older.filter((post) => post.category === category);
        if (posts.length === 0) return null;
        return (
          <section className="land-section" key={category}>
            <div className="land-section-head">
              <h2>{category}</h2>
            </div>
            <div className="land-grid blog-post-grid">
              {posts.map((post) => <PostCard post={post} key={post.slug} />)}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function BlogIndexPage(): ReactNode {
  const [locale, setLocale] = usePageLocale();
  useScrollReveal();
  return (
    <div className="land-shell land-shell--marketing">
      <SiteNav locale={locale} onLocale={setLocale} />
      <BlogIndex />
      <SiteFooter locale={locale} />
    </div>
  );
}

export default BlogIndexPage;

mountBlogPage(BlogIndexPage, "#blog-app");
