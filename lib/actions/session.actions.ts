"use server";
import VoiceSession from "@/database/models/voice-session.model";
import { connectToDatabase } from "@/database/mongoose";
import { StartSessionResult } from "@/types";
import { getCurrentBillingPeriodStart } from "../subscriptions-constants";

export const startVoiceSession = async (
  clerkId: string,
  bookId: string,
): Promise<StartSessionResult> => {
  //call backend API to start session and return session details (sessionId, limits, etc)
  try {
    await connectToDatabase();

    //limits/plan to see whetheer a session is allowed.

    const session = await VoiceSession.create({
      clerkId,
      bookId,
      startedAt: new Date(),
      billingPeriodStart: getCurrentBillingPeriodStart(),
      durationSeconds: 0,
    });
    return {
      success: true,
      sessionId: session._id.toString(),
      //  maxDurationMinutes: check.maxDurationMinutes
    };
  } catch (error) {
    console.error("Error starting voice session", error);
    return {
      success: false,
      error:
        "An error occurred while starting the voice session. Please try again.",
    };
  }
};

export const endVoiceSession = async (
  sessionId: string,
  durationSeconds: number,
): Promise<{ success: boolean }> => {
  try {
    await connectToDatabase();

    const updatedSession = await VoiceSession.findByIdAndUpdate(
      sessionId,
      {
        endedAt: new Date(),
        durationSeconds,
      },
      { new: true },
    );

    if (!updatedSession) {
      return { success: false };
    }

    return { success: true };
  } catch (error) {
    console.error("Error ending voice session", error);
    return { success: false };
  }
};
