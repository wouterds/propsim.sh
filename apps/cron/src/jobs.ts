import { dormancy } from "~/handlers/dormancy";
import { hello } from "~/handlers/hello";
import { news } from "~/handlers/news";
import { tape } from "~/handlers/tape";
import type { Job } from "~/scheduler";

/** Every job, a schedule each pointing at a file in `handlers/`, read in UTC. */
export const jobs: Job[] = [
  { name: "hello", schedule: "* * * * *", run: hello },
  // Every minute, which is how often a new one minute bar can appear. The feed
  // is minutes behind, so asking more often only asks for the same bar again.
  { name: "tape", schedule: "* * * * *", run: tape },
  // Every five minutes. The notice goes an hour ahead, so landing it inside
  // five minutes of that is close enough, and the email log is what stops a
  // second one rather than the cadence.
  { name: "news", schedule: "*/5 * * * *", run: news },
  // Six times a day. The thresholds are days, so the hour it lands on is free,
  // and a run that misses one is picked up by the next.
  { name: "dormancy", schedule: "0 */4 * * *", run: dormancy },
];
