import { describe, expect, it } from "vitest";
import { refuseTicket, type Ticket } from "./orders.server";

const row = { endedAt: null, maxMicros: 40 };

const ticket = (quantity: number, side: Ticket["side"] = "buy"): Ticket => ({
  instrument: "MES",
  side,
  type: "market",
  quantity,
  price: null,
  stopLoss: null,
  takeProfit: null,
});

describe("refuseTicket", () => {
  it("should count the cap across every contract held", () => {
    // given thirty micros held on another contract and ten on this one
    const book = { held: 10, elsewhere: 30 };

    // then one more anywhere is over the cap
    expect(refuseTicket(row, ticket(1), book, false)).toMatch(/40 micros/);
    expect(refuseTicket(row, ticket(1, "sell"), book, false)).toBeNull();
  });

  it("should let a ticket reach the cap exactly", () => {
    // given
    const book = { held: 0, elsewhere: 30 };

    // then
    expect(refuseTicket(row, ticket(10), book, false)).toBeNull();
    expect(refuseTicket(row, ticket(11), book, false)).toMatch(/40 micros/);
  });

  it("should let a shut session close but not grow", () => {
    // given a session that hit the daily floor while long two
    const book = { held: 2, elsewhere: 0 };

    // then
    expect(refuseTicket(row, ticket(2, "sell"), book, true)).toBeNull();
    expect(refuseTicket(row, ticket(1), book, true)).toMatch(/daily loss limit/);
  });
});
