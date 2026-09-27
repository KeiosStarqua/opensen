"use client";

import { useEffect } from "react";

import { applyThemeMode, getLearnerSettings } from "@/lib/settings/learner-settings";

export function ThemeBootstrap() {
  useEffect(() => {
    applyThemeMode(getLearnerSettings().themeMode);
    const onChange = () => applyThemeMode(getLearnerSettings().themeMode);
    window.addEventListener("opensen:settings-changed", onChange);
    return () => window.removeEventListener("opensen:settings-changed", onChange);
  }, []);
  return null;
}
