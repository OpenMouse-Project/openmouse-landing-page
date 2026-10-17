import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Marked, Renderer, type Tokens, type TokenizerAndRendererExtension } from "marked";
import { APPLE_MARK, LINUX_MARK, WINDOWS_MARK } from "../src/shared/platform-marks.ts";
import { BLOG_CATEGORIES, type BlogCategory, type Heading, type PostMeta } from "../src/pages/blog/blog-types.ts";

export const BLOG_DIR = "content/blog";

export interface Post extends PostMeta {
  html: string;
  headings: Heading[];
}

type Frontmatter = Record<string, string | boolean>;

export function parseFrontmatter(source: string): { data: Frontmatter; body: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(source);
  if (!match) return { data: {}, body: source };
  const data: Frontmatter = {};
  for (const line of match[1].split(/\r?\n/)) {
    const pair = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(line);
    if (!pair) continue;
    const raw = pair[2].trim();
    if (raw === "true" || raw === "false") data[pair[1]] = raw === "true";
    else if (/^".*"$/.test(raw)) data[pair[1]] = JSON.parse(raw) as string;
    else data[pair[1]] = raw;
  }
  return { data, body: source.slice(match[0].length) };
}

const escapeHtml = (value: string): string =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const decodeEntities = (text: string): string =>
  text
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");

const slugify = (text: string): string =>
  text
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/&#?\w+;/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const DOWNLOAD_MARKS: Record<string, { label: string; mark: string }> = {
  windows: { label: "Windows", mark: WINDOWS_MARK },
  macos: { label: "macOS", mark: APPLE_MARK },
  linux: { label: "Linux", mark: LINUX_MARK },
};

const svg = (d: string): string =>
  `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="${d}"/></svg>`;

interface ContainerToken extends Tokens.Generic {
  type: "container";
  kind: string;
  title: string;
  body: string;
  tokens: Tokens.Generic[];
}

const RAW_CONTAINERS = new Set(["glance", "downloads", "note"]);
const BOXES = new Set(["tldr", "finding", "warn"]);

function createMarked(headings: Heading[]): Marked {
  const marked = new Marked({ gfm: true });

  const container: TokenizerAndRendererExtension = {
    name: "container",
    level: "block",
    start(src) {
      return /^ {0,3}:::\w/m.exec(src)?.index;
    },
    tokenizer(src) {
      const match = /^ {0,3}:::(\w+)(?:[ \t]+([^\n]*))?\n([\s\S]*?)\n {0,3}:::[ \t]*(?:\n+|$)/.exec(src);
      if (!match) return undefined;
      const token: ContainerToken = {
        type: "container",
        raw: match[0],
        kind: match[1],
        title: (match[2] ?? "").trim(),
        body: match[3],
        tokens: [],
      };
      if (!RAW_CONTAINERS.has(token.kind)) this.lexer.blockTokens(token.body, token.tokens);
      return token;
    },
    renderer(generic) {
      const token = generic as ContainerToken;
      const inline = (text: string): string => marked.parseInline(text) as string;
      if (BOXES.has(token.kind)) {
        const title = token.title ? `<h3>${inline(token.title)}</h3>` : "";
        return `<div class="blog-${token.kind}">${title}${this.parser.parse(token.tokens)}</div>\n`;
      }
      if (token.kind === "checks") {
        return this.parser
          .parse(token.tokens)
          .replace("<ul>", '<ul class="blog-ruled-out">')
          .replace(/<li><strong>([\s\S]*?)<\/strong>\s*([\s\S]*?)<\/li>/g, "<li><b>$1</b> <span>$2</span></li>");
      }
      if (token.kind === "note") return `<span class="blog-download-note">${inline(token.body.trim())}</span>\n`;
      if (token.kind === "glance") {
        const rows = token.body
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line) => {
            const split = line.indexOf(": ");
            const term = line.slice(0, split);
            let value = line.slice(split + 2);
            const status = value.endsWith("{.status}");
            if (status) value = value.slice(0, -"{.status}".length).trim();
            return `<div><dt>${inline(term)}</dt><dd${status ? ' class="blog-status-tag"' : ""}>${inline(value)}</dd></div>`;
          });
        return `<dl class="blog-glance">${rows.join("")}</dl>\n`;
      }
      if (token.kind === "downloads") {
        const buttons = token.body
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line, index) => {
            const split = line.indexOf(":");
            const os = DOWNLOAD_MARKS[line.slice(0, split).trim()];
            const target = line.slice(split + 1).trim();
            if (!os) throw new Error(`Unknown download platform in "${line}"`);
            if (target === "soon") {
              return `<span class="blog-download-btn is-disabled" aria-disabled="true">${svg(os.mark)} ${os.label} <span class="blog-download-soon">Soon</span></span>`;
            }
            const primary = index === 0 ? " is-primary" : "";
            return `<a class="blog-download-btn${primary}" href="${escapeHtml(target)}">${svg(os.mark)} ${os.label}</a>`;
          });
        return `<div class="blog-download">${buttons.join("")}</div>\n`;
      }
      throw new Error(`Unknown block ":::${token.kind}"`);
    },
  };

  marked.use({
    extensions: [container],
    renderer: {
      heading({ tokens, depth }) {
        let html = this.parser.parseInline(tokens);
        let id: string;
        const explicit = /\s*\{#([\w-]+)\}\s*$/.exec(html);
        if (explicit) {
          id = explicit[1];
          html = html.slice(0, explicit.index);
        } else {
          id = slugify(html);
        }
        if (depth === 2) headings.push({ id, label: decodeEntities(html.replace(/<[^>]+>/g, "")) });
        return `<h${depth} id="${id}">${html}</h${depth}>\n`;
      },
      list(token) {
        const html = Renderer.prototype.list.call(this, token);
        if (!token.ordered) return html;
        return html.replace(/^<ol(\s|>)/, '<ol class="blog-steps"$1').replace(/<li><p>([\s\S]*?)<\/p>/g, "<li>$1");
      },
      table(token) {
        return `<div class="blog-table-wrap">${Renderer.prototype.table.call(this, token)}</div>\n`;
      },
      link(token) {
        const html = Renderer.prototype.link.call(this, token);
        const external = /^https?:\/\//.test(token.href) && !/^https:\/\/openmouse\.app(\/|$)/.test(token.href);
        return external ? html.replace(/^<a /, '<a target="_blank" rel="noreferrer" ') : html;
      },
    },
  });
  return marked;
}

export function renderMarkdown(markdown: string): { html: string; headings: Heading[] } {
  const headings: Heading[] = [];
  const html = createMarked(headings).parse(markdown, { async: false }) as string;
  return { html, headings };
}

function required(data: Frontmatter, key: string, file: string): string {
  const value = data[key];
  if (typeof value !== "string" || !value) throw new Error(`${file}: front matter needs "${key}"`);
  return value;
}

const optional = (data: Frontmatter, key: string): string | undefined =>
  typeof data[key] === "string" && data[key] ? (data[key] as string) : undefined;

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,80}$/;

export function parsePost(slug: string, source: string, file = `${slug}.md`): Post {
  if (!SLUG_RE.test(slug)) {
    throw new Error(`${file}: file names must be lowercase letters, digits and hyphens (they become the URL)`);
  }
  const { data, body } = parseFrontmatter(source);
  const category = required(data, "category", file);
  if (!(BLOG_CATEGORIES as readonly string[]).includes(category)) {
    throw new Error(`${file}: category must be one of ${BLOG_CATEGORIES.join(", ")}`);
  }
  const date = required(data, "date", file);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`${file}: date must be YYYY-MM-DD`);
  const description = required(data, "description", file);
  const { html, headings } = renderMarkdown(body);
  return {
    slug,
    title: required(data, "title", file),
    description,
    summary: optional(data, "summary") ?? description,
    dek: optional(data, "dek") ?? description,
    date,
    updated: data.updated === true,
    author: required(data, "author", file),
    category: category as BlogCategory,
    kicker: required(data, "kicker", file),
    cover: optional(data, "cover"),
    coverLabel: optional(data, "coverLabel"),
    coverCaption: optional(data, "coverCaption"),
    hero: optional(data, "hero"),
    heroAlt: optional(data, "heroAlt"),
    toc: data.toc === true,
    outro: optional(data, "outro"),
    html,
    headings,
  };
}

export function loadPosts(root: string): Post[] {
  const dir = resolve(root, BLOG_DIR);
  return readdirSync(dir)
    .filter((name) => name.endsWith(".md"))
    .map((name) => parsePost(name.slice(0, -3), readFileSync(resolve(dir, name), "utf8"), `${BLOG_DIR}/${name}`))
    .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}

export function postMeta(post: Post): PostMeta {
  const { html: _html, headings: _headings, ...meta } = post;
  return meta;
}
