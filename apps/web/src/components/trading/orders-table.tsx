import { isWorking, type OrderStatus } from "@propsim/engine";
import { cn } from "~/lib/utils";
import Badge from "./badge";
import Button from "./button";
import { formatClock, formatMoney, formatPrice } from "./format";
import { ROW, TD, TH } from "./styles";
import type { Order } from "./trading-state";

const STATUS_TONE: Record<OrderStatus, "up" | "warn" | "muted"> = {
  filled: "up",
  partial: "warn",
  working: "warn",
  cancelled: "muted",
  replaced: "muted",
  expired: "muted",
};

type Props = { orders: Order[]; empty: string; onCancel: (id: string) => void };

const OrdersTable = ({ orders, empty, onCancel }: Props) => {
  if (orders.length === 0) {
    return <p className="px-3 py-6 text-center text-faint text-xs">{empty}</p>;
  }

  // A settled order can never be cancelled, so the column would be dead width.
  const actionable = orders.some((order) => isWorking(order.status));

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-line border-b">
          <th className={cn(TH, "hidden sm:table-cell")}>Time</th>
          <th className={TH}>Side</th>
          <th className={TH}>Type</th>
          <th className={TH}>Qty</th>
          <th className={TH}>Price</th>
          <th className={cn(TH, "hidden text-right sm:table-cell")}>Fee</th>
          <th className={TH}>Status</th>
          {actionable && <th className={TH} />}
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
            <td className={cn(TD, "hidden text-right text-faint sm:table-cell")}>
              {order.fees === 0 ? "\u2013" : `-${formatMoney(order.fees)}`}
            </td>
            <td className={TD}>
              <Badge tone={STATUS_TONE[order.status]}>{order.status}</Badge>
            </td>
            {actionable && (
              <td className={cn(TD, "text-right")}>
                {isWorking(order.status) && (
                  <Button className="h-6 px-2" onClick={() => onCancel(order.id)}>
                    Cancel
                  </Button>
                )}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default OrdersTable;
