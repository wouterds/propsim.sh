import { marking } from "~/handlers/marking";
import { matching } from "~/handlers/matching";

/**
 * One pass of the tape over every account, in order. A stop the trader placed
 * has to be given the bar before a liquidation is, or an account is flattened
 * at its floor by a bar whose own stop would have taken it out above.
 */
export const tape = async () => {
  await matching();
  await marking();
};
