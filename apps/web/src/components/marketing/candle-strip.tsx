import { cn } from "~/lib/utils";

type Props = {
  className?: string;
};

// Hardcoded on purpose. The landing page must never 500 because a data source
// blinked, so nothing on it is allowed to reach the network.
const BARS: [open: number, high: number, low: number, close: number][] = [
  [46, 48, 45.3, 46.8],
  [46.8, 51.9, 45.1, 48.9],
  [48.9, 56.1, 46.9, 53],
  [53, 59.9, 52.6, 58.3],
  [58.3, 64.3, 56.3, 61.1],
  [61.1, 65.1, 60.6, 62.3],
  [62.3, 65.5, 61.2, 61.5],
  [61.5, 67.4, 61.2, 66.3],
  [66.3, 71.1, 66, 70.2],
  [70.2, 76, 68.8, 74.5],
  [74.5, 77.9, 72.6, 75.4],
  [75.4, 82.2, 75.1, 79.3],
  [79.3, 84.2, 77, 81.3],
  [81.3, 84.1, 78.3, 79.2],
  [79.2, 80, 77.9, 79.1],
  [79.1, 80.7, 76.2, 79.1],
  [79.1, 81.7, 73.6, 76.2],
  [76.2, 76.4, 72.9, 73.6],
  [73.6, 74.2, 69.3, 69.8],
  [69.8, 69.9, 65.9, 67.8],
  [67.8, 71.7, 64.8, 69.5],
  [69.5, 69.6, 65.6, 66],
  [66, 70.3, 62.8, 68.3],
  [68.3, 69, 66.5, 68.7],
  [68.7, 69.2, 66.6, 67.2],
  [67.2, 70.1, 64.2, 66.1],
  [66.1, 66.5, 62.2, 64.8],
  [64.8, 65.9, 61.8, 63.1],
  [63.1, 68.6, 61.9, 68],
  [68, 71.3, 67.3, 69],
  [69, 73.2, 67.8, 70.5],
  [70.5, 74.6, 68, 73.6],
  [73.6, 81.1, 73.1, 78.5],
  [78.5, 83.4, 76.2, 82.8],
];

const SLOT = 20;
const LOW = 44;
const HIGH = 85;

const toY = (value: number) => 172 - ((value - LOW) / (HIGH - LOW)) * 160;

const CandleStrip = ({ className }: Props) => (
  <svg
    viewBox={`0 0 ${BARS.length * SLOT} 180`}
    className={cn("h-auto w-full", className)}
    role="img"
    aria-label="Illustrative price action"
  >
    <title>Illustrative price action</title>
    {BARS.map(([open, high, low, close], index) => {
      const x = index * SLOT;
      const bodyTop = toY(Math.max(open, close));
      const bodyHeight = Math.max(1.5, toY(Math.min(open, close)) - bodyTop);

      return (
        <g key={x} className={close >= open ? "fill-up" : "fill-down"}>
          <rect x={x + 9.5} y={toY(high)} width={1} height={toY(low) - toY(high)} />
          <rect x={x + 4} y={bodyTop} width={12} height={bodyHeight} rx={1} />
        </g>
      );
    })}
  </svg>
);

export default CandleStrip;
