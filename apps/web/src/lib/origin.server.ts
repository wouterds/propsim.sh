// Cloudflare sets these at its edge and the tunnel carries them through, so they
// are the caller's address rather than the proxy's. Both are absent in local
// development, and a missing value is stored as a missing value.
const CLIENT_IP = "cf-connecting-ip";
const COUNTRY = "cf-ipcountry";
const FORWARDED = "x-forwarded-for";

// Cloudflare answers this for an address it cannot place, and for its own probes.
const UNKNOWN_COUNTRY = new Set(["XX", "T1"]);

export type Origin = {
  ip: string | null;
  country: string | null;
  userAgent: string | null;
};

/**
 * `x-forwarded-for` is a chain the client can prepend to, so only its first
 * entry is read and only when Cloudflare gave nothing better.
 */
const ipOf = (headers: Headers) => {
  const direct = headers.get(CLIENT_IP)?.trim();

  if (direct) {
    return direct;
  }

  const first = headers.get(FORWARDED)?.split(",")[0]?.trim();

  return first || null;
};

const countryOf = (headers: Headers) => {
  const code = headers.get(COUNTRY)?.trim().toUpperCase() ?? "";

  if (code.length !== 2 || UNKNOWN_COUNTRY.has(code)) {
    return null;
  }

  return code;
};

export const readOrigin = ({ headers }: Request): Origin => ({
  ip: ipOf(headers),
  country: countryOf(headers),
  userAgent: headers.get("user-agent")?.slice(0, 512) ?? null,
});
