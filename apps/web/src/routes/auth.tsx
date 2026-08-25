import { href, Link } from "react-router";
import AuthForm from "~/components/auth/auth-form";
import { COPY, parseMode } from "~/components/auth/mode";
import ModeTabs from "~/components/auth/mode-tabs";
import Brand from "~/components/layout/brand";
import GridBackdrop from "~/components/layout/grid-backdrop";
import type { Route } from "./+types/auth";

export const loader = ({ request }: Route.LoaderArgs) => ({
  mode: parseMode(new URL(request.url).searchParams.get("mode")),
});

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: `${loaderData?.mode === "signup" ? "Open a desk" : "Log in"}, propsim.sh` },
];

const Auth = ({ loaderData }: Route.ComponentProps) => {
  const { mode } = loaderData;

  return (
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
          <ModeTabs mode={mode} />
          <h1 className="font-semibold text-ink text-lg tracking-tight">{COPY[mode].title}</h1>
          <p className="mt-1 mb-6 text-muted text-sm">{COPY[mode].blurb}</p>
          <AuthForm mode={mode} />
        </div>
      </div>
    </main>
  );
};

export default Auth;
