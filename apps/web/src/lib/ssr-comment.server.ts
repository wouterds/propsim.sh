import { Transform } from "node:stream";

// The wordmark carries a backtick and backslashes, so it is a list of plain
// strings rather than a template.
const MARK = [
  "                             _                 _",
  "   _ __  _ __ ___  _ __  ___(_)_ __ ___    ___| |__",
  "  | '_ \\| '__/ _ \\| '_ \\/ __| | '_ ` _ \\  / __| '_ \\",
  "  | |_) | | | (_) | |_) \\__ \\ | | | | | |_\\__ \\ | | |",
  "  | .__/|_|  \\___/| .__/|___/_|_| |_| |_(_)___/_| |_|",
  "  |_|             |_|",
].join("\n");

/** A value that closed the comment early would put markup on the page. */
const safe = (value: string) => value.replace(/--/g, "- -");

const REGIONS = new Intl.DisplayNames(["en"], { type: "region" });

const country = (raw: string | null) => {
  const code = raw ?? "";

  if (code.length !== 2) {
    return null;
  }

  try {
    return REGIONS.of(code) ?? code;
  } catch {
    return code;
  }
};

/**
 * Cloudflare adds the city and the region only when the visitor location
 * transform is on, so each line is written when it arrives and left out when it
 * does not.
 */
export const ssrComment = (request: Request) => {
  const header = (name: string) => request.headers.get(name)?.trim() || null;
  const ray = header("cf-ray");
  const ip = header("cf-connecting-ip");

  const place = [header("cf-ipcity"), header("cf-region"), country(header("cf-ipcountry"))]
    .filter((part): part is string => Boolean(part))
    .join(", ");

  const build = (process.env.COMMIT_SHA ?? "dev").slice(0, 7);
  const stamp = process.env.BUILD_TIMESTAMP;

  const lines = [
    ray && ` ray: ${safe(ray)}`,
    ip && ` ip: ${safe(ip)}`,
    place && ` location: ${safe(place)}`,
  ].filter((line): line is string => Boolean(line));

  const sections = [
    [MARK],
    lines,
    [stamp ? ` build: ${safe(build)} (${safe(stamp)})` : ` build: ${safe(build)}`],
    [` © ${new Date().getFullYear()} propsim.sh - https://propsim.sh`],
  ].filter((section) => section.length > 0);

  return `<!--\n${sections.map((section) => section.join("\n")).join("\n\n")}\n\n-->`;
};

/** Slots the comment in after the doctype, on the first chunk that carries it. */
export const commentAfterDoctype = (comment: string) => {
  const doctype = "<!DOCTYPE html>";
  let done = false;

  return new Transform({
    transform(chunk, _encoding, callback) {
      if (done) {
        callback(null, chunk);

        return;
      }

      const text = chunk.toString("utf8");
      const at = text.indexOf(doctype);

      if (at === -1) {
        callback(null, chunk);

        return;
      }

      done = true;
      const end = at + doctype.length;

      callback(null, Buffer.from(`${text.slice(0, end)}\n${comment}\n${text.slice(end)}`, "utf8"));
    },
  });
};
