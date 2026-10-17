import type { ReactNode } from "react";
import "../../shared/site.css";
import "./blog.css";
import { SiteFooter, SiteNav } from "../../shared/site-chrome";
import { usePageLocale } from "../../shared/page-locale";
import { BlogComments } from "./blog-comments";
import { BlogOutro } from "./blog-outro";
import { BlogToc } from "./blog-toc";
import { formatPostDate, type Heading, type PostMeta } from "./blog-types";
import { mountPage, readPageData } from "../../shared/page-mount";

interface BlogPostProps {
  post: PostMeta;
  headings: Heading[];
  html: string;
}

function Article({ post, html }: { post: PostMeta; html: string }): ReactNode {
  return (
    <article className="blog-article">
      <div className="blog-kicker">{post.kicker}</div>
      <h1>{post.title}</h1>
      <p className="blog-dek">{post.dek}</p>
      <p className="blog-byline">
        {post.author}, {post.updated ? "updated " : ""}
        {formatPostDate(post.date)}
      </p>
      {post.hero ? (
        <figure className="blog-hero-shot">
          <img src={post.hero} alt={post.heroAlt ?? ""} />
        </figure>
      ) : null}
      <div className="blog-prose" dangerouslySetInnerHTML={{ __html: html }} />
      {post.outro ? <BlogOutro>{post.outro}</BlogOutro> : null}
    </article>
  );
}

function BlogPostPage({ post, headings, html }: BlogPostProps): ReactNode {
  const [locale, setLocale] = usePageLocale();
  const comments = (
    <div className="blog-comments-wrap">
      <BlogComments slug={post.slug} />
    </div>
  );
  return (
    <div className="land-shell">
      <SiteNav locale={locale} onLocale={setLocale} />
      {post.toc && headings.length > 0 ? (
        <div className="blog-layout">
          <BlogToc items={headings} />
          <div>
            <Article post={post} html={html} />
            {comments}
          </div>
        </div>
      ) : (
        <>
          <Article post={post} html={html} />
          {comments}
        </>
      )}
      <SiteFooter locale={locale} />
    </div>
  );
}

export default BlogPostPage;

if (typeof document !== "undefined") {
  const data = readPageData<Omit<BlogPostProps, "html">>();
  mountPage(BlogPostPage, { ...data, html: document.querySelector(".blog-prose")?.innerHTML ?? "" });
}
