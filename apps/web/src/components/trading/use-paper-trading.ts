import { useCallback, useMemo, useReducer } from "react";
import { ACCOUNT } from "~/lib/account";
import { INITIAL_STATE, type OrderDraft, reduceTrading, unrealisedPnl } from "./trading-state";

// `crypto.randomUUID` is secure-context only, so over plain http every ticket
// would throw on submit.
let sequence = 0;

const nextId = () => {
  sequence += 1;

  return `${sequence}`;
};

/**
 * The blotter, in memory. Nothing is sent anywhere and nothing survives a reload.
 *
 * `last` is null while the feed is down. Writes are refused rather than marked to
 * a stand-in price, because closing banks that price into `realised` for good.
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

  // Balance is settled and always known. Equity adds the floating part, so it is
  // unknown while the price is.
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
