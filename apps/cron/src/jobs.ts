import { dormancy } from "~/handlers/dormancy";
import { hello } from "~/handlers/hello";
import { news } from "~/handlers/news";
import { tape } from "~/handlers/tape";
import type { Job } from "~/scheduler";

/** Every job, a schedule each pointing at a file in `handlers/`, read in UTC. */
export const jobs: Job[] = [
  { name: "hello", schedule: "* * * * *", run: hello },
  // Every fifteen seconds, which is three of the steps a bar is revealed in. A
  // minute here puts a fill a minute behind the sweep the trader watched, and
  // the cached answer means asking this often costs no more upstream requests.
  { name: "tape", schedule: "*/15 * * * * *", run: tape },
  // Every five minutes. The notice goes an hour ahead, so landing it inside
  // five minutes of that is close enough, and the email log is what stops a
  // second one rather than the cadence.
  { name: "news", schedule: "*/5 * * * *", run: news },
  // Six times a day. The thresholds are days, so the hour it lands on is free,
  // and a run that misses one is picked up by the next.
  { name: "dormancy", schedule: "0 */4 * * *", run: dormancy },
];
