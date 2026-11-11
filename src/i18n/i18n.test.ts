import assert from "node:assert/strict";
import test from "node:test";

import { batteryStateText, connectLabelText, ensureLocale, LOCALE_NAME_KEYS, missingTranslations, t, textDirection, tp } from "./index.ts";
import { tr } from "./locales/tr.ts";

test("i18n falls back to English until the locale table resolves", async () => {
  assert.equal(t("pt", "nav.settings"), "Settings");
  await ensureLocale("pt");
  assert.equal(t("pt", "nav.settings"), "Configurações");
  assert.equal(t("en", "nav.settings"), "Settings");
  assert.ok(t("pt", "set.reset").length > 0);
  assert.equal(t("pt", "ov.firmware"), "FIRMWARE");
});

test("i18n maps known battery states and passes unknown ones through", () => {
  assert.equal(batteryStateText("pt", "Discharging"), "Descarregando");
  assert.equal(batteryStateText("en", "Discharging"), "Discharging");
  assert.equal(batteryStateText("pt", "SomeFutureState"), "SomeFutureState");
});

test("i18n maps known connect labels and passes dynamic ones through", () => {
  assert.equal(connectLabelText("pt", "Add device"), "Adicionar dispositivo");
  assert.equal(connectLabelText("en", "Add device"), "Add device");
  assert.equal(connectLabelText("pt", "Use Add device if lost"), "Use Add device if lost");
});

test("every locale translates every key", async () => {
  assert.deepEqual(await missingTranslations(), []);
});

test("Turkish is selectable and loads the public website copy", async () => {
  await ensureLocale("tr");
  assert.ok(LOCALE_NAME_KEYS.some(([code, key]) => code === "tr" && t("tr", key) === "Türkçe"));
  assert.equal(textDirection("tr"), "ltr");
  assert.equal(t("tr", "land.hero"), "Her fare için tek uygulama.");
  assert.equal(t("tr", "land.download"), "İndir");
  assert.equal(t("tr", "faq.title"), "Sık sorulan sorular");
  assert.equal(t("tr", "supp.title"), "Desteklenen cihazlar");
  assert.equal(tp("tr", "chk.testing", { n: 2, s: "s" }), "2 cihaz test ediliyor…");
  assert.equal(tp("tr", "don.chargeMonthly", { v: "$5" }), "GitHub Sponsors üzerinden her ay $5 bağış yapacaksınız.");
});

test("Turkish templates preserve substitution values without English plural suffixes", () => {
  const placeholders = (value: string) => [...value.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
  for (const key of Object.keys(tr) as Array<keyof typeof tr>) {
    const source = t("en", key);
    const pluralSuffix = /\w\{s\}/.test(source);
    assert.deepEqual(placeholders(tr[key]), placeholders(source).filter((name) => !pluralSuffix || name !== "s"), key);
  }
});

test("Turkish covers the restructured site's new pages and reordered templates", async () => {
  await ensureLocale("tr");
  assert.equal(t("tr", "contact.title"), "Bize ulaşın");
  assert.equal(t("tr", "foot.contact"), "İletişim");
  assert.equal(t("tr", "tools.polling.title"), "Yoklama hızı testi");
  assert.equal(t("tr", "chk.verdict.partial"), "Kısmi");
  assert.equal(tp("tr", "lp.coverage", { models: 123, brands: 12 }), "12 markanın 123 fare modeliyle çalışır.");
  assert.equal(tp("tr", "lp.sponsorVisit", { name: "HONE" }), "HONE sitesini ziyaret edin");
  assert.equal(tp("tr", "rot.few", { n: 2, min: 5 }), "Yalnızca 2 hareket sayıldı. En az 5 kez hareket ettirip tekrar deneyin.");
  assert.equal(tp("tr", "poll.nearest", { hz: 1000 }), "En yakın standart hız: 1000 Hz");
  assert.match(t("tr", "land.screenshotAlt"), /Razer Viper V3 Pro/);
});

test("the new shared keys preserve existing locales and the native Turkish label", async () => {
  for (const [locale] of LOCALE_NAME_KEYS) {
    await ensureLocale(locale);
    assert.equal(t(locale, "set.turkish"), "Türkçe");
    for (const key of ["land.faq", "land.screenshotAlt", "land.bridgeAlt", "chk.verdict.full", "chk.verdict.partial", "chk.verdict.limited", "chk.verdict.blocked", "chk.verdict.unknown"] as const) {
      assert.equal(t(locale, key), locale === "tr" ? tr[key] : t("en", key));
    }
  }
});
