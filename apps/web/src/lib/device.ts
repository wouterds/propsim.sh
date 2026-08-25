export type DeviceKind = "desktop" | "mobile" | "tablet" | "bot" | "unknown";

export type Device = {
  browser: string | null;
  os: string | null;
  kind: DeviceKind;
};

// Order matters. Edge and Opera also say Chrome, and Chrome also says Safari.
const BROWSERS: [RegExp, string][] = [
  [/\bEdg(?:e|A|iOS)?\//, "Edge"],
  [/\bOPR\/|\bOpera\//, "Opera"],
  [/\bBrave\//, "Brave"],
  [/\bVivaldi\//, "Vivaldi"],
  [/\bSamsungBrowser\//, "Samsung Internet"],
  [/\bFirefox\/|\bFxiOS\//, "Firefox"],
  [/Chrome\/|\bCriOS\//, "Chrome"],
  [/\bSafari\//, "Safari"],
];

const SYSTEMS: [RegExp, string][] = [
  [/\bWindows NT\b/, "Windows"],
  [/\biPhone\b|\biPod\b/, "iOS"],
  [/\biPad\b/, "iPadOS"],
  [/\bAndroid\b/, "Android"],
  [/\bMac OS X\b|\bMacintosh\b/, "macOS"],
  [/\bCrOS\b/, "ChromeOS"],
  [/\bLinux\b|\bX11\b/, "Linux"],
];

const BOT = /bot\b|crawler|spider|curl\/|wget\/|python-requests|headless/i;

const first = (agent: string, table: [RegExp, string][]) =>
  table.find(([pattern]) => pattern.test(agent))?.[1] ?? null;

const kindOf = (agent: string, os: string | null): DeviceKind => {
  if (BOT.test(agent)) return "bot";
  if (os === "iPadOS" || /\bTablet\b/i.test(agent)) return "tablet";
  if (os === "iOS" || /\bMobile\b/.test(agent)) return "mobile";
  if (os === "Android") return /\bMobile\b/.test(agent) ? "mobile" : "tablet";
  if (os) return "desktop";

  return "unknown";
};

/** A label, not an identity. Browsers are reducing this string on purpose. */
export const readDevice = (userAgent: string | null): Device => {
  const agent = userAgent?.trim() ?? "";

  if (!agent) {
    return { browser: null, os: null, kind: "unknown" };
  }

  const os = first(agent, SYSTEMS);

  return { browser: first(agent, BROWSERS), os, kind: kindOf(agent, os) };
};

export const describeDevice = ({ browser, os }: Pick<Device, "browser" | "os">) => {
  if (browser && os) return `${browser} on ${os}`;

  return browser ?? os ?? "Unknown device";
};
