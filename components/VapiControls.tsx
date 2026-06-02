"use client";
import { useVapi } from "@/hooks/useVapi";
import Transcript from "@/components/Transcript";
import { IBook } from "@/types";
import { Mic, MicOff } from "lucide-react";
import Image from "next/image";

const VapiControls = ({ book }: { book: IBook }) => {
  const { title, author, coverURL, persona } = book;
  const {
    messages,
    currentMessage,
    currentUserMessage,
    isActive,
    status,
    stop,
    start,
  } = useVapi(book);
  const showPulseRing =
    isActive && (status === "thinking" || status === "speaking");

  return (
    <>
      <div className="vapi-header-card vapi-card-layout w-full">
        <div className="vapi-cover-wrapper">
          <Image
            src={coverURL}
            alt={title}
            width={130}
            height={195}
            className="vapi-cover-image"
            unoptimized
          />
          <div className="vapi-mic-wrapper">
            <button
              onClick={isActive ? stop : start}
              disabled={status === "connecting" || status === "starting"}
              type="button"
              className={`vapi-mic-btn ${
                isActive ? "vapi-mic-btn-active" : "vapi-mic-btn-inactive"
              }`}
              aria-label={isActive ? "Mic is on" : "Mic is off"}
            >
              {showPulseRing && <span className="vapi-pulse-ring" />}
              {isActive ? (
                <Mic className="text-[#212a3b]" size={24} />
              ) : (
                <MicOff className="text-[#212a3b]" size={24} />
              )}
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[var(--text-primary)]">
              {title}
            </h1>
            <p className="text-[var(--text-secondary)] text-sm sm:text-base">
              by {author}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="vapi-status-indicator">
              <span className="vapi-status-dot vapi-status-dot-ready" />
              <span className="vapi-status-text">Ready</span>
            </div>
            <div className="vapi-status-indicator">
              <span className="vapi-status-text">
                Voice: {persona ?? "Default"}
              </span>
            </div>
            <div className="vapi-status-indicator">
              <span className="vapi-status-text">0:00/15:00</span>
            </div>
          </div>
        </div>
      </div>

      <div className="vapi-transcript-wrapper w-full mt-6">
        <Transcript
          messages={messages}
          currentMessage={currentMessage}
          currentUserMessage={currentUserMessage}
        />
      </div>
    </>
  );
};

export default VapiControls;
