import { href, Link } from "react-router";
import Brand from "~/components/layout/brand";
import GridBackdrop from "~/components/layout/grid-backdrop";
import SignupForm from "~/components/signup/signup-form";
import type { Route } from "./+types/signup";

export const meta: Route.MetaFunction = () => [{ title: "Open a desk, propsim.sh" }];

const Signup = () => (
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
        <h1 className="font-semibold text-ink text-lg tracking-tight">Open a desk</h1>
        <p className="mt-1 mb-6 text-muted text-sm">
          A simulated account, and the floors that come with it. Nothing to pay and nothing to lose.
        </p>
        <SignupForm />
      </div>

      <p className="mt-6 text-center text-faint text-xs">
        Already have a desk?{" "}
        <Link
          to={href("/login")}
          className="rounded-sm text-ink underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-ink focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
        >
          Log in
        </Link>
      </p>
    </div>
  </main>
);

export default Signup;
