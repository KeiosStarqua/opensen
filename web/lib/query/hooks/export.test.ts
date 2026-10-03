import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api/types";
import {
  ANKI_PACKAGE_MEDIA_TYPE,
  downloadAnkiDeck,
} from "@/lib/query/hooks/export";

vi.mock("@/lib/api/session-token", () => ({
  getSessionToken: vi.fn(async () => "session-token"),
}));

vi.mock("@/lib/observability/operational-error", () => ({
  captureOperationalError: vi.fn(),
}));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function stubDownload() {
  const anchor = { href: "", download: "", click: vi.fn() };
  let blob: Blob | undefined;
  vi.stubGlobal("document", {
    createElement: () => anchor,
  });
  vi.stubGlobal("URL", {
    createObjectURL: (value: Blob) => {
      blob = value;
      return "blob:deck";
    },
    revokeObjectURL: vi.fn(),
  });
  return {
    anchor,
    blob: () => blob,
  };
}

describe("anki export download", () => {
  it("saves an apkg named for the scope", async () => {
    const download = stubDownload();
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(new Uint8Array([1, 2, 3]), {
            status: 200,
            headers: { "content-type": ANKI_PACKAGE_MEDIA_TYPE },
          }),
      ),
    );

    await expect(downloadAnkiDeck("all")).resolves.toBe("downloaded");
    expect(download.anchor.download).toBe("opensen-anki-all.apkg");
    expect(download.anchor.click).toHaveBeenCalledOnce();
    expect(download.blob()?.type).toBe(ANKI_PACKAGE_MEDIA_TYPE);
  });

  it("reports an empty scope without starting a download", async () => {
    const download = stubDownload();
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ empty: true, noteCount: 0 }), {
            status: 200,
            headers: { "content-type": "application/json" },
          }),
      ),
    );

    await expect(downloadAnkiDeck("enrolled")).resolves.toBe("empty");
    expect(download.anchor.click).not.toHaveBeenCalled();
  });

  it("leaves anonymous 401 on the caller", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 401 })),
    );

    await expect(downloadAnkiDeck("enrolled")).rejects.toBeInstanceOf(ApiError);
  });
});
