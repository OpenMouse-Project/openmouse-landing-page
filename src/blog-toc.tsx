import { useEffect, useState, type ReactNode } from "react";

export interface TocItem {
  id: string;
  label: string;
}

/** Headings count as "reached" once they scroll above this line (px). */
const ACTIVE_LINE = 140;

/** The id of the last section whose heading has scrolled past the line. */
function useActiveSection(items: readonly TocItem[]): string | null {
  const [active, setActive] = useState<string | null>(items[0]?.id ?? null);
  useEffect(() => {
    let frame = 0;
    function update(): void {
      frame = 0;
      let current = items[0]?.id ?? null;
      for (const item of items) {
        const heading = document.getElementById(item.id);
        if (heading && heading.getBoundingClientRect().top <= ACTIVE_LINE) current = item.id;
      }
      setActive(current);
    }
    function schedule(): void {
      if (!frame) frame = requestAnimationFrame(update);
    }
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [items]);
  return active;
}

/**
 * "On this page" list for long posts: a sticky rail beside the article on
 * wide screens, a plain list above it on narrow ones. Highlights the
 * section currently being read.
 */
export function BlogToc({ items }: { items: readonly TocItem[] }): ReactNode {
  const active = useActiveSection(items);
  return (
    <aside className="blog-toc-rail">
      <nav className="blog-toc" aria-label="On this page">
        <p>On this page</p>
        <ol>
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={item.id === active ? "is-active" : undefined}
                aria-current={item.id === active ? "location" : undefined}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </aside>
  );
}
