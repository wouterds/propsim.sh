export type AuthMode = "login" | "signup";

export const COPY: Record<AuthMode, { title: string; submit: string }> = {
  login: {
    title: "Welcome back",
    submit: "Log in",
  },
  signup: {
    title: "Create your account",
    submit: "Create account",
  },
};
