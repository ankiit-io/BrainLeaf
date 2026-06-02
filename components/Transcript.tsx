"use client";

import { useEffect, useRef } from "react";
import { Mic } from "lucide-react";

import { Messages } from "@/types";

interface TranscriptProps {
  messages: Messages[];
  currentMessage?: string;
  currentUserMessage?: string;
}

const Transcript = ({
  messages,
  currentMessage = "",
  currentUserMessage = "",
}: TranscriptProps) => {
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const hasMessages =
    messages.length > 0 ||
    currentMessage.length > 0 ||
    currentUserMessage.length > 0;

  useEffect(() => {
    if (!messagesRef.current) {
      return;
    }

    messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages, currentMessage, currentUserMessage]);

  return (
    <div className="transcript-container">
      {!hasMessages ? (
        <div className="transcript-empty">
          <Mic className="text-[var(--text-primary)]" size={48} />
          <p className="transcript-empty-text">No conversation yet</p>
          <p className="transcript-empty-hint">
            Click the mic button above to start talking
          </p>
        </div>
      ) : (
        <div className="transcript-messages" ref={messagesRef}>
          {messages.map((message, index) => {
            const isAssistant = message.role === "assistant";

            return (
              <div
                key={`${message.role}-${index}`}
                className={`transcript-message ${
                  isAssistant
                    ? "transcript-message-assistant"
                    : "transcript-message-user"
                }`}
              >
                <div
                  className={`transcript-bubble ${
                    isAssistant
                      ? "transcript-bubble-assistant"
                      : "transcript-bubble-user"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            );
          })}
          {currentUserMessage.length > 0 && (
            <div className="transcript-message transcript-message-user">
              <div className="transcript-bubble transcript-bubble-user">
                {currentUserMessage}
                <span className="transcript-cursor" />
              </div>
            </div>
          )}
          {currentMessage.length > 0 && (
            <div className="transcript-message transcript-message-assistant">
              <div className="transcript-bubble transcript-bubble-assistant">
                {currentMessage}
                <span className="transcript-cursor" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Transcript;
