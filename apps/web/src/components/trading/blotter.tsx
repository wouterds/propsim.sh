import { useState } from "react";
import { cn } from "~/lib/utils";
import OrdersTable from "./orders-table";
import Panel from "./panel";
import PositionsTable from "./positions-table";
import { FOCUS_RING } from "./styles";
import type { Order, Position } from "./trading-state";

type Tab = "positions" | "orders";

type Props = {
  positions: Position[];
  orders: Order[];
  last: number | null;
  className?: string;
  onClose: (id: string) => void;
  onCancel: (id: string) => void;
};

const Blotter = ({ positions, orders, last, className, onClose, onCancel }: Props) => {
  const [tab, setTab] = useState<Tab>("positions");

  const working = orders.filter((order) => order.status === "working").length;
  const counts: Record<Tab, number> = { positions: positions.length, orders: working };

  const tabs = (
    <div className="flex items-center gap-0.5">
      {(["positions", "orders"] as const).map((name) => (
        <button
          key={name}
          type="button"
          onClick={() => setTab(name)}
          className={cn(
            "rounded px-2 py-1 text-[11px] uppercase tracking-wider transition-colors",
            tab === name ? "bg-accent/15 text-accent" : "text-muted hover:text-ink",
            FOCUS_RING,
          )}
        >
          {counts[name] > 0 ? `${name} ${counts[name]}` : name}
        </button>
      ))}
    </div>
  );

  return (
    <Panel
      title="Blotter"
      actions={tabs}
      className={className}
      bodyClassName="min-h-0 flex-1 overflow-auto p-0"
    >
      {tab === "positions" ? (
        <PositionsTable positions={positions} last={last} onClose={onClose} />
      ) : (
        <OrdersTable orders={orders} onCancel={onCancel} />
      )}
    </Panel>
  );
};

export default Blotter;
