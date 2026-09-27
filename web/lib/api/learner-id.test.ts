import { describe, expect, it } from "vitest";

import {
  generateLearnerId,
  getOrCreateLearnerId,
  isValidLearnerId,
} from "./learner-id";
import { LEARNER_ID_STORAGE_KEY } from "./types";

function memoryStorage(): {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
} {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
  };
}

describe("getOrCreateLearnerId", () => {
  it("creates and persists a UUID when storage is empty", () => {
    const storage = memoryStorage();
    const id = getOrCreateLearnerId(storage);
    expect(isValidLearnerId(id)).toBe(true);
    expect(storage.getItem(LEARNER_ID_STORAGE_KEY)).toBe(id);
  });

  it("reuses a valid stored UUID", () => {
    const storage = memoryStorage();
    const existing = generateLearnerId();
    storage.setItem(LEARNER_ID_STORAGE_KEY, existing);
    expect(getOrCreateLearnerId(storage)).toBe(existing);
  });

  it("regenerates when stored value is invalid", () => {
    const storage = memoryStorage();
    storage.setItem(LEARNER_ID_STORAGE_KEY, "not-a-uuid");
    const id = getOrCreateLearnerId(storage);
    expect(isValidLearnerId(id)).toBe(true);
    expect(storage.getItem(LEARNER_ID_STORAGE_KEY)).toBe(id);
  });
});
