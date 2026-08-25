import { MessageSquare } from "lucide-react";
import { href, Link, Outlet } from "react-router";
import VoteButton from "~/components/board/vote-button";
import { PRIMARY_SM } from "~/components/ui/button";
import { getUserId, requireUserId } from "~/lib/auth.server";
import { featurePath, isUuid } from "~/lib/board";
import { listFeatures, toggleVote } from "~/lib/board.server";
import { pageMeta } from "~/lib/seo";
import type { Route } from "./+types/features";

export const meta: Route.MetaFunction = () =>
  pageMeta({
    title: "Feature requests, propsim.sh",
    description:
      "What people want the simulator to do next, in the order they want it. Vote on a request or add one.",
    path: "/feature-requests",
  });

export const loader = async ({ request }: Route.LoaderArgs) => {
  const userId = await getUserId(request);

  return { features: await listFeatures(userId), signedIn: userId !== null };
};

export const action = async ({ request }: Route.ActionArgs) => {
  const userId = await requireUserId(request);
  const form = await request.formData();
  const id = String(form.get("id") ?? "");

  if (isUuid(id)) {
    await toggleVote("request", id, userId);
  }

  return null;
};

// The title covers the whole row with a pseudo element. Without this the row
// swallows the arrow, because a positioned overlay paints over a static button.
const ABOVE_OVERLAY = "relative z-10";

const Features = ({ loaderData }: Route.ComponentProps) => {
  const { features, signedIn } = loaderData;
  const board = href("/feature-requests");

  return (
    <>
      <section className="border-line/70 border-b">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <div className="max-w-3xl">
            <h1 className="font-semibold text-4xl text-ink leading-[1.1] tracking-tight">
              Feature requests
            </h1>
            <p className="mt-6 text-muted leading-relaxed">
              What people want the simulator to do next. Vote on what you would use, and write down
              what is missing. Nothing here is a promise about when.
            </p>

            <div className="mt-12 flex items-center justify-between gap-4">
              <p className="text-[11px] text-faint uppercase tracking-wider">
                {features.length === 0 ? "Nothing yet" : "Most wanted first"}
              </p>

              <Link
                to={
                  signedIn
                    ? href("/feature-requests/new")
                    : `/auth?r=${encodeURIComponent("/feature-requests/new")}`
                }
                className={PRIMARY_SM}
              >
                Add a request
              </Link>
            </div>

            {features.length === 0 ? (
              <div className="mt-4 rounded-xl border border-line bg-raised/40 px-6 py-16 text-center">
                <p className="text-muted text-sm">Nobody has asked for anything yet.</p>
                <p className="mt-1.5 text-faint text-sm">The first request is yours to make.</p>
              </div>
            ) : (
              <ul className="mt-4 divide-y divide-line/70 overflow-hidden rounded-xl border border-line">
                {features.map((feature) => (
                  <li
                    key={feature.id}
                    className="relative flex items-center gap-4 bg-raised/40 px-4 py-3.5 transition-colors hover:bg-overlay/60"
                  >
                    <div className={ABOVE_OVERLAY}>
                      <VoteButton
                        votes={feature.votes}
                        voted={feature.voted}
                        path={board}
                        fields={signedIn ? { id: feature.id } : null}
                      />
                    </div>

                    <Link
                      to={featurePath(feature.id, feature.title)}
                      className="min-w-0 flex-1 rounded-sm font-medium text-ink after:absolute after:inset-0 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
                    >
                      {feature.title}
                    </Link>

                    <span className="flex shrink-0 items-center gap-1.5 text-faint text-xs tabular">
                      <MessageSquare aria-hidden="true" className="size-3.5" strokeWidth={1.5} />
                      {feature.comments}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <Outlet />
    </>
  );
};

export default Features;
