import { captureException } from "@sentry/core";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { captureOperationalError } from "./operational-error";

vi.mock("@sentry/core", () => ({
  captureException: vi.fn(),
}));

describe("captureOperationalError", () => {
  beforeEach(() => {
    vi.mocked(captureException).mockClear();
  });

  it("sends the error and string tags", () => {
    const error = new Error("offline");
    captureOperationalError(error, {
      surface: "api",
      status: 503,
      path: "/api/practice/due",
      empty: "",
      missing: undefined,
    });

    expect(captureException).toHaveBeenCalledWith(error, {
      tags: {
        surface: "api",
        status: "503",
        path: "/api/practice/due",
      },
    });
  });

  it("wraps non-Error values", () => {
    captureOperationalError("boom", { surface: "auth" });
    const [exception] = vi.mocked(captureException).mock.calls[0];
    expect(exception).toBeInstanceOf(Error);
    expect((exception as Error).message).toBe("Operational error");
  });
});
