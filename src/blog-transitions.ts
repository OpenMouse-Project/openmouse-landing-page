/* Cross-page View Transitions for the blog (see @view-transition in
   blog.css). A post's cover and title carry the same view-transition-name
   on the index and on the post itself, so the browser morphs one into the
   other when you open a post, and back again on Back. Each name must be
   unique on a page. Browsers without the API just navigate normally. */

import type { CSSProperties } from "react";

type TransitionPart = "image" | "title";

export function postTransition(slug: string, part: TransitionPart): CSSProperties {
  return { viewTransitionName: `post-${slug}-${part}` } as CSSProperties;
}
