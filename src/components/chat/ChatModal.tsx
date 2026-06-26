"use client";

import { ChatView } from "./ChatView";

type ChatModalProps = {
  open: boolean;
  otherUserId: string;
  otherUserName: string;
  onClose: () => void;
};

export function ChatModal({ open, otherUserId, otherUserName, onClose }: ChatModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={`Chat with ${otherUserName}`}
    >
      <div className="w-full max-w-lg animate-slide-up">
        <ChatView
          otherUserId={otherUserId}
          otherUserName={otherUserName}
          onClose={onClose}
          layout="embedded"
        />
      </div>
    </div>
  );
}
