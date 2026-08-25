export type AuthMode = "login" | "signup";

export const COPY: Record<AuthMode, { title: string; submit: string }> = {
  login: {
    title: "Back to the desk",
    submit: "Log in",
  },
  signup: {
    title: "Open a desk",
    submit: "Create account",
  },
};
