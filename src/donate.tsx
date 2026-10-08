import { useEffect, useRef, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
// Donate rides on landing.css: the page column, the aurora head, the cards
// and the GitHub star pill are the shared marketing primitives, so only the
// donate-specific pieces live in donate.css.
import "./landing.css";
import "./donate.css";
import { mountOfflineBanner } from "./offline-banner";
import { registerServiceWorker } from "./register-sw";
import { t, tp } from "./i18n";
import { usePageLocale } from "./app/page-locale";
import { SiteNav } from "./app/site-chrome";
import { usePointerAurora, useScrollReveal } from "./app/motion";
import {
  DiscordIcon,
  GitHubIcon,
  GitHubLink,
  GITHUB_URL,
  TwitterIcon,
} from "./app/social-links";

const ORG = "OpenMouse-Project";
const REFRESH_MS = 15 * 60 * 1000;
const GITHUB_API = "https://api.github.com";
const PER_PAGE = 100;
const MAX_PAGES = 40;

/* ── Live contributor data (ported from the old Hall of Fame) ──────────── */

type RepoKey = string;

interface RepoInfo {
  key: RepoKey;
  label: string;
  fullName: string;
}

interface BranchData {
  key: RepoKey;
  repo: string;
  branch: string;
  label: string;
  commits: number;
  authors: { login: string; avatar: string | null; htmlUrl: string | null; count: number }[];
}

interface RepoPulls {
  key: RepoKey;
  repo: string;
  prs: number;
  authors: { login: string; avatar: string | null; htmlUrl: string | null; prs: number }[];
}

interface MergedContributor {
  login: string;
  avatar: string | null;
  htmlUrl: string | null;
  total: number;
  repos: Partial<Record<RepoKey, number>>;
  prs: Partial<Record<RepoKey, number>>;
}

interface CachedData {
  fetchedAt: number;
  branches: BranchData[];
  pulls: RepoPulls[];
  repoList: RepoInfo[];
  merged: MergedContributor[];
}

const CACHE_KEY = "openmouse-donate-contributors-v1";

/* Baked-in recent snapshot of contributors (from the org repo commit history at
   build time). Shown whenever GitHub is rate-limited; refreshed automatically by
   the next successful live fetch, which replaces it via localStorage. */
const DEFAULT_CONTRIBUTORS: { login: string; total: number; avatar: string }[] = [
  { login: "snekxs", total: 426, avatar: "https://github.com/snekxs.png" },
  { login: "jazzstack", total: 112, avatar: "https://github.com/jazzstack.png" },
  { login: "dwei30", total: 45, avatar: "https://github.com/dwei30.png" },
  { login: "viix0dev", total: 24, avatar: "https://github.com/viix0dev.png" },
  { login: "nyedle", total: 22, avatar: "https://github.com/nyedle.png" },
  { login: "angelocore", total: 21, avatar: "https://github.com/angelocore.png" },
  { login: "Pochiiko", total: 21, avatar: "https://github.com/Pochiiko.png" },
  { login: "Josh Jenkins", total: 19, avatar: "" },
  { login: "Grandma", total: 9, avatar: "" },
  { login: "AnasIsmai1", total: 7, avatar: "https://github.com/AnasIsmai1.png" },
  { login: "qsxcv", total: 6, avatar: "https://github.com/qsxcv.png" },
  { login: "weltern", total: 5, avatar: "https://github.com/weltern.png" },
  { login: "ydw1904", total: 5, avatar: "https://github.com/ydw1904.png" },
  { login: "nguyenan1601", total: 2, avatar: "https://github.com/nguyenan1601.png" },
  { login: "NotLokry", total: 1, avatar: "https://github.com/NotLokry.png" },
  { login: "FormunaGit", total: 1, avatar: "https://github.com/FormunaGit.png" },
];

function defaultData(): CachedData {
  return {
    fetchedAt: 0,
    branches: [],
    pulls: [],
    repoList: [],
    merged: DEFAULT_CONTRIBUTORS.map((c) => ({
      login: c.login,
      avatar: c.avatar || null,
      htmlUrl: c.avatar ? `https://github.com/${c.login}` : null,
      total: c.total,
      repos: {},
      prs: {},
    })),
  };
}

function readCache(): CachedData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedData;
    if (!Array.isArray(parsed.branches) || parsed.branches.length === 0 || !Array.isArray(parsed.repoList) || !Array.isArray(parsed.pulls) || !Array.isArray(parsed.merged)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(data: CachedData): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    /* storage unavailable */
  }
}

function repoKeyOf(name: string): RepoKey {
  return name.toLowerCase();
}

function repoLabelOf(name: string): string {
  if (repoKeyOf(name) === "openmouse") return "OpenMouse";
  return name
    .split("-")
    .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join(" ");
}

async function githubJson<T>(path: string): Promise<{ data: T; link: string | null }> {
  const res = await fetch(`${GITHUB_API}${path}`, { headers: { Accept: "application/vnd.github+json" } });
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);
  const data = (await res.json()) as T;
  return { data, link: res.headers.get("link") };
}

function lastPageNumber(link: string | null): number {
  if (!link) return 1;
  const match = /page=(\d+)[^>]*>;\s*rel="last"/.exec(link);
  return match ? Math.min(Number(match[1]), MAX_PAGES) : 1;
}

interface ApiCommit {
  author: { login: string; avatar_url: string; html_url: string } | null;
  commit: { author: { name: string } };
}

async function fetchBranch(repo: string, branch: string, key: RepoKey, label: string): Promise<BranchData> {
  const pages: ApiCommit[][] = [];
  const path = `/repos/${repo}/commits?sha=${branch}`;
  const first = await githubJson<ApiCommit[]>(`${path}&per_page=${PER_PAGE}&page=1`);
  pages.push(first.data);
  const last = lastPageNumber(first.link);
  for (let page = 2; page <= last; page += 1) {
    const { data } = await githubJson<ApiCommit[]>(`${path}&per_page=${PER_PAGE}&page=${page}`);
    pages.push(data);
    if (data.length < PER_PAGE) break;
  }

  const authors = new Map<string, { login: string; avatar: string | null; htmlUrl: string | null; count: number }>();
  let commits = 0;
  for (const commit of pages.flat()) {
    commits += 1;
    const login = commit.author?.login;
    const fallback = commit.author ? null : commit.commit.author.name;
    const name = login ?? fallback ?? "Unknown";
    if (name.endsWith("[bot]") || name === "Unknown") continue;
    const entry = authors.get(name) ?? {
      login: name,
      avatar: commit.author?.avatar_url ?? null,
      htmlUrl: commit.author?.html_url ?? null,
      count: 0,
    };
    if (!entry.avatar) entry.avatar = commit.author?.avatar_url ?? null;
    if (!entry.htmlUrl) entry.htmlUrl = commit.author?.html_url ?? null;
    entry.count += 1;
    authors.set(name, entry);
  }

  return {
    key,
    repo,
    branch,
    label,
    commits,
    authors: [...authors.values()].sort((a, b) => b.count - a.count),
  };
}

interface ApiPull {
  merged_at: string | null;
  user: { login: string; avatar_url: string; html_url: string; type: string } | null;
}

async function fetchPulls(repo: RepoInfo): Promise<RepoPulls> {
  const pages: ApiPull[][] = [];
  const path = `/repos/${repo.fullName}/pulls?state=closed&sort=updated&direction=desc`;
  const first = await githubJson<ApiPull[]>(`${path}&per_page=${PER_PAGE}&page=1`);
  pages.push(first.data);
  const last = lastPageNumber(first.link);
  for (let page = 2; page <= last; page += 1) {
    const { data } = await githubJson<ApiPull[]>(`${path}&per_page=${PER_PAGE}&page=${page}`);
    pages.push(data);
    if (data.length < PER_PAGE) break;
  }

  const authors = new Map<string, { login: string; avatar: string | null; htmlUrl: string | null; prs: number }>();
  let mergedPrs = 0;
  for (const pull of pages.flat()) {
    if (!pull.merged_at) continue;
    mergedPrs += 1;
    const user = pull.user;
    // PRs that don't show up on GitHub's contributors graph (squash/rebase
    // merges, unlinked emails, rewritten history) still count here.
    if (!user || user.type === "Bot" || /\[bot\]$/.test(user.login)) continue;
    const entry = authors.get(user.login) ?? {
      login: user.login,
      avatar: user.avatar_url,
      htmlUrl: user.html_url,
      prs: 0,
    };
    entry.prs += 1;
    authors.set(user.login, entry);
  }

  return {
    key: repo.key,
    repo: repo.fullName,
    prs: mergedPrs,
    authors: [...authors.values()].sort((a, b) => b.prs - a.prs),
  };
}

interface ApiOrgRepo {
  name: string;
  full_name: string;
  default_branch: string;
  fork: boolean;
  archived: boolean;
}

async function fetchOrgRepos(): Promise<ApiOrgRepo[]> {
  const { data } = await githubJson<ApiOrgRepo[]>(`/orgs/${ORG}/repos?per_page=100&sort=full_name`);
  return data.filter((repo) => !repo.fork && !repo.archived);
}

function branchSources(repos: ApiOrgRepo[]): { key: RepoKey; repo: string; branch: string; label: string }[] {
  const sources: { key: RepoKey; repo: string; branch: string; label: string }[] = [];
  for (const repo of repos) {
    sources.push({
      key: repoKeyOf(repo.name),
      repo: repo.full_name,
      branch: repo.default_branch,
      label: repo.default_branch,
    });
    if (repoKeyOf(repo.name) === "openmouse" && repo.default_branch !== "control-panel") {
      sources.push({ key: repoKeyOf(repo.name), repo: repo.full_name, branch: "control-panel", label: "control-panel" });
    }
  }
  return sources;
}

function contributionsOf(person: MergedContributor): number {
  let prs = 0;
  for (const count of Object.values(person.prs)) prs += count ?? 0;
  return person.total + prs;
}

function mergeContributors(branches: BranchData[], pulls: RepoPulls[]): MergedContributor[] {
  const merged = new Map<string, MergedContributor>();
  const upsert = (login: string, avatar: string | null, htmlUrl: string | null): MergedContributor => {
    const entry = merged.get(login) ?? {
      login,
      avatar,
      htmlUrl,
      total: 0,
      repos: {},
      prs: {},
    };
    if (!entry.avatar) entry.avatar = avatar;
    if (!entry.htmlUrl) entry.htmlUrl = htmlUrl;
    merged.set(login, entry);
    return entry;
  };

  for (const branch of branches) {
    for (const author of branch.authors) {
      const entry = upsert(author.login, author.avatar, author.htmlUrl);
      const previous = entry.repos[branch.key] ?? 0;
      entry.repos[branch.key] = Math.max(previous, author.count);
    }
  }

  for (const repoPulls of pulls) {
    for (const author of repoPulls.authors) {
      const entry = upsert(author.login, author.avatar, author.htmlUrl);
      entry.prs[repoPulls.key] = (entry.prs[repoPulls.key] ?? 0) + author.prs;
    }
  }

  for (const entry of merged.values()) {
    let total = 0;
    for (const count of Object.values(entry.repos)) total += count ?? 0;
    entry.total = total;
  }

  return [...merged.values()].sort((a, b) => contributionsOf(b) - contributionsOf(a));
}

async function loadData(): Promise<{ data: CachedData }> {
  const orgRepos = await fetchOrgRepos();
  const repoList: RepoInfo[] = orgRepos.map((repo) => ({
    key: repoKeyOf(repo.name),
    label: repoLabelOf(repo.name),
    fullName: repo.full_name,
  }));

  const branches: BranchData[] = [];
  for (const source of branchSources(orgRepos)) {
    branches.push(await fetchBranch(source.repo, source.branch, source.key, source.label));
  }

  const pulls: RepoPulls[] = [];
  for (const info of repoList) {
    pulls.push(await fetchPulls(info));
  }

  const data: CachedData = {
    fetchedAt: Date.now(),
    branches,
    pulls,
    repoList,
    merged: mergeContributors(branches, pulls),
  };
  writeCache(data);
  return { data };
}

const AMOUNTS = [5, 10, 25, 50, 100];

type DonationType = "once" | "monthly";

const SPONSORS_URL = "https://github.com/sponsors/OpenMouse-Project";

// GitHub Sponsors accepts amount/frequency as query params to preselect a
// tier on their own checkout page. These aren't formally documented as a
// stable API -- worth re-checking that they still land on the right tier
// if GitHub ever changes them; degrades to the plain sponsors page if not.
function sponsorsUrl(type: DonationType, amount: number): string {
  const params = new URLSearchParams({
    frequency: type === "monthly" ? "recurring" : "one-time",
    amount: String(Math.round(amount)),
  });
  return `${SPONSORS_URL}?${params.toString()}`;
}

function LockIcon(): ReactNode {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path fill="currentColor" d="M8 1a2.75 2.75 0 0 0-2.75 2.75V6h-.5A1.75 1.75 0 0 0 3 7.75v5.5C3 14.21 3.79 15 4.75 15h6.5c.96 0 1.75-.79 1.75-1.75v-5.5C13 6.79 12.21 6 11.25 6h-.5V3.75A2.75 2.75 0 0 0 8 1Zm1.5 6.5v4a.75.75 0 0 1-1.5 0v-4a.75.75 0 0 1 1.5 0Zm-4-1h5V3.75a1.25 1.25 0 0 0-2.5 0V6a1 1 0 0 0 0-.25.25.25 0 0 0 .25-.25V3.75a1.25 1.25 0 0 0-2.5 0V5.5a.25.25 0 0 0 .25.25.25.25 0 0 0 0 .25v.5ZM6.25 6V3.75a.75.75 0 0 1 1.5 0V6h-1.5Z" />
    </svg>
  );
}

function formatCurrency(n: number, locale: string): string {
  return new Intl.NumberFormat(locale === "pt" ? "pt-BR" : "en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function formatContributions(n: number, locale: string): string {
  return new Intl.NumberFormat(locale === "pt" ? "pt-BR" : "en-US").format(n);
}

function DonateApp(): ReactNode {
  const [locale, setLocale] = usePageLocale();
  const [type, setType] = useState<DonationType>("once");
  const [amount, setAmount] = useState<number>(10);
  const [custom, setCustom] = useState("");
  const [data, setData] = useState<CachedData>(() => readCache() ?? defaultData());
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const aurora = usePointerAurora();
  const loadingRef = useRef(false);
  const dataRef = useRef<CachedData>(data);
  dataRef.current = data;
  useScrollReveal();

  const refresh = async (): Promise<void> => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      const { data: fresh } = await loadData();
      setData(fresh);
      setError(null);
      setStale(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      if (dataRef.current) setStale(true);
    } finally {
      loadingRef.current = false;
    }
  };

  useEffect(() => {
    if (dataRef.current.fetchedAt === 0) void refresh();
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, REFRESH_MS);
    return () => {
      window.clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const customValue = Number(custom);
  const effectiveAmount = custom.trim() !== "" && Number.isFinite(customValue) && customValue > 0 ? customValue : amount;

  return (
    <div className="land-shell don-shell land-shell--marketing">
      <SiteNav locale={locale} onLocale={setLocale} />

      <main className="land-page">
        <header className="land-page-head don-hero land-aurora" ref={(node) => { aurora.current = node; }} data-reveal>
          <p className="land-kicker">{t(locale, "don.eyebrow")}</p>
          <h1 className="land-page-title">{t(locale, "don.heroA")} {t(locale, "don.heroB")}</h1>
          <p className="land-page-lead">{t(locale, "don.lead")}</p>
          <div className="land-page-actions">
            <a className="land-cta" href={sponsorsUrl(type, effectiveAmount)} target="_blank" rel="noreferrer">
              {t(locale, "don.submit")}
            </a>
            <a className="land-cta-secondary" href="/">{t(locale, "don.skip")}</a>
          </div>
        </header>

        <section className="land-section land-grid land-grid--two don-cards" aria-label="Support options">
          <article className="land-card" data-reveal>
            <span className="don-avatar-wrap">
              <img className="don-avatar" src="/favicon-dark.svg" alt="" width={64} height={64} />
            </span>
            <h2>{t(locale, "don.profileTitle")}</h2>
            <p className="don-role">{t(locale, "don.profileRole")}</p>
            <p>{t(locale, "don.profileB1")}</p>
            <p>{t(locale, "don.profileB2")}</p>
            <p className="don-thanks">{t(locale, "don.thanks")}</p>
            <p className="don-optional">{t(locale, "don.optional")}</p>
          </article>

          <article className="land-card don-form-card" data-reveal>
            <div className="don-field">
              <span className="don-label">{t(locale, "don.type")}</span>
              <div className="don-seg" role="tablist" aria-label={t(locale, "don.type")}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={type === "once"}
                  className={`don-seg-btn${type === "once" ? " is-on" : ""}`}
                  onClick={() => setType("once")}
                >
                  {t(locale, "don.once")}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={type === "monthly"}
                  className={`don-seg-btn${type === "monthly" ? " is-on" : ""}`}
                  onClick={() => setType("monthly")}
                >
                  {t(locale, "don.monthly")}
                </button>
              </div>
            </div>

            <div className="don-field">
              <span className="don-label">{t(locale, "don.amount")}</span>
              <div className="don-amounts">
                {AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    className={`don-amount${amount === amt && custom.trim() === "" ? " is-on" : ""}`}
                    aria-pressed={amount === amt && custom.trim() === ""}
                    onClick={() => { setAmount(amt); setCustom(""); }}
                  >
                    ${amt}
                  </button>
                ))}
              </div>
            </div>

            <div className="don-field">
              <span className="don-label">{t(locale, "don.custom")}</span>
              <div className="don-custom">
                <span className="don-currency">$</span>
                <input
                  type="number"
                  min="1"
                  placeholder={t(locale, "don.customPh")}
                  value={custom}
                  onInput={(event) => setCustom((event.target as HTMLInputElement).value)}
                />
              </div>
            </div>

            <p className="land-note don-charge">
              {type === "once"
                ? tp(locale, "don.chargeOnce", { v: formatCurrency(effectiveAmount, locale) })
                : tp(locale, "don.chargeMonthly", { v: formatCurrency(effectiveAmount, locale) })}
            </p>

            <a
              className="land-cta don-submit"
              href={sponsorsUrl(type, effectiveAmount)}
              target="_blank"
              rel="noreferrer"
            >
              <LockIcon />
              {t(locale, "don.submit")}
            </a>
          </article>
        </section>

        <section className="land-section" aria-label={t(locale, "don.contribTitle")}>
          <div className="land-section-head" data-reveal>
            <p className="land-kicker">{t(locale, "don.contribEyebrow")}</p>
            <h2>{t(locale, "don.contribTitle")}</h2>
          </div>
          {error ? (
            <p className="don-error" role="alert">
              {stale ? t(locale, "don.stale") : ""}{tp(locale, "don.apiFail", { msg: error })}
            </p>
          ) : null}
          <div className="land-grid don-contrib-grid">
            {data.merged.map((c) => {
              const count = c.total;
              return (
                <a
                  key={c.login}
                  href={c.htmlUrl ?? `https://github.com/${c.login}`}
                  target="_blank"
                  rel="noreferrer"
                  className="land-card don-contrib-card"
                  data-reveal
                  title={`${c.login} · ${count === 1 ? tp(locale, "don.contribOne", { n: formatContributions(count, locale) }) : tp(locale, "don.contribs", { n: formatContributions(count, locale) })}`}
                >
                  {c.avatar ? (
                    <img src={`${c.avatar}?s=64`} alt={c.login} loading="lazy" width={64} height={64} />
                  ) : (
                    <span className="don-avatar-fallback" aria-hidden="true">
                      {c.login.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <span className="don-contrib-name">{c.login}</span>
                  <span className="don-contrib-count">
                    {count === 1 ? tp(locale, "don.contribOne", { n: formatContributions(count, locale) }) : tp(locale, "don.contribs", { n: formatContributions(count, locale) })}
                  </span>
                </a>
              );
            })}
          </div>
          <div className="don-contrib-more">
            <a className="land-cta-secondary" href={GITHUB_URL} target="_blank" rel="noreferrer">
              {t(locale, "don.seeAll")}
            </a>
          </div>
        </section>
      </main>

      <footer className="don-footer">
        <div className="don-footer-grid">
          <div className="don-fbrand">
            <a className="don-fwordmark" href="/">OpenMouse Project</a>
            <p className="don-ftagline">{t(locale, "don.tagline")}</p>
          </div>

          <div className="don-fcol">
            <h3>{t(locale, "don.pages")}</h3>
            <a href="/">{t(locale, "don.home")}</a>
            <a href="/supported.html">{t(locale, "don.devices")}</a>
            <a href="/check.html">{t(locale, "don.check")}</a>
            <a href="https://docs.openmouse.app">{t(locale, "don.contribute")}</a>
          </div>

          <div className="don-fcol">
            <h3>{t(locale, "don.contributeCol")}</h3>
            <GitHubLink locale={locale} />
            <a href="https://github.com/OpenMouse-Project/openmouse/issues" target="_blank" rel="noreferrer">{t(locale, "don.reportIssue")}</a>
            <a href="https://github.com/OpenMouse-Project/openmouse/discussions" target="_blank" rel="noreferrer">{t(locale, "don.discussions")}</a>
            <a href="https://github.com/OpenMouse-Project/openmouse" target="_blank" rel="noreferrer">{t(locale, "don.source")}</a>
          </div>

          <div className="don-fcol">
            <h3>{t(locale, "don.community")}</h3>
            <div className="don-fsocial">
              <a href={GITHUB_URL} target="_blank" rel="noreferrer" aria-label="GitHub">
                <GitHubIcon />
              </a>
              <a href="https://discord.gg/yxC9jzMdw6" target="_blank" rel="noreferrer" aria-label="Discord">
                <DiscordIcon />
              </a>
              <a href="https://x.com/openmouseapp" target="_blank" rel="noreferrer" aria-label="X / Twitter">
                <TwitterIcon />
              </a>
            </div>
          </div>
        </div>

        <div className="don-footer-bottom">
          <p>
            {tp(locale, "don.rights", { year: new Date().getFullYear() })}
            <a href="/privacy.html" className="don-flegal">{t(locale, "don.privacy")}</a>
            <a href="/terms.html" className="don-flegal">{t(locale, "don.terms")}</a>
          </p>
          <p>{t(locale, "don.created")} <a href={GITHUB_URL} target="_blank" rel="noreferrer">{t(locale, "don.theCommunity")}</a> {t(locale, "don.and")} <a href="/donate.html">{t(locale, "don.contributors")}</a>.</p>
        </div>
      </footer>
    </div>
  );
}

const root = document.querySelector<HTMLDivElement>("#donate-app");
if (!root) throw new Error("donate-app root not found");
createRoot(root).render(<DonateApp />);

registerServiceWorker();
mountOfflineBanner();
