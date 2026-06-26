import { newId } from "@/lib/mock/guest";

/** localStorage key — value is a JSON array of message objects. */
export const MESSAGES_STORAGE_KEY = "homeserve-messages";

export const MESSAGES_UPDATED_EVENT = "homeserve-messages-updated";

export type StoredMessage = {
  id: string;
  sender_id: string;
  receiver_id: string;
  text: string;
  timestamp: string;
};

function isStoredMessage(value: unknown): value is StoredMessage {
  if (!value || typeof value !== "object") return false;
  const m = value as StoredMessage;
  return (
    typeof m.id === "string" &&
    typeof m.sender_id === "string" &&
    typeof m.receiver_id === "string" &&
    typeof m.text === "string" &&
    typeof m.timestamp === "string"
  );
}

function hasStorage(): boolean {
  return typeof localStorage !== "undefined";
}

export function loadMessagesFromStorage(): StoredMessage[] {
  if (!hasStorage()) return [];
  try {
    const raw = localStorage.getItem(MESSAGES_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isStoredMessage);
  } catch {
    return [];
  }
}

export function saveMessagesToStorage(messages: StoredMessage[]): void {
  if (!hasStorage()) return;
  try {
    localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(MESSAGES_UPDATED_EVENT));
    }
  } catch {
    /* storage full */
  }
}

export function appendMessage(input: {
  sender_id: string;
  receiver_id: string;
  text: string;
  id?: string;
  timestamp?: string;
}): StoredMessage {
  const message: StoredMessage = {
    id: input.id ?? newId("msg"),
    sender_id: input.sender_id,
    receiver_id: input.receiver_id,
    text: input.text,
    timestamp: input.timestamp ?? new Date().toISOString(),
  };
  const messages = loadMessagesFromStorage();
  saveMessagesToStorage([...messages, message]);
  return message;
}

/** Messages between two users (both directions), oldest first. */
export function getConversationMessages(
  currentUserId: string,
  otherUserId: string
): StoredMessage[] {
  const messages = loadMessagesFromStorage();
  return messages
    .filter(
      (m) =>
        (m.sender_id === currentUserId && m.receiver_id === otherUserId) ||
        (m.sender_id === otherUserId && m.receiver_id === currentUserId)
    )
    .sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
}

/** One-time import from legacy mock-db directMessages. */
export function migrateDirectMessages(
  legacy: Array<{
    id: string;
    senderId: string;
    receiverId: string;
    text: string;
    createdAt: string;
  }>
): number {
  if (!legacy.length) return 0;
  const existing = loadMessagesFromStorage();
  const existingIds = new Set(existing.map((m) => m.id));
  const migrated: StoredMessage[] = legacy
    .filter((m) => !existingIds.has(m.id))
    .map((m) => ({
      id: m.id,
      sender_id: m.senderId,
      receiver_id: m.receiverId,
      text: m.text,
      timestamp: m.createdAt,
    }));
  if (migrated.length === 0) return 0;
  saveMessagesToStorage([...existing, ...migrated]);
  return migrated.length;
}

export function removeMessagesForUser(userId: string): void {
  const next = loadMessagesFromStorage().filter(
    (m) => m.sender_id !== userId && m.receiver_id !== userId
  );
  saveMessagesToStorage(next);
}
