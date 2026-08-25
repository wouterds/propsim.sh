import { Cron } from "croner";

export type Handler = () => Promise<void>;

export type Job = {
  /** Short, stable, and the name it is logged under. */
  name: string;
  /** Five field cron, read in UTC. */
  schedule: string;
  run: Handler;
};

// Daylight saving moves local time twice a year. Everything here is UTC.
const TIMEZONE = "UTC";

/** A throw here would end the container, taking every other job with it. */
export const guard =
  (job: Job, now: () => number = Date.now): Handler =>
  async () => {
    const started = now();

    try {
      await job.run();

      console.log(`${job.name} ran in ${now() - started}ms`);
    } catch (error) {
      console.error(`${job.name} failed after ${now() - started}ms`, error);
    }
  };

/**
 * Puts every job on the clock and hands back the way to stop them. A job still
 * working when its next turn arrives is skipped, not stacked.
 */
export const start = (jobs: Job[]) => {
  const names = new Set<string>();

  for (const job of jobs) {
    // Two jobs under one name make a log unreadable at the moment it matters.
    if (names.has(job.name)) {
      throw new Error(`Two jobs are called "${job.name}"`);
    }

    names.add(job.name);
  }

  // An unparseable schedule throws here, at boot, rather than being a job that
  // silently never runs.
  const running = jobs.map(
    (job) =>
      new Cron(job.schedule, { name: job.name, timezone: TIMEZONE, protect: true }, guard(job)),
  );

  return () => {
    for (const cron of running) {
      cron.stop();
    }
  };
};
