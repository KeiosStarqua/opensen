import { LEARNER_ID_STORAGE_KEY } from "./types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

export function isValidLearnerId(value: string): boolean {
  return UUID_RE.test(value);
}

export function generateLearnerId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "00000000-0000-4000-8000-000000000000";
}

export function getOrCreateLearnerId(storage: StorageLike): string {
  const existing = storage.getItem(LEARNER_ID_STORAGE_KEY);
  if (existing && isValidLearnerId(existing)) {
    return existing;
  }
  const next = generateLearnerId();
  storage.setItem(LEARNER_ID_STORAGE_KEY, next);
  return next;
}
