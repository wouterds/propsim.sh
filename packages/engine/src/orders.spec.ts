import { describe, expect, it } from "vitest";
import { statusOf } from "./orders";

describe("statusOf", () => {
  it("should read an order its fills completed as filled, whatever the row was marked", () => {
    // given a row marked cancelled that the stream had already finished
    const order = { quantity: 2, endedReason: "cancelled" as const };

    // when the status is taken
    const status = statusOf(order, 2);

    // then the fills win, because they are the ones that moved money
    expect(status).toBe("filled");
  });

  it("should keep an order that filled part of its size separate from a full one", () => {
    // given one of three contracts filled
    // then it is neither working nor filled
    expect(statusOf({ quantity: 3, endedReason: null }, 1)).toBe("partial");
  });

  it("should report the reason an order was ended before it filled", () => {
    // given a resting order superseded by a modify
    // then
    expect(statusOf({ quantity: 1, endedReason: "replaced" }, 0)).toBe("replaced");
  });
});
