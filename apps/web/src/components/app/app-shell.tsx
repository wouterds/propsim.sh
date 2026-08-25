import { Dialog } from "@base-ui/react/dialog";
import { type ReactNode, useState } from "react";
import { href, Link } from "react-router";
import SidebarNav from "~/components/app/sidebar-nav";
import Brand from "~/components/layout/brand";
import type { Account } from "~/lib/accounts";

type Props = {
  accounts: Account[];
  email: string;
  children: ReactNode;
};

const FOCUS = "focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent";

const MenuIcon = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4">
    <path
      d="M2 4h12M2 8h12M2 12h12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const AppShell = ({ accounts, email, children }: Props) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-dvh">
      <aside className="hidden w-60 shrink-0 border-line border-r bg-raised lg:block">
        <SidebarNav accounts={accounts} email={email} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-line border-b bg-raised px-3 lg:hidden">
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger
              aria-label="Open the menu"
              className={`inline-flex size-8 items-center justify-center rounded border border-line text-muted transition-colors hover:text-ink ${FOCUS}`}
            >
              <MenuIcon />
            </Dialog.Trigger>

            <Dialog.Portal>
              <Dialog.Backdrop className="fixed inset-0 z-40 bg-sunken/70 backdrop-blur-sm" />
              <Dialog.Popup className="fixed inset-y-0 left-0 z-50 w-64 border-line border-r bg-raised outline-hidden">
                <Dialog.Title className="sr-only">Navigation</Dialog.Title>
                <SidebarNav accounts={accounts} email={email} onNavigate={() => setOpen(false)} />
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>

          <Link to={href("/dash")} className={`rounded-sm ${FOCUS}`}>
            <Brand className="text-[15px] text-ink" />
          </Link>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

export default AppShell;
