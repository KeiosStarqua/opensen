"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AppRoutes } from "@/lib/app-routes";
import { LEARNER_ID_STORAGE_KEY } from "@/lib/api/types";
import { ONBOARDING_COMPLETE_KEY } from "@/lib/onboarding-storage";
import {
  applyThemeMode,
  getLearnerSettings,
  saveLearnerSettings,
  type LearnerSettings,
  type ThemeMode,
} from "@/lib/settings/learner-settings";

const DEFAULTS = getLearnerSettings();

export function SettingsForm() {
  const router = useRouter();
  const [settings, setSettings] = useState<LearnerSettings>(() =>
    typeof window === "undefined" ? DEFAULTS : getLearnerSettings(),
  );
  const [confirmReset, setConfirmReset] = useState(false);

  function update(patch: Partial<LearnerSettings>) {
    const next = saveLearnerSettings(patch);
    setSettings(next);
    if (patch.themeMode) {
      applyThemeMode(patch.themeMode);
    }
  }

  function redoOnboarding() {
    update({ onboardingComplete: false });
    window.localStorage.removeItem(ONBOARDING_COMPLETE_KEY);
    router.push(AppRoutes.onboarding);
  }

  function resetLearnerId() {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    window.localStorage.removeItem(LEARNER_ID_STORAGE_KEY);
    setConfirmReset(false);
    router.push(AppRoutes.today);
  }

  return (
    <div className="space-y-8">
      <Link href={AppRoutes.today} className="text-sm text-slate-600">
        ← Today
      </Link>
      <h1 className="text-3xl font-semibold">Settings</h1>
      <label className="block text-sm">
        Session size
        <input
          type="number"
          min={5}
          max={50}
          className="mt-1 w-full rounded-lg border px-3 py-2"
          value={settings.sessionSize}
          onChange={(e) => update({ sessionSize: Number(e.target.value) })}
        />
      </label>
      <label className="block text-sm">
        Daily new chunk limit
        <input
          type="number"
          min={1}
          max={50}
          className="mt-1 w-full rounded-lg border px-3 py-2"
          value={settings.dailyNewLimit}
          onChange={(e) => update({ dailyNewLimit: Number(e.target.value) })}
        />
      </label>
      <label className="block text-sm">
        Desired retention
        <input
          type="number"
          min={0.7}
          max={0.97}
          step={0.01}
          className="mt-1 w-full rounded-lg border px-3 py-2"
          value={settings.desiredRetention}
          onChange={(e) =>
            update({ desiredRetention: Number(e.target.value) })
          }
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={settings.ttsEnabled}
          onChange={(e) => update({ ttsEnabled: e.target.checked })}
        />
        Text-to-speech in recall
      </label>
      <label className="block text-sm">
        Speech rate
        <input
          type="range"
          min={0.2}
          max={1}
          step={0.05}
          value={settings.speechRate}
          onChange={(e) => update({ speechRate: Number(e.target.value) })}
        />
      </label>
      <label className="block text-sm">
        Theme
        <select
          className="mt-1 w-full rounded-lg border px-3 py-2"
          value={settings.themeMode}
          onChange={(e) => update({ themeMode: e.target.value as ThemeMode })}
        >
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </label>
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={redoOnboarding}
          className="rounded-lg border px-4 py-2 text-sm font-medium"
        >
          Redo onboarding
        </button>
        <button
          type="button"
          onClick={resetLearnerId}
          className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-800"
        >
          {confirmReset ? "Confirm reset learner id" : "Reset temporary learner id"}
        </button>
      </div>
      <Link href={AppRoutes.export} className="text-sm text-emerald-800 underline">
        Export to Anki
      </Link>
    </div>
  );
}
