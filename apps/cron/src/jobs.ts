import { dormancy } from "~/handlers/dormancy";
import { hello } from "~/handlers/hello";
import { matching } from "~/handlers/matching";
import type { Job } from "~/scheduler";

/** Every job, a schedule each pointing at a file in `handlers/`, read in UTC. */
export const jobs: Job[] = [
  { name: "hello", schedule: "* * * * *", run: hello },
  // Every minute, which is how often a new one minute bar can appear. The feed
  // is minutes behind, so asking more often only asks for the same bar again.
  { name: "matching", schedule: "* * * * *", run: matching },
  // Six times a day. The thresholds are days, so the hour it lands on is free,
  // and a run that misses one is picked up by the next.
  { name: "dormancy", schedule: "0 */4 * * *", run: dormancy },
];
