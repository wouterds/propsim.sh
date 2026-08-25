/**
 * For mail that reports something already done. The password is changed, the
 * address is moving, the account exists. Letting the provider fail the request
 * would leave the caller with a 500 and no idea the thing had worked.
 *
 * Mail the flow depends on is not sent through here. A confirmation link that
 * silently fails to send strands the person waiting for it.
 */
export const notify = async (send: () => Promise<unknown>) => {
  try {
    await send();
  } catch (cause) {
    console.error("Notification mail failed", cause);
  }
};
