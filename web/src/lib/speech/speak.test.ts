import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { captureOperationalError } from "@/lib/observability/operational-error";

import { speak } from "./speak";

vi.mock("@/lib/observability/operational-error", () => ({
  captureOperationalError: vi.fn(),
}));

class FakeUtterance {
  lang = "";
  rate = 1;
  onerror: ((event: { error: string }) => void) | null = null;
  constructor(public text: string) {}
}

describe("speak", () => {
  let spoken: FakeUtterance[];
  const cancel = vi.fn();

  beforeEach(() => {
    spoken = [];
    cancel.mockClear();
    vi.mocked(captureOperationalError).mockClear();
    vi.stubGlobal("SpeechSynthesisUtterance", FakeUtterance);
    vi.stubGlobal("window", {
      speechSynthesis: {
        cancel,
        speak: (utterance: FakeUtterance) => spoken.push(utterance),
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("speaks English at the given rate, interrupting by default", () => {
    speak("Hello", { rate: 0.5, surface: "studio" });
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(spoken[0]).toMatchObject({ text: "Hello", lang: "en-US", rate: 0.5 });

    speak("Again", { interrupt: false, surface: "studio" });
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it("reports synthesis failures as warnings, but not our own cancel", () => {
    speak("Hello", { surface: "practice-session" });
    spoken[0].onerror?.({ error: "interrupted" });
    expect(captureOperationalError).not.toHaveBeenCalled();

    spoken[0].onerror?.({ error: "not-allowed" });
    expect(captureOperationalError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Speech synthesis failed: not-allowed" }),
      { surface: "speech", screen: "practice-session", speechError: "not-allowed" },
      { textLength: 5 },
      "warning",
    );
  });

  it("does nothing without speech synthesis", () => {
    vi.stubGlobal("window", {});
    speak("Hello", { surface: "landing" });
    expect(captureOperationalError).not.toHaveBeenCalled();
  });
});
