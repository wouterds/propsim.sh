import { useCallback, useMemo, useReducer } from "react";
import { ACCOUNT } from "~/lib/account";
import { INITIAL_STATE, type OrderDraft, reduceTrading, unrealisedPnl } from "./trading-state";

// Ids only have to be unique inside one in-memory blotter, and
// `crypto.randomUUID` is secure-context only: over plain http to anything but
// localhost it is undefined, and every ticket would throw on submit instead of
// placing an order.
let sequence = 0;

const nextId = () => {
  sequence += 1;

  return `${sequence}`;
};

/**
 * The whole blotter, in memory. Nothing is sent anywhere and nothing survives a
 * reload, which is the honest shape for a screen with no backend behind it.
 *
 * `last` is null while the feed is down. Every write is refused rather than
 * marked to a stand-in price, because a fill at a price that never printed is
 * banked into `realised` for good the moment the position is closed.
 */
export const usePaperTrading = (last: number | null) => {
  const [state, dispatch] = useReducer(reduceTrading, INITIAL_STATE);

  const submit = useCallback(
    (draft: OrderDraft) => {
      if (last === null) return;

      dispatch({ kind: "submit", id: nextId(), at: Date.now(), draft, last });
    },
    [last],
  );

  const close = useCallback(
    (id: string) => {
      if (last === null) return;

      dispatch({ kind: "close", id, at: Date.now(), last });
    },
    [last],
  );

  const cancel = useCallback((id: string) => dispatch({ kind: "cancel", id }), []);

  const openPnl = useMemo(() => {
    if (last === null) return null;

    return state.positions.reduce((total, position) => total + unrealisedPnl(position, last), 0);
  }, [state.positions, last]);

  // Balance is the settled half and stands on its own. Equity adds whatever is
  // still floating, so it is unknown for exactly as long as the price is.
  const balance = ACCOUNT.balance + state.realised;

  return {
    positions: state.positions,
    orders: state.orders,
    realised: state.realised,
    openPnl,
    balance,
    equity: openPnl === null ? null : balance + openPnl,
    submit,
    close,
    cancel,
  };
};
