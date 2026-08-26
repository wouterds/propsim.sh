import { href, redirect } from "react-router";

/**
 * There is no index of traders, only the board that ranks them. Permanent, so a
 * shortened profile address lands somewhere useful rather than on a 404.
 */
export const loader = () => redirect(href("/leaderboards"), 301);
