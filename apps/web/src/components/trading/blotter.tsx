import { Tabs } from "@base-ui/react/tabs";
import { useState } from "react";
import { cn } from "~/lib/utils";
import OrdersTable from "./orders-table";
import Panel from "./panel";
import PositionsTable from "./positions-table";
import { FOCUS_RING } from "./styles";
import type { Order, Position } from "./trading-state";

type Tab = "positions" | "orders";

type Props = {
  point: number;
  positions: Position[];
  orders: Order[];
  last: number | null;
  className?: string;
  onClose: (id: string) => void;
  onCancel: (id: string) => void;
};

const Blotter = ({ positions, orders, last, point, className, onClose, onCancel }: Props) => {
  const [tab, setTab] = useState<Tab>("positions");

  const working = orders.filter((order) => order.status === "working").length;
  const counts: Record<Tab, number> = { positions: positions.length, orders: working };

  const tabs = (
    // Pulled back by the tab's own padding, so the label sits on the same rail
    // as a panel title and the column headings under it. The fill bleeds into
    // the header padding instead, which is the half nobody reads down a column.
    <Tabs.List className="-ml-2 flex items-center gap-0.5">
      {(["positions", "orders"] as const).map((name) => (
        <Tabs.Tab
          key={name}
          value={name}
          className={cn(
            "rounded px-2 py-1 text-[11px] text-muted uppercase tracking-wider transition-colors hover:text-ink",
            "data-[active]:bg-overlay data-[active]:text-ink",
            FOCUS_RING,
          )}
        >
          {counts[name] > 0 ? `${name} ${counts[name]}` : name}
        </Tabs.Tab>
      ))}
    </Tabs.List>
  );

  return (
    // The className rides on the tabs wrapper, not the panel: that div is what
    // the grid places, and a panel inside it would size to its rows instead.
    <Tabs.Root
      value={tab}
      onValueChange={(value) => setTab(value as Tab)}
      render={<div className={cn("flex min-h-0 flex-col", className)} />}
    >
      <Panel
        actions={tabs}
        className="min-h-0 flex-1"
        bodyClassName="min-h-0 flex-1 overflow-auto p-0"
      >
        <Tabs.Panel value="positions">
          <PositionsTable positions={positions} last={last} point={point} onClose={onClose} />
        </Tabs.Panel>
        <Tabs.Panel value="orders">
          <OrdersTable orders={orders} onCancel={onCancel} />
        </Tabs.Panel>
      </Panel>
    </Tabs.Root>
  );
};

export default Blotter;
