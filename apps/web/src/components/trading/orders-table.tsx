import { cn } from "~/lib/utils";
import Badge from "./badge";
import Button from "./button";
import { formatClock, formatPrice } from "./format";
import { ROW, TD, TH } from "./styles";
import type { Order, OrderStatus } from "./trading-state";

const STATUS_TONE: Record<OrderStatus, "up" | "warn" | "muted"> = {
  filled: "up",
  working: "warn",
  cancelled: "muted",
};

type Props = { orders: Order[]; onCancel: (id: string) => void };

const OrdersTable = ({ orders, onCancel }: Props) => {
  if (orders.length === 0) {
    return <p className="px-3 py-6 text-center text-faint text-xs">No orders yet.</p>;
  }

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-line border-b">
          <th className={cn(TH, "hidden sm:table-cell")}>Time</th>
          <th className={TH}>Side</th>
          <th className={TH}>Type</th>
          <th className={TH}>Qty</th>
          <th className={TH}>Price</th>
          <th className={TH}>Status</th>
          <th className={TH} />
        </tr>
      </thead>
      <tbody>
        {orders.map((order) => (
          <tr key={order.id} className={ROW}>
            <td className={cn(TD, "hidden text-muted sm:table-cell")}>
              {formatClock(order.placedAt)}
            </td>
            <td className={TD}>
              <Badge tone={order.side === "buy" ? "up" : "down"}>{order.side}</Badge>
            </td>
            <td className={cn(TD, "text-muted uppercase")}>{order.type}</td>
            <td className={TD}>{order.quantity}</td>
            <td className={TD}>{formatPrice(order.price)}</td>
            <td className={TD}>
              <Badge tone={STATUS_TONE[order.status]}>{order.status}</Badge>
            </td>
            <td className={cn(TD, "text-right")}>
              {order.status === "working" && (
                <Button className="h-6 px-2" onClick={() => onCancel(order.id)}>
                  Cancel
                </Button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default OrdersTable;
