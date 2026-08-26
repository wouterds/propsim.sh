import { clearCount, countUp, readCount } from "@propsim/datasources";
import { readOrigin } from "./origin.server";

/**
 * How many refusals a name or an address is allowed before it is turned away
 * without a password check. Credential stuffing works one guess per account, so
 * the address is capped far above the email and still catches the sweep.
 */
const PER_EMAIL = 10;
const PER_IP = 30;
const WINDOW_SECONDS = 15 * 60;

const emailKey = (email: string) => `signin:email:${email}`;
const ipKey = (ip: string) => `signin:ip:${ip}`;

/**
 * Counted on the way out rather than on the way in, so a trader who signs in
 * first time never touches it. A count that cannot be kept is zero, which is
 * why the cache being down opens the door rather than closing it: locking
 * everybody out of a simulator is the worse failure.
 */
export const refused = async (email: string, request: Request) => {
  const { ip } = readOrigin(request);

  await countUp(emailKey(email), WINDOW_SECONDS);

  if (ip) {
    await countUp(ipKey(ip), WINDOW_SECONDS);
  }
};

export const throttled = async (email: string, request: Request) => {
  const { ip } = readOrigin(request);
  const [byEmail, byIp] = await Promise.all([
    readCount(emailKey(email)),
    ip ? readCount(ipKey(ip)) : Promise.resolve(0),
  ]);

  return byEmail >= PER_EMAIL || byIp >= PER_IP;
};

/** A password that worked clears the name. The address keeps its count. */
export const allowed = (email: string) => clearCount(emailKey(email));
