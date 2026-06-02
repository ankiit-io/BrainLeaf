"use server";
import VoiceSession from "@/database/models/voice-session.model";
import { connectToDatabase } from "@/database/mongoose";
import { StartSessionResult } from "@/types";
import { auth } from "@clerk/nextjs/server";
import {
  PLAN_LIMITS,
  getCurrentBillingPeriodStart,
  isUnlimited,
} from "@/lib/subscriptions-constants";
import { getUserPlan } from "@/lib/subscription.server";

export const startVoiceSession = async (
  clerkId: string,
  bookId: string,
): Promise<StartSessionResult> => {
  //call backend API to start session and return session details (sessionId, limits, etc)
  try {
    await connectToDatabase();

    const { userId } = await auth();

    if (!userId || userId !== clerkId) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const plan = await getUserPlan();
    const limits = PLAN_LIMITS[plan];
    const billingPeriodStart = getCurrentBillingPeriodStart();

    if (!isUnlimited(limits.maxSessionsPerMonth)) {
      const sessionsThisPeriod = await VoiceSession.countDocuments({
        clerkId: userId,
        billingPeriodStart,
      });

      if (sessionsThisPeriod >= limits.maxSessionsPerMonth) {
        return {
          success: false,
          maxDurationMinutes: limits.maxSessionMinutes,
          error: `You have reached the monthly session limit for your ${plan} plan (${limits.maxSessionsPerMonth}). Please upgrade to start more sessions.`,
        };
      }
    }

    const session = await VoiceSession.create({
      clerkId: userId,
      bookId,
      startedAt: new Date(),
      billingPeriodStart,
      durationSeconds: 0,
    });
    return {
      success: true,
      sessionId: session._id.toString(),
      maxDurationMinutes: limits.maxSessionMinutes,
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
