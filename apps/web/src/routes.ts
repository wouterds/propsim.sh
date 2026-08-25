import { index, layout, type RouteConfig, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("auth", "routes/auth.tsx"),
  route("verify", "routes/verify.tsx"),
  route("logout", "routes/logout.tsx"),

  layout("routes/app.tsx", [
    route("dash", "routes/dash.tsx"),
    route("trading", "routes/trading.tsx"),
  ]),
] satisfies RouteConfig;
