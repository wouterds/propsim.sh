export type Network = "twitter" | "youtube" | "twitch";

type Rule = {
  /** Addresses a handle is commonly copied out of. */
  hosts: string[];
  /** Path segments that introduce something other than a handle. */
  refuse?: { segment: string; because: string }[];
  allowed: RegExp;
  wrong: string;
};

const RULES: Record<Network, Rule> = {
  twitter: {
    hosts: ["x.com", "twitter.com"],
    allowed: /^[A-Za-z0-9_]{1,15}$/,
    wrong: "An X handle is up to 15 letters, numbers or underscores.",
  },
  youtube: {
    hosts: ["youtube.com", "youtu.be"],
    // A channel id is not a handle, and the profile links to the handle form.
    refuse: [
      { segment: "channel", because: "Use the @handle from the channel, not the channel id." },
      { segment: "c", because: "Use the @handle from the channel." },
      { segment: "user", because: "Use the @handle from the channel." },
    ],
    allowed: /^[A-Za-z0-9._-]{3,30}$/,
    wrong: "A YouTube handle is 3 to 30 letters, numbers, dots, dashes or underscores.",
  },
  twitch: {
    hosts: ["twitch.tv"],
    allowed: /^[A-Za-z0-9_]{4,25}$/,
    wrong: "A Twitch name is 4 to 25 letters, numbers or underscores.",
  },
};

const withoutHost = (value: string, hosts: string[]) => {
  const bare = value.replace(/^[a-z]+:\/\//i, "").replace(/^www\.|^m\.|^mobile\./i, "");
  const host = hosts.find((one) => bare.toLowerCase().startsWith(`${one}/`));

  return host ? bare.slice(host.length + 1) : value.replace(/^[a-z]+:\/\//i, "");
};

export type Read = { handle: string | null; error: string | null };

/**
 * The handle out of whatever was pasted. People paste the whole address, or the
 * address with an @ in front of it, or the handle on its own, and all three mean
 * the same account. Storing them apart makes one profile look like three.
 *
 * Answers an error rather than a guess when what is left cannot be a handle, so
 * a typed address never reaches the profile as a dead link.
 */
export const readHandle = (network: Network, raw: string): Read => {
  const rule = RULES[network];
  const trimmed = raw.trim();

  if (trimmed === "") {
    return { handle: null, error: null };
  }

  const path = withoutHost(trimmed, rule.hosts);
  const [first = "", second = ""] = path.split(/[?#]/)[0].split("/").filter(Boolean);
  const refused = rule.refuse?.find((one) => one.segment === first.toLowerCase());

  if (refused) {
    return { handle: null, error: refused.because };
  }

  // `@` is decoration everywhere it appears, so it never reaches the column.
  const handle = (first.startsWith("@") ? first.slice(1) : first) || second;

  if (!rule.allowed.test(handle)) {
    return { handle: null, error: rule.wrong };
  }

  return { handle, error: null };
};

/** Where a stored handle points. Built here, never taken from what was typed. */
export const linkTo = (network: Network, handle: string) => {
  if (network === "twitter") return `https://x.com/${handle}`;
  if (network === "youtube") return `https://youtube.com/@${handle}`;

  return `https://twitch.tv/${handle}`;
};
