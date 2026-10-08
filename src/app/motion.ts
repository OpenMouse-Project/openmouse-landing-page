import { useEffect, useRef, type RefObject } from "react";

/* Shared scroll/motion helpers for the marketing pages. Every page that
   reveals content on scroll calls useScrollReveal() once and marks the
   elements with data-reveal; the animation lives in landing.css, which all
   of these pages already import. */

const REVEAL_ATTRIBUTE = "data-reveal";
const REVEAL_ANIMATION = "land-rise";

/** Fades and lifts [data-reveal] elements into view, keeping elements added
    later (async lists, fetch results) on the same footing. The attribute is
    dropped once land-rise has played, so the animation's fill state can no
    longer override hover transforms on the same element. */
export function useScrollReveal(): void {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !("IntersectionObserver" in window)) {
      for (const node of document.querySelectorAll(`[${REVEAL_ATTRIBUTE}]`)) {
        node.classList.add("land-in");
      }
      return;
    }

    const observed = new WeakSet<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("land-in");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.06 },
    );

    function scan(): void {
      for (const node of document.querySelectorAll(`[${REVEAL_ATTRIBUTE}]:not(.land-in)`)) {
        if (observed.has(node)) continue;
        observed.add(node);
        observer.observe(node);
      }
    }

    function done(event: AnimationEvent): void {
      if (event.animationName !== REVEAL_ANIMATION) return;
      const node = event.target;
      if (node instanceof HTMLElement) node.removeAttribute(REVEAL_ATTRIBUTE);
    }

    const mutations = "MutationObserver" in window ? new MutationObserver(scan) : null;
    mutations?.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("animationend", done);
    scan();

    return () => {
      mutations?.disconnect();
      document.removeEventListener("animationend", done);
      observer.disconnect();
    };
  }, []);
}

/** Pointer-tracked spotlight for an aurora element: writes normalized
    --land-px/--land-py custom properties on the node it is attached to,
    which the .land-aurora layers read. Never attaches on touch, coarse
    pointers, or when motion is reduced, so those users keep the centered
    composition. */
export function usePointerAurora(): RefObject<HTMLElement | null> {
  const node = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = node.current;
    if (!element) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let queued = 0;
    function onMove(event: PointerEvent): void {
      if (event.pointerType === "touch") return;
      if (queued) return;
      queued = requestAnimationFrame(() => {
        queued = 0;
        const rect = element!.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        element!.style.setProperty("--land-px", Math.min(1, Math.max(0, x)).toFixed(3));
        element!.style.setProperty("--land-py", Math.min(1, Math.max(0, y)).toFixed(3));
      });
    }

    element.addEventListener("pointermove", onMove);
    return () => {
      element.removeEventListener("pointermove", onMove);
      if (queued) cancelAnimationFrame(queued);
    };
  }, []);

  return node;
}
