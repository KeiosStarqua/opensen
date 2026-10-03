import { describe, expect, it } from "vitest";

import { SIDEBAR_ACCOUNT_FALLBACK, sidebarAccountLabel } from "./sidebar-account-label";

describe("sidebarAccountLabel", () => {
  it("shows the signed-in account name", () => {
    expect(sidebarAccountLabel("Lan Nguyen")).toBe("Lan Nguyen");
    expect(sidebarAccountLabel("  Kai Tran  ")).toBe("Kai Tran");
  });

  it("uses a short fallback when the account has no name", () => {
    expect(sidebarAccountLabel(null)).toBe(SIDEBAR_ACCOUNT_FALLBACK);
    expect(sidebarAccountLabel(undefined)).toBe(SIDEBAR_ACCOUNT_FALLBACK);
    expect(sidebarAccountLabel("")).toBe(SIDEBAR_ACCOUNT_FALLBACK);
    expect(sidebarAccountLabel("   ")).toBe(SIDEBAR_ACCOUNT_FALLBACK);
    expect(SIDEBAR_ACCOUNT_FALLBACK.trim().length).toBeGreaterThan(0);
  });
});
