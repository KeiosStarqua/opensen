import { captureOperationalError } from "@/lib/observability/operational-error";

export type ThemeMode = "system" | "light" | "dark";

export type LearnerSettings = {
  dailyNewLimit: number;
  sessionSize: number;
  desiredRetention: number;
  ttsEnabled: boolean;
  speechRate: number;
  themeMode: ThemeMode;
  onboardingComplete: boolean;
};

const STORAGE_KEY = "opensen:learner-settings";

let settingsReadFailureReported = false;

const DEFAULTS: LearnerSettings = {
  dailyNewLimit: 10,
  sessionSize: 20,
  desiredRetention: 0.9,
  ttsEnabled: true,
  speechRate: 0.45,
  themeMode: "system",
  onboardingComplete: false,
};

export function getLearnerSettings(): LearnerSettings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<LearnerSettings>;
    return { ...DEFAULTS, ...parsed };
  } catch (error) {
    // Storage blocked or the saved JSON is corrupt: the learner silently gets
    // defaults, so record it once per page load.
    if (!settingsReadFailureReported) {
      settingsReadFailureReported = true;
      captureOperationalError(
        error,
        { surface: "learner-settings", action: "read" },
        {},
        "warning",
      );
    }
    return DEFAULTS;
  }
}

export function saveLearnerSettings(patch: Partial<LearnerSettings>): LearnerSettings {
  const next = { ...getLearnerSettings(), ...patch };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (error) {
    // Quota or blocked storage: keep the change for this page, report it.
    captureOperationalError(
      error,
      { surface: "learner-settings", action: "write" },
      {},
      "warning",
    );
  }
  window.dispatchEvent(new Event("opensen:settings-changed"));
  return next;
}

export function applyThemeMode(mode: ThemeMode): void {
  const root = document.documentElement;
  root.classList.remove("dark");
  if (mode === "dark") {
    root.classList.add("dark");
  } else if (mode === "system") {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      root.classList.add("dark");
    }
  }
}
