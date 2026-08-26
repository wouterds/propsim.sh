import { Dialog } from "@base-ui/react/dialog";
import { Menu, X } from "lucide-react";
import { type ReactNode, useState } from "react";
import { href, Link } from "react-router";
import SidebarNav from "~/components/app/sidebar-nav";
import Brand from "~/components/layout/brand";
import SiteFooter from "~/components/layout/site-footer";
import type { Account } from "~/lib/accounts";

type Props = {
  accounts: Account[];
  email: string;
  children: ReactNode;
};

const FOCUS = "focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent";

const AppShell = ({ accounts, email, children }: Props) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-dvh flex-col">
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-62 shrink-0 py-2 pl-2 lg:block">
          <div className="h-full overflow-hidden rounded-lg border border-line bg-raised">
            <SidebarNav accounts={accounts} email={email} />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 shrink-0 items-center gap-3 border-line border-b bg-raised px-5 sm:px-8 lg:hidden">
            <Dialog.Root open={open} onOpenChange={setOpen}>
              <Dialog.Trigger
                aria-label="Open the menu"
                className={`inline-flex size-8 items-center justify-center rounded border border-line text-muted transition-colors hover:text-ink ${FOCUS}`}
              >
                <Menu aria-hidden="true" className="size-4" strokeWidth={1.5} />
              </Dialog.Trigger>

              <Dialog.Portal>
                <Dialog.Popup className="fixed inset-0 z-50 flex flex-col bg-raised outline-hidden">
                  <Dialog.Title className="sr-only">Navigation</Dialog.Title>

                  <Dialog.Close
                    aria-label="Close the menu"
                    className={`absolute top-3 right-3 z-10 inline-flex size-8 items-center justify-center rounded border border-line text-muted transition-colors hover:text-ink ${FOCUS}`}
                  >
                    <X aria-hidden="true" className="size-4" strokeWidth={1.5} />
                  </Dialog.Close>

                  <SidebarNav accounts={accounts} email={email} onNavigate={() => setOpen(false)} />
                </Dialog.Popup>
              </Dialog.Portal>
            </Dialog.Root>

            <Link to={href("/dash")} className={`rounded-sm ${FOCUS}`}>
              <Brand className="text-[15px] text-ink" />
            </Link>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="flex min-h-full flex-col">{children}</div>

            <div className="pb-2 lg:px-2">
              <SiteFooter boxed />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppShell;
