import { beforeEach, describe, expect, it, vi } from "vitest";

import { captureOperationalError } from "./operational-error";
import { reportAuthFormError } from "./auth-form-error";

vi.mock("./operational-error", () => ({
  captureOperationalError: vi.fn(),
}));

describe("reportAuthFormError", () => {
  beforeEach(() => {
    vi.mocked(captureOperationalError).mockClear();
  });

  function lastLevel() {
    return vi.mocked(captureOperationalError).mock.calls.at(-1)?.[3];
  }

  it("sends empty fields as warnings", () => {
    reportAuthFormError("sign-up", "Email address must be provided.", {
      reason: "empty-field",
    });
    expect(captureOperationalError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Email address must be provided." }),
      expect.objectContaining({
        surface: "auth",
        action: "sign-up",
        reason: "empty-field",
      }),
      {},
      "warning",
    );
  });

  it("grades SDK errors by status", () => {
    reportAuthFormError("sign-in", "Invalid email or password", {
      sdkError: { status: 401, code: "INVALID_EMAIL_OR_PASSWORD" },
    });
    expect(lastLevel()).toBe("warning");

    reportAuthFormError("sign-in", "Internal", { sdkError: { status: 502 } });
    expect(lastLevel()).toBe("error");

    reportAuthFormError("update-name", "Could not update your name", {
      sdkError: {},
    });
    expect(lastLevel()).toBe("error");
  });
});
