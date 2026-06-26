import { loadMessagesFromStorage, type StoredMessage } from "./store";

export type ConversationPreview = {
  otherUserId: string;
  otherUserName: string;
  lastMessage: string;
  lastTimestamp: string;
};

type UserRef = { id: string; name: string; banned: boolean };

function lastMessageForPair(
  messages: StoredMessage[],
  currentUserId: string,
  otherUserId: string
): StoredMessage | undefined {
  let latest: StoredMessage | undefined;
  for (const m of messages) {
    const match =
      (m.sender_id === currentUserId && m.receiver_id === otherUserId) ||
      (m.sender_id === otherUserId && m.receiver_id === currentUserId);
    if (!match) continue;
    if (!latest || new Date(m.timestamp) > new Date(latest.timestamp)) {
      latest = m;
    }
  }
  return latest;
}

/** All conversations for a user, newest activity first. */
export function listConversationsForUser(
  currentUserId: string,
  users: UserRef[]
): ConversationPreview[] {
  const messages = loadMessagesFromStorage();
  const activeUsers = users.filter((u) => !u.banned && u.id !== currentUserId);
  const nameById = new Map(activeUsers.map((u) => [u.id, u.name]));

  const otherIds = new Set<string>();
  for (const m of messages) {
    if (m.sender_id === currentUserId) otherIds.add(m.receiver_id);
    else if (m.receiver_id === currentUserId) otherIds.add(m.sender_id);
  }

  const previews: ConversationPreview[] = [];
  for (const otherUserId of otherIds) {
    const name = nameById.get(otherUserId);
    if (!name) continue;
    const last = lastMessageForPair(messages, currentUserId, otherUserId);
    if (!last) continue;
    previews.push({
      otherUserId,
      otherUserName: name,
      lastMessage: last.text,
      lastTimestamp: last.timestamp,
    });
  }

  return previews.sort(
    (a, b) =>
      new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime()
  );
}
