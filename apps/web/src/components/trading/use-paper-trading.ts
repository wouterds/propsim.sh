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
 * In memory only. `last` is null while the feed is down, and writes are refused
 * rather than marked to a stand-in, because closing banks that price for good.
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
