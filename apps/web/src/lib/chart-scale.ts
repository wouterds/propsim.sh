/**
 * A band edge sits a minute either side of a release, which is not a bar time,
 * and the chart's time scale only resolves times it holds. So an edge is placed
 * as a fractional bar index, which the scale does interpolate.
 */
export const logicalAt = (times: number[], at: number) => {
  const last = times.length - 1;

  if (last < 1) {
    return null;
  }

  // Bars are an index, not a clock. Outside the series there is nothing to
  // interpolate between, so one bar stands in. The tightest gap is the bar
  // length: every wider one is a session break, and the last gap is often one.
  let step = Number.POSITIVE_INFINITY;

  for (let i = 1; i <= last; i++) {
    const gap = times[i] - times[i - 1];

    if (gap > 0 && gap < step) step = gap;
  }

  if (!Number.isFinite(step)) {
    return null;
  }

  if (at >= times[last]) return last + (at - times[last]) / step;
  if (at <= times[0]) return (at - times[0]) / step;

  let low = 0;
  let high = last;

  while (high - low > 1) {
    const mid = (low + high) >> 1;

    if (times[mid] <= at) low = mid;
    else high = mid;
  }

  const span = times[high] - times[low];

  return low + (span ? (at - times[low]) / span : 0);
};
