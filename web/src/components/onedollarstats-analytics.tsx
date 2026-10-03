import { configure } from "onedollarstats";
import { useEffect } from "react";

let configured = false;

function initOneDollarStats() {
  if (configured || typeof window === "undefined") {
    return;
  }
  configured = true;

  const hostname = import.meta.env.VITE_ONEDOLLARSTATS_HOSTNAME?.trim();
  const collectorUrl =
    import.meta.env.VITE_ONEDOLLARSTATS_COLLECTOR_URL?.trim();
  const devmode = import.meta.env.VITE_ONEDOLLARSTATS_DEVMODE === "true";
  const shared = {
    autocollect: true as const,
    ...(collectorUrl ? { collectorUrl } : {}),
  };

  if (devmode && hostname) {
    configure({ ...shared, hostname, devmode: true });
    return;
  }

  configure({
    ...shared,
    ...(hostname ? { hostname } : {}),
  });
}

/** Initializes onedollarstats once in the root route (SPA pageview tracking). */
export function OneDollarStatsAnalytics() {
  useEffect(() => {
    initOneDollarStats();
  }, []);

  return null;
}
