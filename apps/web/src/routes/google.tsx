import { redirect } from "react-router";
import { handoff, newState, startUrl } from "~/lib/google.server";
import { asPage } from "~/lib/redirect.server";
import type { Route } from "./+types/google";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const state = newState();
  const back = new URL(request.url).searchParams.get("r");

  throw redirect(startUrl(state), {
    headers: {
      "Set-Cookie": await handoff.serialize({ state, back: back ?? asPage(new URL(request.url)) }),
    },
  });
};
