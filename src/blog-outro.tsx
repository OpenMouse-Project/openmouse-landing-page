import type { ReactNode } from "react";
import { DiscordIcon, DISCORD_URL, GitHubIcon, GITHUB_URL, TwitterIcon, TWITTER_URL } from "./app/social-links";

/** Closing line + community links shared by every post. */
export function BlogOutro({ children }: { children: ReactNode }): ReactNode {
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
        <a href={GITHUB_URL} target="_blank" rel="noreferrer">
          <span className="blog-social-icon"><GitHubIcon /></span> GitHub
        </a>
      </div>
    </div>
  );
}
