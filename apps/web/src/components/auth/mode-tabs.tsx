import { Tabs } from "@base-ui/react/tabs";
import { cn } from "~/lib/utils";
import type { AuthMode } from "./mode";

const TAB =
  "flex-1 rounded py-1.5 text-center text-muted text-sm transition-colors hover:text-ink data-[selected]:bg-accent data-[selected]:font-medium data-[selected]:text-sunken focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent";

type Props = {
  mode: AuthMode;
  onChange: (mode: AuthMode) => void;
};

const ModeTabs = ({ mode, onChange }: Props) => (
  <Tabs.Root value={mode} onValueChange={(value) => onChange(value as AuthMode)}>
    <Tabs.List className="mb-6 flex gap-1 rounded-lg border border-line bg-sunken p-1">
      <Tabs.Tab value="login" className={cn(TAB)}>
        Log in
      </Tabs.Tab>
      <Tabs.Tab value="signup" className={cn(TAB)}>
        Create account
      </Tabs.Tab>
    </Tabs.List>
  </Tabs.Root>
);

export default ModeTabs;
