import { jobs } from "~/jobs";
import { start } from "~/scheduler";

const stop = start(jobs);

// With no jobs registered nothing holds the event loop open, and node exiting
// here reads to compose as a crash and restarts, forever.
const idle = setInterval(() => {}, 1 << 30);

console.log(`cron up with ${jobs.length} job${jobs.length === 1 ? "" : "s"}`);

// Compose sends SIGTERM on a redeploy and waits before killing, so stopping the
// clock here means a job already in flight finishes rather than being cut off
// halfway.
for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.once(signal, () => {
    console.log(`${signal}, stopping the clock`);

    stop();
    clearInterval(idle);
  });
}
