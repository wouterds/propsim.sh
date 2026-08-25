import ipaddr from "ipaddr.js";

// Set at Cloudflare's edge and carried through the tunnel. Absent locally.
const CLIENT_IP = "cf-connecting-ip";
const COUNTRY = "cf-ipcountry";
const FORWARDED = "x-forwarded-for";

// Answered for an address Cloudflare cannot place, and for Tor.
const UNKNOWN_COUNTRY = new Set(["XX", "T1"]);

export type Origin = {
  ip: string | null;
  country: string | null;
  userAgent: string | null;
};

/** The client can prepend to the chain, so only the first entry is read. */
/** IPv6 hosts rotate their low 64 bits, so the /64 prefix is the stable part. */
export const normalizeIp = (ip: string) => {
  if (!ipaddr.isValid(ip)) {
    return ip;
  }

  const address = ipaddr.parse(ip);

  if (!(address instanceof ipaddr.IPv6) || address.isIPv4MappedAddress()) {
    return ip;
  }

  return new ipaddr.IPv6([...address.parts.slice(0, 4), 0, 0, 0, 0]).toString();
};

const ipOf = (headers: Headers) => {
  const direct = headers.get(CLIENT_IP)?.trim();

  if (direct) {
    return normalizeIp(direct);
  }

  const first = headers.get(FORWARDED)?.split(",")[0]?.trim();

  return first ? normalizeIp(first) : null;
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
