/**
 * For mail that reports something already done. A provider outage must not fail
 * the request that succeeded, or answer differently for an address that exists.
 */
export const notify = async (send: () => Promise<unknown>) => {
  try {
    await send();
  } catch (cause) {
    console.error("Notification mail failed", cause);
  }
};
