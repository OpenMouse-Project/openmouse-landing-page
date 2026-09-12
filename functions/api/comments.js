// Blog comments — no account required, anyone can leave a name (or post
// anonymously) and a comment. Comments go live immediately; there is no
// approval queue, so abuse resistance leans on functions/_middleware.js
// (site-wide rate limiting/banning) plus the checks below.
//
// Storage: a Cloudflare KV namespace bound as `COMMENTS_KV` (Pages dashboard
// → Settings → Functions → KV namespace bindings → variable name
// `COMMENTS_KV`). Without the binding, GET returns an empty list and POST
// fails closed with 503 — the page never crashes on a missing binding.
//
// One key per post: `comments:<slug>` holding a JSON array, newest last.
// Comment volume on a blog is low enough that a read-modify-write on one key
// is simpler than one-key-per-comment, and KV's per-key size limit (25MB) is
// nowhere close for any realistic thread.

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
});

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,80}$/;
const MAX_NAME_LENGTH = 60;
const MAX_TEXT_LENGTH = 2000;
const MAX_COMMENTS_PER_POST = 2000;

function sanitizeText(value) {
  // Collapse excessive blank lines and trim; the frontend renders this as
  // plain text (never dangerouslySetInnerHTML), so no HTML stripping is
  // needed for XSS — only for readability.
  return value.trim().replace(/\n{4,}/g, "\n\n\n");
}

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const kv = env.COMMENTS_KV;

  if (request.method === "GET") {
    const slug = url.searchParams.get("slug") ?? "";
    if (!SLUG_RE.test(slug)) return json({ message: "Invalid post." }, 400);
    if (!kv) return json({ comments: [] });
    const stored = await kv.get(`comments:${slug}`, "json");
    return json({ comments: Array.isArray(stored) ? stored : [] });
  }

  if (request.method === "POST") {
    const origin = request.headers.get("Origin");
    if (origin && origin !== url.origin) return json({ message: "Origin not allowed." }, 403);
    if (!kv) return json({ message: "Comments are not configured." }, 503);

    const body = await request.json().catch(() => ({}));
    const { slug, name, text, website } = body ?? {};

    // Honeypot: a real visitor never sees or fills this field (hidden via
    // CSS off-screen, not display:none, so basic bots that skip
    // display:none fields still get caught). Pretend success either way so
    // the bot doesn't learn its submission was rejected.
    if (typeof website === "string" && website.length > 0) {
      return json({ ok: true });
    }

    if (typeof slug !== "string" || !SLUG_RE.test(slug)) {
      return json({ message: "Invalid post." }, 400);
    }
    if (typeof text !== "string" || text.trim().length === 0) {
      return json({ message: "Comment can't be empty." }, 400);
    }
    if (text.length > MAX_TEXT_LENGTH) {
      return json({ message: `Comment is too long (max ${MAX_TEXT_LENGTH} characters).` }, 400);
    }
    if (typeof name === "string" && name.length > MAX_NAME_LENGTH) {
      return json({ message: `Name is too long (max ${MAX_NAME_LENGTH} characters).` }, 400);
    }

    const key = `comments:${slug}`;
    const existing = (await kv.get(key, "json")) ?? [];
    const list = Array.isArray(existing) ? existing : [];
    if (list.length >= MAX_COMMENTS_PER_POST) {
      return json({ message: "This post has reached its comment limit." }, 409);
    }

    const comment = {
      id: crypto.randomUUID(),
      name: typeof name === "string" && name.trim() ? name.trim().slice(0, MAX_NAME_LENGTH) : "Anonymous",
      text: sanitizeText(text).slice(0, MAX_TEXT_LENGTH),
      createdAt: new Date().toISOString(),
    };
    list.push(comment);
    await kv.put(key, JSON.stringify(list));

    return json({ comment });
  }

  return json({ message: "Method not allowed." }, 405);
}
