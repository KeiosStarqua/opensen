import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api/types";

import {
  MAX_QUERY_RETRIES,
  queryErrorMessage,
  queryErrorStatus,
  shouldRetryQuery,
  unwrapApiResult,
} from "./api-query";
import { queryKeys } from "./query-keys";

describe("unwrapApiResult", () => {
  it("resolves the data of a successful result", async () => {
    await expect(
      unwrapApiResult(Promise.resolve({ ok: true as const, data: { id: "a" } })),
    ).resolves.toEqual({ id: "a" });
  });

  it("throws the ApiError of a failed result", async () => {
    const error = new ApiError("http", "Not found", 404);
    await expect(
      unwrapApiResult(Promise.resolve({ ok: false as const, error })),
    ).rejects.toBe(error);
  });
});

describe("shouldRetryQuery", () => {
  it("retries network and 5xx failures up to the cap", () => {
    const network = new ApiError("network", "offline");
    const server = new ApiError("http", "boom", 503);
    expect(shouldRetryQuery(0, network)).toBe(true);
    expect(shouldRetryQuery(1, server)).toBe(true);
    expect(shouldRetryQuery(MAX_QUERY_RETRIES, network)).toBe(false);
  });

  it("never retries 4xx, 501, parse, or foreign errors", () => {
    expect(shouldRetryQuery(0, new ApiError("http", "no", 401))).toBe(false);
    expect(shouldRetryQuery(0, new ApiError("http", "later", 501))).toBe(false);
    expect(shouldRetryQuery(0, new ApiError("parse", "bad json", 200))).toBe(false);
    expect(shouldRetryQuery(0, new Error("other"))).toBe(false);
  });
});

describe("queryErrorMessage / queryErrorStatus", () => {
  it("formats ApiError like the rest of the app", () => {
    const error = new ApiError("network", "fetch failed");
    expect(queryErrorMessage(error)).toBe(
      "Could not reach the server. Check your connection and try again.",
    );
    expect(queryErrorStatus(new ApiError("http", "x", 404))).toBe(404);
  });

  it("handles empty and foreign errors", () => {
    expect(queryErrorMessage(null)).toBeNull();
    expect(queryErrorMessage(new Error("x"))).toBe("Something went wrong.");
    expect(queryErrorStatus(new Error("x"))).toBeUndefined();
  });
});

describe("queryKeys", () => {
  it("nests entries under their domain prefix for invalidation", () => {
    expect(queryKeys.practice.plan().slice(0, 1)).toEqual(queryKeys.practice.all);
    expect(queryKeys.practice.due({ limit: 10 }).slice(0, 1)).toEqual(
      queryKeys.practice.all,
    );
    expect(queryKeys.chunks.list({ q: "hi" }).slice(0, 2)).toEqual(
      queryKeys.chunks.lists(),
    );
    expect(queryKeys.savedSentences.list().slice(0, 1)).toEqual(
      queryKeys.savedSentences.all,
    );
    expect(queryKeys.savedSentences.detail("id").slice(0, 1)).toEqual(
      queryKeys.savedSentences.all,
    );
  });

  it("keeps the session deck outside the practice prefix", () => {
    expect(queryKeys.practiceSessionDeck(20)[0]).not.toBe(
      queryKeys.practice.all[0],
    );
  });
});
