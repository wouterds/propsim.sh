import { getDb, tradingDays } from "@propsim/database";
import { and, eq, sql } from "drizzle-orm";

/**
 * Opens the session, or lowers the mark it already carries. The two numbers are
 * different observations: the open is written once and never touched again,
 * because the daily floor hangs off it for the rest of the day, while the low
 * only ever falls.
 */
export const touchTradingDay = (
  accountId: string,
  tradeDate: string,
  at: Date,
  equity: { openEquityCents: number; lowEquityCents: number },
) =>
  getDb()
    .insert(tradingDays)
    .values({
      accountId,
      tradeDate,
      openedAt: at,
      openEquityCents: equity.openEquityCents,
      lowEquityCents: equity.lowEquityCents,
    })
    .onDuplicateKeyUpdate({
      set: {
        lowEquityCents: sql`LEAST(${tradingDays.lowEquityCents}, ${equity.lowEquityCents})`,
      },
    });

export const findTradingDay = async (accountId: string, tradeDate: string) => {
  const [day] = await getDb()
    .select()
    .from(tradingDays)
    .where(and(eq(tradingDays.accountId, accountId), eq(tradingDays.tradeDate, tradeDate)))
    .limit(1);

  return day ?? null;
};
