import type { ReactNode } from "react";
import {
  DiscordIcon,
  DISCORD_URL,
  formatCount,
  GitHubIcon,
  GITHUB_URL,
  StarIcon,
  TwitterIcon,
  TWITTER_URL,
  useGitHubStars,
} from "./app/social-links";

/** Closing line + community links shared by every post. The GitHub link
    keeps its icon and carries the live star count, so the number is never
    stale copy. */
export function BlogOutro({ children }: { children: ReactNode }): ReactNode {
  const stars = useGitHubStars();
  return (
    <div className="blog-outro">
      <p>{children}</p>
      <div className="blog-social">
        <a href={DISCORD_URL} target="_blank" rel="noreferrer">
          <span className="blog-social-icon"><DiscordIcon /></span> Discord
        </a>
        <a href={TWITTER_URL} target="_blank" rel="noreferrer">
          <span className="blog-social-icon"><TwitterIcon /></span> X
        </a>
        <a className="gh-link" href={GITHUB_URL} target="_blank" rel="noreferrer">
          <span className="blog-social-icon"><GitHubIcon /></span> GitHub
          {stars === null ? null : (
            <span className="gh-stars" aria-hidden="true">
              <StarIcon />
              {formatCount(stars)}
            </span>
          )}
        </a>
      </div>
    </div>
  );
}
