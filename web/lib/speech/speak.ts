import { captureOperationalError } from "@/lib/observability/operational-error";

/** Errors the browser raises when we cancel or replace our own utterance. */
const SELF_INFLICTED = new Set(["interrupted", "canceled"]);

export type SpeakOptions = {
  rate?: number;
  /** Cancel whatever is playing first (default). `false` queues after it. */
  interrupt?: boolean;
  /** Sentry tag naming the screen that asked for speech. */
  surface: string;
};

export function canSpeak(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/**
 * Speak English text with the browser voice. A synthesis failure the learner
 * would hear as silence (no voice, audio blocked, synthesis failed) is sent to
 * Sentry as a warning; our own cancel/replace is not.
 */
export function speak(text: string, options: SpeakOptions): void {
  if (!canSpeak()) return;
  const { rate = 1, interrupt = true, surface } = options;
  try {
    if (interrupt) window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = rate;
    utterance.onerror = (event) => {
      if (SELF_INFLICTED.has(event.error)) return;
      captureOperationalError(
        new Error(`Speech synthesis failed: ${event.error}`),
        { surface: "speech", screen: surface, speechError: event.error },
        { textLength: text.length },
        "warning",
      );
    };
    window.speechSynthesis.speak(utterance);
  } catch (error) {
    captureOperationalError(
      error,
      { surface: "speech", screen: surface },
      { textLength: text.length },
      "warning",
    );
  }
}
