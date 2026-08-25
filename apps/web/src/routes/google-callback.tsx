import { href, redirect } from "react-router";
import { handoff, readGoogleUser } from "~/lib/google.server";
import { hashPassword } from "~/lib/password.server";
import { signIn } from "~/lib/sign-in.server";
import { newToken } from "~/lib/token.server";
import { createUser, findUserByEmail, markEmailVerified } from "~/lib/users.server";
import type { Route } from "./+types/google-callback";

type Handoff = { state?: string; back?: string | null };

const refused = (reason: string) => redirect(`${href("/auth")}?google=${reason}`);

export const loader = async ({ request }: Route.LoaderArgs) => {
  const url = new URL(request.url);
  const sent = (await handoff.parse(request.headers.get("Cookie"))) as Handoff | null;

  if (url.searchParams.get("error") || !url.searchParams.get("code")) {
    throw refused("cancelled");
  }

  // The state has to come back from Google and match the cookie, or the code
  // was planted by somebody else.
  if (!sent?.state || sent.state !== url.searchParams.get("state")) {
    throw refused("state");
  }

  const google = await readGoogleUser(url.searchParams.get("code") ?? "").catch(() => null);

  if (!google) {
    throw refused("failed");
  }

  // An unverified address at Google proves nothing, and linking on it would
  // hand over any account whose address somebody else claimed.
  if (!google.verified) {
    throw refused("unverified");
  }

  const existing = await findUserByEmail(google.email);

  if (existing) {
    if (!existing.verifiedEmailAt) {
      await markEmailVerified(existing.id);
    }

    return signIn(request, existing, sent.back ?? null);
  }

  // Signing in with Google when there is no account signs you up. There is no
  // password to set, so an unguessable one stands in until a reset replaces it.
  const id = await createUser(google.email, await hashPassword(newToken()));
  await markEmailVerified(id);

  return signIn(request, { id, email: google.email }, sent.back ?? null);
};
