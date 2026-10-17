import { useEffect, useState, type ReactNode } from "react";
import {
  detectLocale,
  loadInterfacePreferences,
  saveInterfacePreferences,
  type InterfaceLocale,
} from "./interface-preferences";
import { ensureLocale, LOCALE_NAME_KEYS, t, textDirection } from "../i18n/index";

const HTML_LANG: Partial<Record<InterfaceLocale, string>> = {
  pt: "pt-BR",
  zh: "zh-Hans",
};

export function usePageLocale(): [InterfaceLocale, (next: InterfaceLocale) => void] {
  const [locale, setLocaleState] = useState<InterfaceLocale>(() => {
    try {
      return loadInterfacePreferences(window.localStorage).locale;
    } catch {
      return detectLocale();
    }
  });
  const setLocale = (next: InterfaceLocale): void => {
    // Resolve the table before committing so the switch never flashes
    // English fallback strings.
    const apply = (): void => {
      setLocaleState(next);
      try {
        const prefs = loadInterfacePreferences(window.localStorage);
        saveInterfacePreferences(window.localStorage, { ...prefs, locale: next });
      } catch {
        /* storage unavailable (private mode) — in-memory choice still applies */
      }
    };
    if (next === "en") apply();
    else void ensureLocale(next).then(apply);
  };
  // A stored non-English locale resolves after first paint; bump a tick to
  // swap the fallback strings once the table arrives.
  const [, setTick] = useState(0);
  useEffect(() => {
    try {
      document.documentElement.lang = HTML_LANG[locale] ?? locale;
      document.documentElement.dir = textDirection(locale);
    } catch {
      /* non-DOM environment (tests) */
    }
    if (locale !== "en") void ensureLocale(locale).then(() => setTick((n) => n + 1));
  }, [locale]);
  return [locale, setLocale];
}

export function PageLocaleToggle({
  locale,
  onChange,
}: {
  locale: InterfaceLocale;
  onChange: (next: InterfaceLocale) => void;
}): ReactNode {
  return (
    <select
      className="page-locale-select"
      aria-label={t(locale, "page.locale")}
      value={locale}
      onChange={(event) => onChange(event.currentTarget.value as InterfaceLocale)}
    >
      {LOCALE_NAME_KEYS.map(([option, nameKey]) => (
        <option key={option} value={option}>{t(locale, nameKey)}</option>
      ))}
    </select>
  );
}
