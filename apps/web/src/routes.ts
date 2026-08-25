import { index, layout, type RouteConfig, route } from "@react-router/dev/routes";

export default [
  layout("routes/site.tsx", [
    index("routes/home.tsx"),
    route("plans", "routes/plans.tsx"),
    route("rules", "routes/rules.tsx"),
    route("faq", "routes/faq.tsx"),
    route("calendar", "routes/calendar.tsx"),
    route("contact", "routes/contact.tsx"),
  ]),

  route("auth", "routes/auth.tsx"),
  route("auth/google", "routes/google.tsx"),
  route("auth/google/callback", "routes/google-callback.tsx"),
  route("forgot", "routes/forgot.tsx"),
  route("reset", "routes/reset.tsx"),
  route("email", "routes/email.tsx"),
  route("verify", "routes/verify.tsx"),
  route("logout", "routes/logout.tsx"),

  layout("routes/app.tsx", [
    route("dash", "routes/dash.tsx"),
    route("settings", "routes/settings.tsx"),
    route("accounts", "routes/accounts.tsx"),
    route("accounts/new", "routes/account-new.tsx"),
    route("accounts/:id", "routes/account.tsx"),
    route("accounts/:id/journal", "routes/account-journal.tsx"),
    route("accounts/:id/journal/:date", "routes/account-day.tsx"),
    route("accounts/:id/terminal", "routes/terminal.tsx"),
    route("terminal", "routes/terminal-redirect.tsx"),
  ]),
] satisfies RouteConfig;
