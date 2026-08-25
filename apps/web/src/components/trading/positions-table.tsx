import { cn } from "~/lib/utils";
import Badge from "./badge";
import Button from "./button";
import { formatClock, formatMoney, formatPrice, toneOf } from "./format";
import { ROW, TD, TH } from "./styles";
import { type Position, unrealisedPnl } from "./trading-state";

type Props = { positions: Position[]; last: number | null; onClose: (id: string) => void };

const PositionsTable = ({ positions, last, onClose }: Props) => {
  if (positions.length === 0) {
    return <p className="px-3 py-6 text-center text-faint text-xs">Nothing open.</p>;
  }

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-line border-b">
          <th className={TH}>Side</th>
          <th className={TH}>Qty</th>
          <th className={TH}>Entry</th>
          <th className={TH}>Last</th>
          <th className={cn(TH, "hidden md:table-cell")}>Stop</th>
          <th className={cn(TH, "hidden md:table-cell")}>Target</th>
          <th className={cn(TH, "text-right")}>P&amp;L</th>
          <th className={cn(TH, "hidden lg:table-cell")}>Opened</th>
          <th className={TH} />
        </tr>
      </thead>
      <tbody>
        {positions.map((position) => {
          const pnl = last === null ? null : unrealisedPnl(position, last);

          return (
            <tr key={position.id} className={ROW}>
              <td className={TD}>
                <Badge tone={position.side === "buy" ? "up" : "down"}>
                  {position.side === "buy" ? "Long" : "Short"}
                </Badge>
              </td>
              <td className={TD}>{position.quantity}</td>
              <td className={TD}>{formatPrice(position.entry)}</td>
              <td className={cn(TD, last === null && "text-faint")}>
                {last === null ? "—" : formatPrice(last)}
              </td>
              <td className={cn(TD, "hidden text-muted md:table-cell")}>
                {position.stopLoss === null ? "—" : formatPrice(position.stopLoss)}
              </td>
              <td className={cn(TD, "hidden text-muted md:table-cell")}>
                {position.takeProfit === null ? "—" : formatPrice(position.takeProfit)}
              </td>
              <td
                className={cn(
                  TD,
                  "text-right font-medium",
                  pnl === null ? "text-faint" : toneOf(pnl),
                )}
              >
                {pnl === null ? "—" : formatMoney(pnl)}
              </td>
              <td className={cn(TD, "hidden text-muted lg:table-cell")}>
                {formatClock(position.openedAt)}
              </td>
              <td className={cn(TD, "text-right")}>
                <Button
                  variant="danger"
                  className="h-6 px-2"
                  disabled={last === null}
                  onClick={() => onClose(position.id)}
                >
                  Close
                </Button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default PositionsTable;
