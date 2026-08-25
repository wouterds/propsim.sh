import { getDb, tradingDays } from "@propsim/database";
import { and, eq, sql } from "drizzle-orm";

/**
 * Opens the session at the equity it is first seen with, or lowers the mark it
 * already carries. The opening equity is written once and never touched again,
 * because it is the anchor the daily floor hangs off for the rest of the day.
 */
export const touchTradingDay = (
  accountId: string,
  tradeDate: string,
  at: Date,
  equityCents: number,
) =>
  getDb()
    .insert(tradingDays)
    .values({
      accountId,
      tradeDate,
      openedAt: at,
      openEquityCents: equityCents,
      lowEquityCents: equityCents,
    })
    .onDuplicateKeyUpdate({
      set: {
        lowEquityCents: sql`LEAST(${tradingDays.lowEquityCents}, ${equityCents})`,
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
