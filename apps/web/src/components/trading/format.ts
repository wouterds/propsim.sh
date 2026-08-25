const price = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// Up to two decimals and none of them forced. A whole ratio is a decision and
// should read as one, where "2.00 : 1" reads as something that was measured.
const ratio = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

const clock = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export const formatPrice = (value: number) => price.format(value);

export const formatMoney = (value: number) => money.format(value);

export const formatRatio = (value: number) => ratio.format(value);

// `Math.abs` first: a value that rounds to zero from below formats as "-$0.00"
// and reads as a loss that never happened.
export const formatSignedMoney = (value: number) => {
  const sign = value < 0 ? "-" : "+";

  return `${sign}${money.format(Math.abs(value))}`;
};

export const formatSignedPoints = (value: number) => {
  const sign = value < 0 ? "-" : "+";

  return `${sign}${price.format(Math.abs(value))}`;
};

export const formatPercent = (value: number) => {
  const sign = value < 0 ? "-" : "+";

  return `${sign}${Math.abs(value).toFixed(2)}%`;
};

export const formatClock = (at: number) => clock.format(new Date(at));

export const toneOf = (value: number) => {
  if (value > 0) return "text-up";
  if (value < 0) return "text-down";

  return "text-muted";
};
