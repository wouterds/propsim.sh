import { index, layout, type RouteConfig, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("auth", "routes/auth.tsx"),
  route("verify", "routes/verify.tsx"),
  route("logout", "routes/logout.tsx"),

  layout("routes/app.tsx", [
    route("dash", "routes/dash.tsx"),
    route("accounts/:id", "routes/account.tsx"),
    route("accounts/:id/journal", "routes/account-journal.tsx"),
    route("accounts/:id/terminal", "routes/terminal.tsx"),
    route("terminal", "routes/terminal-redirect.tsx"),
  ]),
] satisfies RouteConfig;
