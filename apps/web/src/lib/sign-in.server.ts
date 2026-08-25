import { sendNewDevice } from "@propsim/mail";
import { startSession } from "./auth.server";
import { describeDevice, readDevice } from "./device";
import { countryOf, formatMoment } from "./format";
import { notify } from "./notify.server";
import { readOrigin } from "./origin.server";
import { recognise } from "./sessions.server";

type Signer = { id: string; email: string };

/**
 * The device is recognised before the session is opened, or it matches the row
 * it just wrote. The first session on an account is the signup, which the
 * welcome mail already covers.
 */
export const signIn = async (request: Request, user: Signer, back: string | null) => {
  const seen = await recognise(user.id, request);
  const response = await startSession(request, user.id, back);

  if (seen !== "new") {
    return response;
  }

  const origin = readOrigin(request);
  const country = countryOf(origin.country);

  await notify(() =>
    sendNewDevice({
      to: user.email,
      device: describeDevice(readDevice(origin.userAgent)),
      place: country ? `${country.flag} ${country.name}` : null,
      at: formatMoment(new Date()),
    }),
  );

  return response;
};
