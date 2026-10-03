import { speak } from "@/lib/speech/speak";

/** Studio voice: interrupts whatever is playing, reports failures as `studio`. */
export function speakText(text: string, rate = 1) {
  speak(text, { rate, surface: "studio" });
}
