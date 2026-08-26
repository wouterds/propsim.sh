import { Dialog } from "@base-ui/react/dialog";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { href, Link, NavLink } from "react-router";
import Brand from "~/components/layout/brand";
import { cn } from "~/lib/utils";

const FOCUS = "focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent";

const LINKS = [
  { to: href("/plans"), label: "Plans" },
  { to: href("/rules"), label: "Rules" },
  { to: href("/knowledge-base"), label: "Knowledge base" },
];

const ICON_BUTTON = cn(
  "inline-flex size-8 items-center justify-center rounded border border-line text-muted transition-colors hover:text-ink",
  FOCUS,
);

const SiteHeader = ({ signedIn }: { signedIn: boolean }) => {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-line/70 border-b bg-base/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-5 sm:gap-6 sm:px-8">
        <Link to={href("/")} className={cn("shrink-0 rounded-sm", FOCUS)}>
          <Brand className="text-[15px] text-ink" />
        </Link>

        <nav className="-mx-2 hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  "inline-flex h-8 items-center whitespace-nowrap rounded px-2 text-sm transition-colors",
                  FOCUS,
                  isActive ? "text-ink" : "text-muted hover:text-ink",
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            to={signedIn ? href("/dash") : href("/terminal")}
            className={cn(
              "inline-flex h-8 items-center whitespace-nowrap rounded bg-accent-strong px-3 font-medium text-sm text-white transition-colors hover:bg-accent-strong/85",
              FOCUS,
            )}
          >
            <span className="sm:hidden">{signedIn ? "Dashboard" : "Start"}</span>
            <span className="hidden sm:inline">{signedIn ? "Dashboard" : "Start trading"}</span>
          </Link>

          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger aria-label="Open the menu" className={cn(ICON_BUTTON, "md:hidden")}>
              <Menu aria-hidden="true" className="size-4" strokeWidth={1.5} />
            </Dialog.Trigger>

            <Dialog.Portal>
              <Dialog.Popup className="fixed inset-0 z-50 flex flex-col bg-base outline-hidden">
                <Dialog.Title className="sr-only">Navigation</Dialog.Title>

                <div className="flex h-14 shrink-0 items-center justify-between border-line/70 border-b px-4">
                  <Brand className="text-[15px] text-ink" />
                  <Dialog.Close aria-label="Close the menu" className={ICON_BUTTON}>
                    <X aria-hidden="true" className="size-4" strokeWidth={1.5} />
                  </Dialog.Close>
                </div>

                <nav className="flex flex-col gap-1 p-3">
                  {LINKS.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          "flex h-11 items-center rounded px-3 text-base transition-colors",
                          FOCUS,
                          isActive ? "bg-overlay text-ink" : "text-muted hover:text-ink",
                        )
                      }
                    >
                      {link.label}
                    </NavLink>
                  ))}
                </nav>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>
    </header>
  );
};

export default SiteHeader;
