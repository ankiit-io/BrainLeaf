import { startVoiceSession } from "@/lib/actions/session.actions";
import { ASSISTANT_ID, DEFAULT_VOICE } from "@/lib/constants";
import { IBook, Messages } from "@/types";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import Vapi from "@vapi-ai/web";
import { getVoice } from "@/lib/utils";

export type CallStatus =
  | "idle"
  | "connecting"
  | "starting"
  | "listening"
  | "thinking"
  | "speaking"
  | "error";

type TranscriptRole = "assistant" | "user";
type TranscriptPhase = "partial" | "final";

type NormalizedTranscript = {
  role: TranscriptRole;
  phase: TranscriptPhase;
  text: string;
};

const normalizeTranscriptMessage = (
  message: unknown,
): NormalizedTranscript | null => {
  if (!message || typeof message !== "object") {
    return null;
  }

  const raw = message as Record<string, any>;

  if (raw.type !== "transcript") {
    return null;
  }

  const transcriptPayload =
    raw.transcript && typeof raw.transcript === "object"
      ? raw.transcript
      : null;

  const role = (raw.role ??
    transcriptPayload?.role ??
    transcriptPayload?.speaker) as TranscriptRole | undefined;

  const phase = (raw.transcriptType ??
    transcriptPayload?.transcriptType ??
    transcriptPayload?.type) as TranscriptPhase | undefined;

  const text =
    (typeof raw.transcript === "string" ? raw.transcript : null) ??
    (raw.text as string | undefined) ??
    (raw.message as string | undefined) ??
    (transcriptPayload?.text as string | undefined) ??
    (transcriptPayload?.transcript as string | undefined);

  if (
    (role !== "assistant" && role !== "user") ||
    (phase !== "partial" && phase !== "final")
  ) {
    return null;
  }

  if (!text || typeof text !== "string") {
    return null;
  }

  return { role, phase, text };
};

const useLatestRef = <T>(value: T) => {
  const ref = useRef(value);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref;
};

const VAPI_API_KEY = process.env.NEXT_PUBLIC_VAPI_KEY;

let vapi: InstanceType<typeof Vapi>;

function getVapi() {
  if (!vapi) {
    if (!VAPI_API_KEY) {
      throw new Error(
        "VAPI API key is not defined. Please set NEXT_PUBLIC_VAPI_KEY",
      );
    }

    vapi = new Vapi(VAPI_API_KEY);
  }

  return vapi;
}

export const useVapi = (book: IBook) => {
  const { userId } = useAuth();

  const [status, setStatus] = useState<CallStatus>("idle");
  const [messages, setMessages] = useState<Messages[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [currentUserMessage, setCurrentUserMessage] = useState("");
  const [duration, setDuration] = useState(0);
  const [limitError, setLimitError] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const isStoppingRef = useRef(false);

  const bookRef = useLatestRef(book);
  const durationRef = useLatestRef(duration);

  const voice = book.persona || DEFAULT_VOICE;

  const isActive =
    status === "starting" ||
    status === "listening" ||
    status === "thinking" ||
    status === "speaking";

  const appendMessage = (role: TranscriptRole, content: string) => {
    const trimmedContent = content.trim();

    if (!trimmedContent) {
      return;
    }

    setMessages((prev) => {
      const last = prev[prev.length - 1];

      if (
        last &&
        last.role === role &&
        last.content.trim() === trimmedContent
      ) {
        return prev;
      }

      return [...prev, { role, content: trimmedContent }];
    });
  };

  useEffect(() => {
    try {
      const vapiInstance = getVapi();

      const handleCallStart = () => {
        console.log("✅ CALL STARTED");
        setStatus("listening");
      };

      const handleCallEnd = () => {
        console.log("❌ CALL ENDED");
        setStatus("idle");
      };

      const handleSpeechStart = () => {
        console.log("🗣️ ASSISTANT SPEAKING");
        setStatus("speaking");
      };

      const handleSpeechEnd = () => {
        console.log("🎤 LISTENING");
        setStatus("listening");
      };

      const handleMessage = (message: unknown) => {
        const transcript = normalizeTranscriptMessage(message);

        if (!transcript) {
          return;
        }

        if (transcript.phase === "partial") {
          if (transcript.role === "user") {
            setCurrentUserMessage(transcript.text);
          } else {
            setCurrentMessage(transcript.text);
          }
          return;
        }

        if (transcript.role === "user") {
          setCurrentUserMessage("");
          setStatus("thinking");
        } else {
          setCurrentMessage("");
          setStatus("listening");
        }

        appendMessage(transcript.role, transcript.text);
      };

      const handleError = (error: any) => {
        console.error("🚨 VAPI EVENT ERROR:", error);
        setStatus("error");
      };

      vapiInstance.on("call-start", handleCallStart);
      vapiInstance.on("call-end", handleCallEnd);
      vapiInstance.on("speech-start", handleSpeechStart);
      vapiInstance.on("speech-end", handleSpeechEnd);
      vapiInstance.on("message", handleMessage);
      vapiInstance.on("error", handleError);

      return () => {
        vapiInstance.off("call-start", handleCallStart);
        vapiInstance.off("call-end", handleCallEnd);
        vapiInstance.off("speech-start", handleSpeechStart);
        vapiInstance.off("speech-end", handleSpeechEnd);
        vapiInstance.off("message", handleMessage);
        vapiInstance.off("error", handleError);
      };
    } catch (err) {
      console.error(err);
    }
  }, []);

  const start = async () => {
    if (!userId) {
      setLimitError("You must be logged in to use this feature.");
      return;
    }

    setLimitError(null);
    setStatus("connecting");

    try {
      const result = await startVoiceSession(userId, book._id);

      console.log("SESSION RESULT:", result);

      if (!result.success) {
        setLimitError(
          result.error || "Session limit reached. Please upgrade your plan.",
        );

        setStatus("idle");
        return;
      }

      sessionIdRef.current = result.sessionId || null;

      const firstMessage = `Hey, good to meet you! Quick question, before we dive in: Have you actually read ${book.title} by ${book.author} yet, or are we starting fresh?`;

      console.log("========== VAPI DEBUG ==========");
      console.log("ASSISTANT_ID:", ASSISTANT_ID);
      console.log("BOOK:", book);
      console.log("BOOK_ID:", book._id);
      console.log("VOICE:", getVoice(voice));
      console.log("API KEY EXISTS:", !!VAPI_API_KEY);

      if (!ASSISTANT_ID) {
        throw new Error("ASSISTANT_ID is undefined");
      }

      const vapiInstance = getVapi();

      setStatus("starting");

      await vapiInstance.start(ASSISTANT_ID, {
        firstMessage,
        variableValues: {
          title: book.title,
          author: book.author,
          bookId: book._id,
        },
      });

      console.log("✅ VAPI START SUCCESS");
    } catch (error: any) {
      console.log("========== VAPI ERROR ==========");
      console.error(error);

      if (error instanceof Error) {
        console.log("MESSAGE:", error.message);
        console.log("STACK:", error.stack);
      }

      setStatus("idle");
      setLimitError(
        error?.message || "An error occurred while starting the call.",
      );
    }
  };

  const stop = async () => {
    try {
      isStoppingRef.current = true;

      await getVapi().stop();

      setStatus("idle");
    } catch (error) {
      console.error("STOP ERROR:", error);
    }
  };

  const clearErrors = () => {
    setLimitError(null);
  };

  return {
    status,
    messages,
    currentMessage,
    currentUserMessage,
    duration,
    isActive,
    start,
    stop,
    clearErrors,
    limitError,
  };
};

export default useVapi;
