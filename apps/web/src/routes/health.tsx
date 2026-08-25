/**
 * Liveness for the load balancer and the rollout. It answers from the process
 * and nothing else: a database that has gone slow must not take every container
 * out of the pool while the pages they serve are still fine.
 *
 * The commit is here so a rollout can tell the container it just started from
 * the one it is replacing.
 */
export const loader = () =>
  Response.json(
    {
      status: "ok",
      commit: process.env.COMMIT_SHA ?? null,
      builtAt: process.env.BUILD_TIMESTAMP ?? null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
