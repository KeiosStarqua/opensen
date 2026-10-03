import { describe, expect, it } from "vitest";

import { isProtectedPath, signInUrlFor } from "./protected-routes";

describe("isProtectedPath", () => {
  it("protects app routes and their children", () => {
    expect(isProtectedPath("/home")).toBe(true);
    expect(isProtectedPath("/learn/travel/check-in")).toBe(true);
    expect(isProtectedPath("/account/settings")).toBe(true);
  });

  it("leaves the landing, auth pages, and lookalike prefixes public", () => {
    expect(isProtectedPath("/")).toBe(false);
    expect(isProtectedPath("/auth/sign-in")).toBe(false);
    expect(isProtectedPath("/api/auth/get-session")).toBe(false);
    expect(isProtectedPath("/homepage")).toBe(false);
  });
});

describe("signInUrlFor", () => {
  it("encodes the path and query as redirectTo", () => {
    expect(signInUrlFor("/practice/done", "?claim=1")).toBe(
      "/auth/sign-in?redirectTo=%2Fpractice%2Fdone%3Fclaim%3D1",
    );
  });

  it("falls back to /home for protocol-relative paths", () => {
    expect(signInUrlFor("//evil.test", "")).toBe(
      "/auth/sign-in?redirectTo=%2Fhome",
    );
  });
});
