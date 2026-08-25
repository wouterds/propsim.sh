export type AuthMode = "login" | "signup";

export const COPY: Record<AuthMode, { title: string; blurb: string; submit: string }> = {
  login: {
    title: "Back to the desk",
    blurb: "The account and its floors are waiting where you left them.",
    submit: "Log in",
  },
  signup: {
    title: "Open a desk",
    blurb:
      "A simulated account, and the floors that come with it. Nothing to pay and nothing to lose.",
    submit: "Create account",
  },
};
