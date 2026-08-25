import { hello } from "~/handlers/hello";
import type { Job } from "~/scheduler";

/** Every job, a schedule each pointing at a file in `handlers/`, read in UTC. */
export const jobs: Job[] = [{ name: "hello", schedule: "* * * * *", run: hello }];
