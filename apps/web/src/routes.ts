import { index, layout, type RouteConfig, route } from "@react-router/dev/routes";

export default [
  // Marketing and the sign-in field. Neither wears the app chrome, and neither
  // reaches the network, so the landing page cannot 500 on a data source.
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("signup", "routes/signup.tsx"),

  // Everything behind the login. The layout owns the nav and the account
  // summary both pages under it read.
  layout("routes/app.tsx", [
    route("dashboard", "routes/dashboard.tsx"),
    route("trading", "routes/trading.tsx"),
  ]),
] satisfies RouteConfig;
