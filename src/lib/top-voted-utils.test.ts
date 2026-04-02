import { describe, expect, it } from "vitest";

import { presetToDateRange } from "./top-voted-utils";

describe("presetToDateRange", () => {
  it("returns empty object for 'all'", () => {
    const result = presetToDateRange("all");
    expect(result).toEqual({});
  });

  it("returns empty object for unknown preset", () => {
    const result = presetToDateRange("unknown");
    expect(result).toEqual({});
  });

  it("returns a from date approximately 24h ago for '24h'", () => {
    const before = Date.now();
    const result = presetToDateRange("24h");
    const after = Date.now();

    expect(result.to).toBeUndefined();
    expect(result.from).toBeDefined();

    const fromMs = new Date(result.from!).getTime();
    const expected24hAgo = before - 24 * 60 * 60 * 1000;
    // Allow 100ms tolerance
    expect(fromMs).toBeGreaterThanOrEqual(expected24hAgo - 100);
    expect(fromMs).toBeLessThanOrEqual(after - 24 * 60 * 60 * 1000 + 100);
  });

  it("returns a from date approximately 7 days ago for '7d'", () => {
    const before = Date.now();
    const result = presetToDateRange("7d");
    const after = Date.now();

    expect(result.to).toBeUndefined();
    expect(result.from).toBeDefined();

    const fromMs = new Date(result.from!).getTime();
    const expected7dAgo = before - 7 * 24 * 60 * 60 * 1000;
    expect(fromMs).toBeGreaterThanOrEqual(expected7dAgo - 100);
    expect(fromMs).toBeLessThanOrEqual(after - 7 * 24 * 60 * 60 * 1000 + 100);
  });

  it("returns a from date approximately 30 days ago for '30d'", () => {
    const before = Date.now();
    const result = presetToDateRange("30d");
    const after = Date.now();

    expect(result.to).toBeUndefined();
    expect(result.from).toBeDefined();

    const fromMs = new Date(result.from!).getTime();
    const expected30dAgo = before - 30 * 24 * 60 * 60 * 1000;
    expect(fromMs).toBeGreaterThanOrEqual(expected30dAgo - 100);
    expect(fromMs).toBeLessThanOrEqual(after - 30 * 24 * 60 * 60 * 1000 + 100);
  });

  it("'24h' range is shorter than '7d' range", () => {
    const r24h = presetToDateRange("24h");
    const r7d = presetToDateRange("7d");
    expect(new Date(r24h.from!).getTime()).toBeGreaterThan(
      new Date(r7d.from!).getTime(),
    );
  });

  it("'7d' range is shorter than '30d' range", () => {
    const r7d = presetToDateRange("7d");
    const r30d = presetToDateRange("30d");
    expect(new Date(r7d.from!).getTime()).toBeGreaterThan(
      new Date(r30d.from!).getTime(),
    );
  });
});
