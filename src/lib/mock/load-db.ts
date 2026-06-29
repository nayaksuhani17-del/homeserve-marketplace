import { normalizeMockDatabase, needsNormalization } from "./normalize";
import { MOCK_DB_KEY, MOCK_DB_VERSION, type MockDatabase } from "./types";

export const MOCK_DB_UPDATED_EVENT = "homeserve-mock-db-updated";

function writeDb(db: MockDatabase) {
  try {
    localStorage.setItem(MOCK_DB_KEY, JSON.stringify(db));
  } catch {
    /* storage full — caller still holds normalized in memory */
  }
}

export function loadDb(): MockDatabase | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(MOCK_DB_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MockDatabase;
    if (!parsed.users?.length) return null;

    const staleVersion = parsed.version !== MOCK_DB_VERSION;
    /** Legacy DBs had ~12 providers; reseed when under-populated or version changed. */
    const underPopulated = (parsed.providers?.length ?? 0) < 40;

    if (staleVersion || underPopulated) {
      return null;
    }

    if (needsNormalization(parsed)) {
      const normalized = normalizeMockDatabase(parsed);
      writeDb(normalized);
      return normalized;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function saveDb(db: MockDatabase) {
  const normalized = normalizeMockDatabase(db);
  writeDb(normalized);
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(MOCK_DB_UPDATED_EVENT, { detail: normalized })
    );
  }
}
