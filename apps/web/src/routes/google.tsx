import { redirect } from "react-router";
import { handoff, newState, startUrl } from "~/lib/google.server";
import type { Route } from "./+types/google";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const state = newState();
  const back = new URL(request.url).searchParams.get("r");

  throw redirect(startUrl(state), {
    headers: {
      // No default: this route's own address is the only thing the request
      // carries, and coming back to it after signing in goes to Google again.
      "Set-Cookie": await handoff.serialize({ state, back }),
    },
  });
};
