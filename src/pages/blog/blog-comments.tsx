import { useEffect, useState, type FormEvent, type ReactNode } from "react";

interface Comment {
  id: string;
  name: string;
  text: string;
  createdAt: string;
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function BlogComments({ slug }: { slug: string }): ReactNode {
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [website, setWebsite] = useState(""); // honeypot — real visitors never touch this
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/comments?slug=${encodeURIComponent(slug)}`)
      .then((response) => (response.ok ? response.json() : { comments: [] }))
      .then((data) => {
        if (!cancelled) setComments(Array.isArray(data.comments) ? data.comments : []);
      })
      .catch(() => {
        if (!cancelled) setComments([]);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!text.trim()) return;
    setStatus("sending");
    setError(null);
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, name, text, website }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message ?? "Could not post your comment.");
      }
      if (data.comment) {
        setComments((current) => [...(current ?? []), data.comment]);
      }
      setText("");
      setStatus("idle");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not post your comment.");
      setStatus("error");
    }
  }

  return (
    <section className="blog-comments">
      <h2>Comments</h2>

      <form className="blog-comment-form" onSubmit={submit}>
        <div className="blog-comment-fields">
          <input
            id="blog-comment-name"
            type="text"
            placeholder="Name (optional)"
            value={name}
            maxLength={60}
            onChange={(event) => setName(event.currentTarget.value)}
          />
        </div>
        <textarea
          id="blog-comment-text"
          placeholder="Say something…"
          value={text}
          maxLength={2000}
          rows={3}
          required
          onChange={(event) => setText(event.currentTarget.value)}
        />
        {/* Honeypot: hidden off-screen, not display:none, so bots that only
            skip display:none fields still get caught. */}
        <input
          id="blog-comment-website"
          type="text"
          value={website}
          onChange={(event) => setWebsite(event.currentTarget.value)}
          className="blog-comment-honeypot"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />
        <div className="blog-comment-actions">
          <button type="submit" disabled={status === "sending" || !text.trim()}>
            {status === "sending" ? "Posting…" : "Post comment"}
          </button>
          {error && <span className="blog-comment-error">{error}</span>}
        </div>
      </form>

      {comments === null && <p className="blog-comment-loading">Loading comments…</p>}
      {comments !== null && comments.length === 0 && (
        <p className="blog-comment-empty">No comments yet. Be the first.</p>
      )}
      {comments !== null && comments.length > 0 && (
        <ul className="blog-comment-list">
          {comments.map((comment) => (
            <li key={comment.id}>
              <div className="blog-comment-meta">
                <span className="blog-comment-name">{comment.name}</span>
                <time dateTime={comment.createdAt}>{formatTimestamp(comment.createdAt)}</time>
              </div>
              <p>{comment.text}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
