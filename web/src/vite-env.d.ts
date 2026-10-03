/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENSEN_API_URL?: string;
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_ONEDOLLARSTATS_HOSTNAME?: string;
  readonly VITE_ONEDOLLARSTATS_DEVMODE?: string;
  readonly VITE_ONEDOLLARSTATS_COLLECTOR_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
