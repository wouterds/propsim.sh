// Any host works. The check is whether a value stays on the origin it was
// anchored to, and reading the request's own Host header trusts the caller.
const ANCHOR = "https://propsim.invalid";

/**
 * A path on this site, or the dashboard.
 *
 * Resolved rather than pattern matched. The url parser drops tab, cr and lf
 * before parsing, so `/\t/host` passes a check on the leading slashes and
 * arrives as `//host`.
 */
export const safeReturn = (value: string | null) => {
  if (!value?.startsWith("/")) {
    return "/dash";
  }

  const url = new URL(value, ANCHOR);
  const next = url.pathname + url.search;

  if (url.origin !== ANCHOR || next.startsWith("//")) {
    return "/dash";
  }

  // Everything under /auth, not just the page itself: /auth/google hands
  // straight back to Google, so returning to it after a sign in is a loop.
  if (url.pathname === "/auth" || url.pathname.startsWith("/auth/")) {
    return "/dash";
  }

  if (url.pathname.endsWith(".data")) {
    return "/dash";
  }

  return next;
};

/**
 * The page a request was for.
 *
 * A client side navigation asks for `/terminal.data` with its own routing
 * params, so `request.url` names a path no route matches.
 */
export const asPage = (url: URL) => {
  const path = url.pathname.replace(/\.data$/, "");
  const params = new URLSearchParams(url.search);
  params.delete("_routes");

  const query = params.toString();

  return query ? `${path}?${query}` : path;
};
