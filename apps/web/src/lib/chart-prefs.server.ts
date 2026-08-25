import { createCookie } from "react-router";

export type ChartPrefs = { s?: string; tf?: string };

const YEAR = 60 * 60 * 24 * 365;

/**
 * Read in the loader rather than restored in the browser, so the first render
 * already draws the contract you left on. Not signed: the worst a tampered
 * value does is fall back to the default.
 */
export const chartPrefs = createCookie("chart", {
  httpOnly: true,
  maxAge: YEAR,
  path: "/",
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
});

export const readChartPrefs = async (request: Request): Promise<ChartPrefs> => {
  const held = (await chartPrefs.parse(request.headers.get("Cookie"))) as ChartPrefs | null;

  return held ?? {};
};
