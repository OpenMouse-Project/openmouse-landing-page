import type { ReactNode } from "react";
import "../../shared/site.css";
import "./blog.css";
import { SiteFooter, SiteNav } from "../../shared/site-chrome";
import { mountPage, readPageData } from "../../shared/page-mount";
import { usePageLocale } from "../../shared/page-locale";
import { usePointerAurora, useScrollReveal } from "../../shared/motion";
import { BLOG_CATEGORIES, formatPostDate, postPath, type PostMeta } from "./blog-types";

const formatDate = (iso: string): string => formatPostDate(iso, "short");

function BlogCover({ post }: { post: PostMeta }): ReactNode {
  if (post.cover) {
    return (
      <div className="blog-cover blog-cover-shot" aria-hidden="true">
        <img src={post.cover} alt="" loading="lazy" />
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

function FeaturedPost({ post }: { post: PostMeta }): ReactNode {
  return (
    <article className="blog-featured" data-reveal>
      <div className="blog-featured-body">
        <h2>
          <a href={postPath(post.slug)}>{post.title}</a>
        </h2>
        <p>{post.description}</p>
        <div className="blog-featured-actions">
          <a className="blog-read" href={postPath(post.slug)}>Read post</a>
          <time className="blog-date-pill" dateTime={post.date}>{formatDate(post.date)}</time>
        </div>
      </div>
      <a className="blog-featured-cover" href={postPath(post.slug)} tabIndex={-1}>
        <BlogCover post={post} />
      </a>
    </article>
  );
}

function PostCard({ post }: { post: PostMeta }): ReactNode {
  return (
    <a className="land-card blog-post-card" href={postPath(post.slug)} data-reveal>
      <BlogCover post={post} />
      <div className="blog-post-card-body">
        <h3>{post.title}</h3>
        <p>{post.description}</p>
        <time dateTime={post.date}>{formatDate(post.date)}</time>
      </div>
    </a>
  );
}

function BlogIndex({ posts }: { posts: readonly PostMeta[] }): ReactNode {
  const aurora = usePointerAurora();
  const [latest, ...older] = posts;
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

interface BlogIndexProps {
  posts: readonly PostMeta[];
}

function BlogIndexPage({ posts }: BlogIndexProps): ReactNode {
  const [locale, setLocale] = usePageLocale();
  useScrollReveal();
  return (
    <div className="land-shell land-shell--marketing">
      <SiteNav locale={locale} onLocale={setLocale} />
      <BlogIndex posts={posts} />
      <SiteFooter locale={locale} />
    </div>
  );
}

export default BlogIndexPage;

if (typeof document !== "undefined") mountPage(BlogIndexPage, readPageData<BlogIndexProps>());
