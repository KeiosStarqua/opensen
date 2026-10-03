import { AppLink } from "@/components/app-link";
import { useAppNavigate } from "@/lib/use-app-navigate";
import { useState } from "react";

import { AppRoutes } from "@/lib/app-routes";
import { ONBOARDING_COMPLETE_KEY } from "@/lib/onboarding-storage";
import { queryErrorMessage } from "@/lib/query/api-query";
import { useSetOnboardingComplete } from "@/lib/query/hooks/onboarding";
import {
  applyThemeMode,
  getLearnerSettings,
  saveLearnerSettings,
  type LearnerSettings,
  type ThemeMode,
} from "@/lib/settings/learner-settings";

const DEFAULTS = getLearnerSettings();

export function SettingsForm() {
  const navigate = useAppNavigate();
  const setOnboardingComplete = useSetOnboardingComplete();
  const [settings, setSettings] = useState<LearnerSettings>(() =>
    typeof window === "undefined" ? DEFAULTS : getLearnerSettings(),
  );

  function update(patch: Partial<LearnerSettings>) {
    const next = saveLearnerSettings(patch);
    setSettings(next);
    if (patch.themeMode) {
      applyThemeMode(patch.themeMode);
    }
  }

  const redoError = queryErrorMessage(setOnboardingComplete.error);

  function redoOnboarding() {
    update({ onboardingComplete: false });
    window.localStorage.removeItem(ONBOARDING_COMPLETE_KEY);
    setOnboardingComplete.mutate(false, {
      onSuccess: () => navigate(AppRoutes.onboarding),
    });
  }

  return (
    <div className="space-y-8">
      <AppLink href={AppRoutes.home} className="text-sm text-slate-600">
        ← Home
      </AppLink>
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
          disabled={setOnboardingComplete.isPending}
          className="rounded-lg border px-4 py-2 text-sm font-medium"
        >
          Redo onboarding
        </button>
        {redoError ? <p className="text-sm text-red-700">{redoError}</p> : null}
      </div>
      <AppLink href={AppRoutes.export} className="text-sm text-emerald-800 underline">
        Export to Anki
      </AppLink>
    </div>
  );
}
