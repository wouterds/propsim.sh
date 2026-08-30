import { describe, expect, it } from "vitest";
import { refuseTicket, type Ticket } from "./orders.server";

const row = { endedAt: null, maxMicros: 40 };

/** A Tuesday afternoon in Chicago, well inside the session. */
const OPEN = new Date("2026-08-25T15:00:00Z");

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
  it("should refuse a ticket while the session is shut", () => {
    // given the tape at 15:45 Chicago, which is 16:45 in New York
    const shut = new Date("2026-08-25T20:45:00Z");

    // then
    expect(
      refuseTicket(
        row,
        ticket(1),
        { held: 0, elsewhere: 0, working: { buy: 0, sell: 0 } },
        false,
        shut,
      ),
    ).toMatch(/shut/);
    expect(
      refuseTicket(
        row,
        ticket(1),
        { held: 0, elsewhere: 0, working: { buy: 0, sell: 0 } },
        false,
        OPEN,
      ),
    ).toBeNull();
  });

  it("should count the cap across every contract held", () => {
    // given thirty micros held on another contract and ten on this one
    const book = { held: 10, elsewhere: 30, working: { buy: 0, sell: 0 } };

    // then one more anywhere is over the cap
    expect(refuseTicket(row, ticket(1), book, false, OPEN)).toMatch(/40 micros/);
    expect(refuseTicket(row, ticket(1, "sell"), book, false, OPEN)).toBeNull();
  });

  it("should count an entry still resting toward the cap on its own side", () => {
    // given nothing held and thirty micros resting on buy entries
    const book = { held: 0, elsewhere: 0, working: { buy: 30, sell: 0 } };

    // then the resting size is exposure the next bar can hand the account
    expect(refuseTicket(row, ticket(10), book, false, OPEN)).toBeNull();
    expect(refuseTicket(row, ticket(11), book, false, OPEN)).toMatch(/40 micros/);
    // and a short the other way does not stack on it
    expect(refuseTicket(row, ticket(40, "sell"), book, false, OPEN)).toBeNull();
  });

  it("should never refuse a reduction, whatever is resting", () => {
    // given the cap held long, with a resting sell the size of the position
    const book = { held: 40, elsewhere: 0, working: { buy: 0, sell: 40 } };

    // then taking some of it off is not exposure
    expect(refuseTicket(row, ticket(20, "sell"), book, false, OPEN)).toBeNull();
    // and a flip through zero counts what the resting sell would add to the short
    expect(refuseTicket(row, ticket(60, "sell"), book, false, OPEN)).toMatch(/40 micros/);
  });

  it("should let a ticket reach the cap exactly", () => {
    // given
    const book = { held: 0, elsewhere: 30, working: { buy: 0, sell: 0 } };

    // then
    expect(refuseTicket(row, ticket(10), book, false, OPEN)).toBeNull();
    expect(refuseTicket(row, ticket(11), book, false, OPEN)).toMatch(/40 micros/);
  });

  it("should let a shut session close but not grow", () => {
    // given a session that hit the daily floor while long two
    const book = { held: 2, elsewhere: 0, working: { buy: 0, sell: 0 } };

    // then
    expect(refuseTicket(row, ticket(2, "sell"), book, true, OPEN)).toBeNull();
    expect(refuseTicket(row, ticket(1), book, true, OPEN)).toMatch(/daily loss limit/);
    // and a flip through zero is a new position, not a close
    expect(refuseTicket(row, ticket(3, "sell"), book, true, OPEN)).toMatch(/daily loss limit/);
  });
});
