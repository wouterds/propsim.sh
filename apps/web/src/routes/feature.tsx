import { ChevronLeft } from "lucide-react";
import { href, Link, redirect, useNavigation, useSearchParams } from "react-router";
import Byline from "~/components/board/byline";
import CommentForm from "~/components/board/comment-form";
import VoteButton from "~/components/board/vote-button";
import { getUserId, requireUserId } from "~/lib/auth.server";
import { featureIdOf, featurePath, isUuid } from "~/lib/board";
import {
  createComment,
  findComment,
  findFeature,
  listComments,
  toggleVote,
} from "~/lib/board.server";
import { pageMeta } from "~/lib/seo";
import type { Route } from "./+types/feature";

const COMMENT_LIMIT = 2000;

const missing = () => new Response("Not found", { status: 404 });

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const id = featureIdOf(params.slug);

  if (!id) {
    throw missing();
  }

  const userId = await getUserId(request);
  const feature = await findFeature(id, userId);

  if (!feature) {
    throw missing();
  }

  const path = featurePath(feature.id, feature.title);

  // A reworded title leaves the old address in circulation. One canonical page
  // rather than a second copy of it under every title it ever had.
  if (path !== `/feature-requests/${params.slug}`) {
    throw redirect(path);
  }

  return {
    feature,
    comments: await listComments(id, userId),
    signedIn: userId !== null,
    path,
  };
};

export const meta: Route.MetaFunction = ({ loaderData }) => {
  // Nothing loaded means the request was not found, and the boundary is what
  // renders. Reading through it here would throw before that could happen.
  if (!loaderData) {
    return [{ title: "Nothing here, propsim.sh" }];
  }

  return pageMeta({
    title: `${loaderData.feature.title}, propsim.sh`,
    description: loaderData.feature.description.slice(0, 160),
    path: loaderData.path,
  });
};

export const action = async ({ request, params }: Route.ActionArgs) => {
  const id = featureIdOf(params.slug);

  if (!id) {
    throw missing();
  }

  const userId = await requireUserId(request);
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "");

  if (intent === "vote") {
    await toggleVote("request", id, userId);

    return null;
  }

  if (intent === "vote-comment") {
    const commentId = String(form.get("id") ?? "");
    const comment = isUuid(commentId) ? await findComment(commentId) : null;

    // A reply is drawn without an arrow, so a vote on one did not come from here.
    if (comment && comment.featureId === id && !comment.parentId) {
      await toggleVote("comment", commentId, userId);
    }

    return null;
  }

  if (intent !== "comment") {
    return null;
  }

  const body = String(form.get("body") ?? "").trim();

  if (!body) {
    return { error: "Write something first." };
  }

  if (body.length > COMMENT_LIMIT) {
    return { error: "That is longer than the form takes." };
  }

  const parentId = String(form.get("parentId") ?? "");
  const parent = isUuid(parentId) ? await findComment(parentId) : null;

  if (parentId && parent?.featureId !== id) {
    return { error: "There is nothing left there to answer." };
  }

  // One level deep. An answer to a reply hangs off the comment they both sit
  // under, so the thread cannot grow a third rail.
  await createComment(id, userId, body, parent ? (parent.parentId ?? parent.id) : null);

  return redirect(`/feature-requests/${params.slug}`);
};

const QUIET_LINK =
  "rounded-sm text-faint text-xs transition-colors hover:text-muted focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent";

const Feature = ({ loaderData, actionData }: Route.ComponentProps) => {
  const { feature, comments, signedIn, path } = loaderData;
  const [params] = useSearchParams();
  const navigation = useNavigation();

  const busy = navigation.state !== "idle";
  const replyTo = params.get("reply");
  const total = comments.reduce((sum, comment) => sum + 1 + comment.replies.length, 0);

  return (
    <section className="border-line/70 border-b">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <div className="max-w-3xl">
          <Link
            to={href("/feature-requests")}
            className={`inline-flex items-center gap-1 ${QUIET_LINK}`}
          >
            <ChevronLeft aria-hidden="true" className="size-3.5" strokeWidth={1.5} />
            Feature requests
          </Link>

          <div className="mt-6 flex items-start gap-5">
            <VoteButton
              votes={feature.votes}
              voted={feature.voted}
              path={path}
              fields={signedIn ? { intent: "vote" } : null}
            />

            <div className="min-w-0">
              <h1 className="font-semibold text-3xl text-ink leading-tight tracking-tight">
                {feature.title}
              </h1>

              <div className="mt-3">
                <Byline author={feature.author} since={feature.since} />
              </div>
            </div>
          </div>

          <p className="mt-8 whitespace-pre-line text-muted leading-relaxed">
            {feature.description}
          </p>

          <div className="mt-14 border-line/70 border-t pt-10">
            <h2 className="font-semibold text-ink text-lg tracking-tight">Discussion</h2>
            <p className="mt-1 text-faint text-xs tabular">
              {total === 1 ? "1 comment" : `${total} comments`}
            </p>

            {signedIn ? (
              <div className="mt-6">
                {/* Keyed on the count, so the box a comment came from empties
                    once that comment is on the page. */}
                <CommentForm
                  key={total}
                  label="Your comment"
                  placeholder="Say what you would use it for, or why this is the wrong shape."
                  submit="Comment"
                  limit={COMMENT_LIMIT}
                  busy={busy}
                />
              </div>
            ) : (
              <p className="mt-6 rounded-lg border border-line bg-raised/40 px-4 py-3 text-muted text-sm">
                <Link
                  to={`/auth?r=${encodeURIComponent(path)}`}
                  className="text-ink underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-ink"
                >
                  Sign in
                </Link>
                {" to vote or join the discussion."}
              </p>
            )}

            {actionData?.error && (
              <p
                role="alert"
                className="mt-4 rounded-lg border border-down/40 bg-down/10 px-3 py-2 text-down text-sm"
              >
                {actionData.error}
              </p>
            )}

            <ul className="mt-10">
              {comments.map((comment) => (
                <li key={comment.id} className="border-line/70 border-t py-6 first:border-t-0">
                  <Byline author={comment.author} since={comment.since} />

                  <p className="mt-2.5 whitespace-pre-line text-muted text-sm leading-relaxed">
                    {comment.body}
                  </p>

                  <div className="mt-3 flex items-center gap-3">
                    <VoteButton
                      shape="inline"
                      votes={comment.votes}
                      voted={comment.voted}
                      path={path}
                      fields={signedIn ? { intent: "vote-comment", id: comment.id } : null}
                    />

                    {signedIn && replyTo !== comment.id && (
                      <Link to={`?reply=${comment.id}`} preventScrollReset className={QUIET_LINK}>
                        Reply
                      </Link>
                    )}
                  </div>

                  {comment.replies.length > 0 && (
                    <ul className="mt-5 space-y-5 border-line/70 border-l pl-5">
                      {comment.replies.map((reply) => (
                        <li key={reply.id}>
                          <Byline author={reply.author} since={reply.since} size={22} />

                          <p className="mt-2 whitespace-pre-line text-muted text-sm leading-relaxed">
                            {reply.body}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}

                  {replyTo === comment.id && (
                    <div className="mt-5 border-line/70 border-l pl-5">
                      <CommentForm
                        parentId={comment.id}
                        label={`Your reply to ${comment.author.name}`}
                        placeholder={`Answer ${comment.author.name}`}
                        submit="Reply"
                        limit={COMMENT_LIMIT}
                        busy={busy}
                        cancelTo={path}
                      />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Feature;
