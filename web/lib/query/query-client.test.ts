import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api/types";
import { captureOperationalError } from "@/lib/observability/operational-error";

import { createQueryClient, reportUnexpectedQueryError } from "./query-client";

vi.mock("@/lib/observability/operational-error", () => ({
  captureOperationalError: vi.fn(),
}));

describe("reportUnexpectedQueryError", () => {
  beforeEach(() => {
    vi.mocked(captureOperationalError).mockClear();
  });

  it("skips ApiError, which the API client already reported", () => {
    reportUnexpectedQueryError(new ApiError("http", "x", 404), "query", ["chunks"]);
    expect(captureOperationalError).not.toHaveBeenCalled();
  });

  it("reports other throws with the key domain", () => {
    const error = new TypeError("bad pattern");
    reportUnexpectedQueryError(error, "query", ["chunks", "detail", "id-1"]);
    expect(captureOperationalError).toHaveBeenCalledWith(error, {
      surface: "query",
      domain: "chunks",
    });
  });

  it("is wired into the query and mutation caches", async () => {
    const client = createQueryClient();
    const queryError = new Error("query boom");
    await client
      .fetchQuery({
        queryKey: ["situations", "list"],
        queryFn: () => {
          throw queryError;
        },
      })
      .catch(() => undefined);
    expect(captureOperationalError).toHaveBeenCalledWith(queryError, {
      surface: "query",
      domain: "situations",
    });

    const mutationError = new Error("mutation boom");
    await client
      .getMutationCache()
      .build(client, {
        mutationFn: async () => {
          throw mutationError;
        },
      })
      .execute(undefined)
      .catch(() => undefined);
    expect(captureOperationalError).toHaveBeenCalledWith(mutationError, {
      surface: "mutation",
      domain: undefined,
    });
  });
});
