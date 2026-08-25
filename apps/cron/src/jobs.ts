import { dormancy } from "~/handlers/dormancy";
import { hello } from "~/handlers/hello";
import type { Job } from "~/scheduler";

/** Every job, a schedule each pointing at a file in `handlers/`, read in UTC. */
export const jobs: Job[] = [
  { name: "hello", schedule: "* * * * *", run: hello },
  // Six times a day. The thresholds are days, so the hour it lands on is free,
  // and a run that misses one is picked up by the next.
  { name: "dormancy", schedule: "0 */4 * * *", run: dormancy },
];
