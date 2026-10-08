// Site-wide security guard. Runs before every Cloudflare Pages route — static
// pages and all /api/* endpoints. Tracks per-IP behavior, flags abuse/exploit
// attempts, and permanently bans repeat offenders. Mirrors the openmouse app
// repo's functions/_middleware.js so both projects share the same behavior.
//
// Storage: Durable state lives in a Cloudflare KV namespace bound as
// `SECURITY_KV` (Pages dashboard → Settings → Functions → KV namespace
// bindings → variable name `SECURITY_KV`). Without the binding the middleware
// passes every request through untouched, so the site never breaks on a
// missing binding.
//
// Keys:
//   ban:<ip>                → "1", permanent until manually cleared
//   strikes:<ip>            → count, refreshed TTL
//   window:<ip>:<method>:<minute> → request count for the current minute
//
// Env:
//   RATE_LIMIT_MODE=waf     → skip the KV rate-limit counter entirely and rely
//                             on a WAF rate limiting rule at the edge instead.
//                             Unset keeps the KV limiter, so this is safe to
//                             deploy before the WAF rule exists.

const block = () => new Response("403 Forbidden", {
  status: 403,
  headers: { "Content-Type": "text/plain", "Cache-Control": "no-store", "Retry-After": "3600" },
});

const tooMany = () => new Response("429 Too Many Requests", {
  status: 429,
  headers: { "Content-Type": "text/plain", "Cache-Control": "no-store", "Retry-After": "60" },
});

const tooLarge = () => new Response("413 Payload Too Large", {
  status: 413,
  headers: { "Content-Type": "text/plain", "Cache-Control": "no-store" },
});

const EXPLOIT_RE = /(%00|%0a|%0d|%2e%2e|\.\.\/|\.\.%2f|<script|javascript:|__proto__|constructor\[|union\s+select|;\s*--|waitfor\s+delay|\beval\()/i;

// Static subresources (JS, CSS, images, fonts, media, the service worker and
// manifests) are served straight from Pages' edge and never touch an origin
// function. Running the per-request ban lookup and rate-limit counter over them
// is pure overhead: a single page load fires dozens, and each one used to cost a
// KV read plus a write. They carry no exploit surface (no query parsing, no
// origin work), so the guard skips them wholesale.
//
// Everything that can do damage — document navigations, fetch/XHR calls
// (Sec-Fetch-Dest: empty), and any non-GET request — is still guarded. When
// Sec-Fetch-Dest is absent (curl, bots) the path extension decides; API routes
// and documents never carry an asset extension, so the fallback fails closed.
const ASSET_DESTS = new Set([
  "script", "style", "image", "font", "audio", "video", "track", "manifest", "worker",
]);
const ASSET_EXT_RE = /\.(?:js|mjs|css|map|png|jpe?g|gif|webp|avif|svg|ico|woff2?|ttf|otf|eot|mp4|webm|mp3|ogg|wav|wasm|webmanifest)$/i;

function isStaticSubresource(request, url) {
  const method = request.method.toUpperCase();
  if (method !== "GET" && method !== "HEAD") return false;
  const dest = request.headers.get("Sec-Fetch-Dest");
  if (dest) return ASSET_DESTS.has(dest.toLowerCase());
  return ASSET_EXT_RE.test(url.pathname);
}

const STRIKES_TO_BAN = 25;
const MAX_BODY_BYTES = 8 * 1024 * 1024;
const GET_LIMIT_PER_MINUTE = 240;
const POST_LIMIT_PER_MINUTE = 30;

function clientIp(request) {
  return (
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

async function strike(kv, ip) {
  const current = Number((await kv.get(`strikes:${ip}`)) ?? "0");
  const next = current + 1;
  if (next >= STRIKES_TO_BAN) {
    await kv.put(`ban:${ip}`, "1");
    return true;
  }
  await kv.put(`strikes:${ip}`, String(next), { expirationTtl: 7 * 24 * 3600 });
  return false;
}

async function enforceRateLimit(kv, request, ip) {
  const method = request.method.toUpperCase() === "GET" ? "get" : "post";
  const key = `window:${ip}:${method}:${Math.floor(Date.now() / 60_000)}`;
  const cap = method === "get" ? GET_LIMIT_PER_MINUTE : POST_LIMIT_PER_MINUTE;
  const count = Number((await kv.get(key)) ?? "0") + 1;
  await kv.put(key, String(count), { expirationTtl: 90 });
  return count > cap;
}

export async function onRequest({ request, env, next }) {
  const kv = env.SECURITY_KV;
  if (!kv) return next();

  const url = new URL(request.url);

  // Subresources are the bulk of traffic and the bulk of the KV bill; skip them
  // before any storage work.
  if (isStaticSubresource(request, url)) return next();

  const ip = clientIp(request);
  if (await kv.get(`ban:${ip}`)) return block();

  const method = request.method.toUpperCase();

  // When a WAF rate limiting rule is enforcing limits at the edge
  // (RATE_LIMIT_MODE=waf), the KV counter is redundant and costs a write per
  // guarded request. Anything else keeps the KV limiter.
  const kvRateLimit = env.RATE_LIMIT_MODE !== "waf";

  if (EXPLOIT_RE.test(url.href)) {
    await strike(kv, ip);
    return block();
  }

  const origin = request.headers.get("Origin");
  if (origin && origin !== url.origin && method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
    await strike(kv, ip);
    return block();
  }

  if (method === "POST" && Number(request.headers.get("Content-Length") ?? "0") > MAX_BODY_BYTES) {
    await strike(kv, ip);
    return tooLarge();
  }

  if (kvRateLimit && await enforceRateLimit(kv, request, ip)) {
    await strike(kv, ip);
    return tooMany();
  }

  return next();
}
