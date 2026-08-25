import { href, Link } from "react-router";
import Brand from "~/components/layout/brand";
import GridBackdrop from "~/components/layout/grid-backdrop";
import LoginForm from "~/components/login/login-form";
import type { Route } from "./+types/login";

export const meta: Route.MetaFunction = () => [{ title: "Log in, propsim.sh" }];

const Login = () => (
  <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-5 py-16">
    <GridBackdrop />

    <div className="relative w-full max-w-sm">
      <Link
        to={href("/")}
        className="mx-auto flex w-fit rounded-sm focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
      >
        <Brand className="text-[1rem] text-ink" />
      </Link>

      <div className="mt-8 rounded-xl border border-line bg-raised p-6 shadow-[0_24px_80px_-40px_rgb(0_0_0)]">
        <h1 className="font-semibold text-ink text-lg tracking-tight">Back to the desk</h1>
        <p className="mt-1 mb-6 text-muted text-sm">
          The account and its floors are waiting where you left them.
        </p>
        <LoginForm />
      </div>

      <p className="mt-6 text-center text-faint text-xs">
        <Link
          to={href("/")}
          className="rounded-sm transition-colors hover:text-ink focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
        >
          Back to the landing page
        </Link>
      </p>
    </div>
  </main>
);

export default Login;
