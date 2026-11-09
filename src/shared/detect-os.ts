export type DesktopOs = "windows" | "mac" | "linux" | null;

/** The visitor's desktop OS, or null on phones, tablets and anything unrecognised. */
export function detectOs(): DesktopOs {
  const nav = navigator as Navigator & { userAgentData?: { platform?: string; mobile?: boolean } };
  if (nav.userAgentData?.mobile) return null;
  const hint = `${nav.userAgentData?.platform ?? ""} ${nav.platform} ${nav.userAgent}`.toLowerCase();
  if (/android|iphone|ipad|ipod|cros/.test(hint)) return null;
  if (/win/.test(hint)) return "windows";
  if (/mac/.test(hint)) return "mac";
  if (/linux|x11/.test(hint)) return "linux";
  return null;
}
