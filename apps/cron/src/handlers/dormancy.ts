import { sendInactivityNotice } from "@propsim/mail";
import {
  clearDormancy,
  daysLeft,
  findDormant,
  noteDormancy,
  scrubUser,
  stageOf,
} from "@propsim/users";

/**
 * Two notices and then the account is emptied. The stage is written down after
 * each notice, because this runs every four hours and would otherwise send the
 * same warning six times a day.
 */
export const dormancy = async () => {
  const now = new Date();
  const dormant = await findDormant(now);
  let warned = 0;
  let scrubbed = 0;

  for (const user of dormant) {
    const stage = stageOf(user.lastSeenAt, now);

    try {
      if (stage === "active") {
        if (user.notice) {
          await clearDormancy(user.id);
        }

        continue;
      }

      if (stage === "scrub") {
        await scrubUser(user.id);
        scrubbed += 1;

        continue;
      }

      // Already told, at this stage or a later one.
      if (user.notice === stage || user.notice === "final") {
        continue;
      }

      await sendInactivityNotice({
        to: user.email,
        daysLeft: daysLeft(user.lastSeenAt, now),
      });
      await noteDormancy(user.id, stage);
      warned += 1;
    } catch (error) {
      // One address must not stop the sweep reaching the rest.
      console.error(`dormancy skipped ${user.id}`, error);
    }
  }

  if (warned || scrubbed) {
    console.log(`dormancy warned ${warned} and scrubbed ${scrubbed}`);
  }
};
