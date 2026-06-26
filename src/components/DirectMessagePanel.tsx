"use client";

import { ChatView } from "@/components/chat/ChatView";
import { ChatModal } from "@/components/chat/ChatModal";

type DirectMessagePanelProps = {
  otherUserId: string;
  otherUserName: string;
  onClose?: () => void;
  embedded?: boolean;
};

/** @deprecated Use ChatView or ChatModal directly. */
export function DirectMessagePanel({
  otherUserId,
  otherUserName,
  onClose,
  embedded,
}: DirectMessagePanelProps) {
  if (!embedded) {
    return (
      <ChatModal
        open
        otherUserId={otherUserId}
        otherUserName={otherUserName}
        onClose={onClose ?? (() => {})}
      />
    );
  }

  return (
    <ChatView
      otherUserId={otherUserId}
      otherUserName={otherUserName}
      onClose={onClose}
      layout="embedded"
    />
  );
}

type DirectMessageModalProps = {
  open: boolean;
  otherUserId: string;
  otherUserName: string;
  onClose: () => void;
};

export function DirectMessageModal({
  open,
  otherUserId,
  otherUserName,
  onClose,
}: DirectMessageModalProps) {
  return (
    <ChatModal
      open={open}
      otherUserId={otherUserId}
      otherUserName={otherUserName}
      onClose={onClose}
    />
  );
}
