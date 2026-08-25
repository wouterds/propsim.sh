import {
  clearDormancy,
  daysLeft,
  findDormant,
  noteDormancy,
  scrubUser,
  stageOf,
} from "@propsim/accounts";
import { sendInactivityNotice } from "@propsim/mail";

/**
 * Two notices and then the account is emptied. The stage is written down after
 * each notice, because this runs every four hours and would otherwise send the
 * same warning six times a day.
 */
export const dormancy = async () => {
  const now = new Date();
  const accounts = await findDormant(now);
  let warned = 0;
  let scrubbed = 0;

  for (const account of accounts) {
    const stage = stageOf(account.lastSeenAt, now);

    try {
      if (stage === "active") {
        if (account.notice) {
          await clearDormancy(account.id);
        }

        continue;
      }

      if (stage === "scrub") {
        await scrubUser(account.id);
        scrubbed += 1;

        continue;
      }

      // Already told, at this stage or a later one.
      if (account.notice === stage || account.notice === "final") {
        continue;
      }

      await sendInactivityNotice({
        to: account.email,
        daysLeft: daysLeft(account.lastSeenAt, now),
      });
      await noteDormancy(account.id, stage);
      warned += 1;
    } catch (error) {
      // One address must not stop the sweep reaching the rest.
      console.error(`dormancy skipped ${account.id}`, error);
    }
  }

  if (warned || scrubbed) {
    console.log(`dormancy warned ${warned} and scrubbed ${scrubbed}`);
  }
};
