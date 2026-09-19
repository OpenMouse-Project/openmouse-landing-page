import type { ReactNode } from "react";

/** Shared layout for the privacy policy and terms of service pages. */
export function LegalPage({
  kicker,
  title,
  updated,
  children,
}: {
  kicker: string;
  title: string;
  updated: string;
  children: ReactNode;
}): ReactNode {
  return (
    <section className="land-legal">
      <p className="land-legal-kicker">{kicker}</p>
      <h1>{title}</h1>
      <p className="land-legal-updated">Last updated: {updated}</p>
      {children}
    </section>
  );
}

export function LegalSection({ heading, children }: { heading: string; children: ReactNode }): ReactNode {
  return (
    <section className="land-legal-section">
      <h2>{heading}</h2>
      {children}
    </section>
  );
}