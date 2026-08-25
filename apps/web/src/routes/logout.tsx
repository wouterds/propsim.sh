import { redirect } from "react-router";
import { endSession } from "~/lib/auth.server";
import type { Route } from "./+types/logout";

export const action = ({ request }: Route.ActionArgs) => endSession(request);

export const loader = () => redirect("/");
