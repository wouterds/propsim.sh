import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { guard, type Job, start } from "./scheduler";

const job = (name: string, run: Job["run"], schedule = "* * * * *"): Job => ({
  name,
  schedule,
  run,
});

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("guard", () => {
  it("should run the job", async () => {
    // given
    const run = vi.fn(async () => {});

    // when
    await guard(job("hello", run))();

    // then
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("should swallow a throw rather than let it end the process", async () => {
    // given a job that fails, which unguarded reaches the top as an unhandled
    // rejection and takes every other job with it
    const run = vi.fn(async () => {
      throw new Error("upstream is down");
    });

    // when, then
    await expect(guard(job("hello", run))()).resolves.toBeUndefined();
  });

  it("should say which job failed and what with", async () => {
    // given
    const run = async () => {
      throw new Error("429");
    };

    // when
    await guard(job("hello", run))();

    // then
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining("hello"), expect.any(Error));
  });

  it("should report how long a run took", async () => {
    // given a clock that advances by a known amount
    const times = [1_000, 1_250];
    const now = () => times.shift() ?? 0;

    // when
    await guard(
      job("hello", async () => {}),
      now,
    )();

    // then
    expect(console.log).toHaveBeenCalledWith("hello ran in 250ms");
  });
});

describe("start", () => {
  it("should refuse two jobs under one name", () => {
    // given a name is what a run is logged under, and two of them make the log
    // unreadable at the moment it matters
    const jobs = [job("hello", async () => {}), job("hello", async () => {})];

    // when, then
    expect(() => start(jobs)).toThrow('Two jobs are called "hello"');
  });

  it("should refuse a schedule it cannot read", () => {
    // given a bad expression, which would otherwise be a job that silently
    // never runs
    const jobs = [job("hello", async () => {}, "not a schedule")];

    // when, then
    expect(() => start(jobs)).toThrow();
  });

  it("should put a job on the clock", async () => {
    // given a job due every minute
    vi.useFakeTimers();
    const run = vi.fn(async () => {});
    const stop = start([job("hello", run)]);

    // when the minute comes round
    await vi.advanceTimersByTimeAsync(60_000);
    stop();

    // then
    expect(run).toHaveBeenCalled();
  });

  it("should hand back a stop that leaves nothing running", async () => {
    // given the same job, stopped before its turn
    vi.useFakeTimers();
    const run = vi.fn(async () => {});
    const stop = start([job("hello", run)]);

    // when
    stop();
    await vi.advanceTimersByTimeAsync(2 * 60_000);

    // then the process can exit rather than being held open by a timer
    expect(run).not.toHaveBeenCalled();
  });
});
