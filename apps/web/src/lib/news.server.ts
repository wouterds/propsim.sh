import { getNewsEvents, isRedFolder } from "@propsim/datasources";
import { type NewsWindow, windowsOf } from "./blackout";

/** The red folder calendar, already folded into blackout windows. */
export const redFolderWindows = async (): Promise<NewsWindow[]> => {
  const events = await getNewsEvents();

  return windowsOf(
    events.filter(isRedFolder).map((event) => ({ time: event.time, title: event.title })),
  );
};
