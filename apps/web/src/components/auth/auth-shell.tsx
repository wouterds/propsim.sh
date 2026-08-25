import type { ReactNode } from "react";
import { href, Link } from "react-router";
import Brand from "~/components/layout/brand";
import GridBackdrop from "~/components/layout/grid-backdrop";

type Props = {
  children: ReactNode;
};

const AuthShell = ({ children }: Props) => (
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
        {children}
      </div>
    </div>
  </main>
);

export default AuthShell;
