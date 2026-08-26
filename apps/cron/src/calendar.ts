import { getNewsEvents, isRedFolder } from "@propsim/datasources";
import { windowsOf } from "@propsim/engine";

/**
 * The blackout windows, cut from the red folder releases only. Shared so the
 * sweep that judges a breach and the sweep that warns about one are reading the
 * same calendar.
 */
export const redFolderWindows = async () => {
  const events = await getNewsEvents();

  return windowsOf(
    events.filter(isRedFolder).map((event) => ({ time: event.time, title: event.title })),
  );
};
