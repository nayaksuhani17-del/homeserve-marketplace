import { normalizeMockDatabase, needsNormalization } from "./normalize";
import { MOCK_DB_KEY, MOCK_DB_VERSION, type MockDatabase } from "./types";

export const MOCK_DB_UPDATED_EVENT = "homeserve-mock-db-updated";

export function loadDb(): MockDatabase | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(MOCK_DB_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MockDatabase;
    if (parsed.version !== MOCK_DB_VERSION) return null;
    if (!needsNormalization(parsed)) return parsed;
    const normalized = normalizeMockDatabase(parsed);
    try {
      localStorage.setItem(MOCK_DB_KEY, JSON.stringify(normalized));
    } catch {
      /* storage full — still return normalized in memory */
    }
    return normalized;
  } catch {
    return null;
  }
}

export function saveDb(db: MockDatabase) {
  const normalized = normalizeMockDatabase(db);
  localStorage.setItem(MOCK_DB_KEY, JSON.stringify(normalized));
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(MOCK_DB_UPDATED_EVENT, { detail: normalized })
    );
  }
}
