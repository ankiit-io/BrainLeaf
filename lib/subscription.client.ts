"use client";

import { useAuth } from "@clerk/nextjs";

import {
  PLAN_LIMITS,
  PLAN_SLUGS,
  resolvePlanFromHas,
  type PlanSlug,
  type PlanLimits,
} from "@/lib/subscriptions-constants";

type UsePlanResult = {
  isLoaded: boolean;
  isSignedIn: boolean | undefined;
  plan: PlanSlug;
  limits: PlanLimits;
  hasPlan: (plan: PlanSlug) => boolean;
};

export const useUserPlan = (): UsePlanResult => {
  const { isLoaded, isSignedIn, has } = useAuth();

  const plan =
    isLoaded && isSignedIn ? resolvePlanFromHas(has) : PLAN_SLUGS.free;

  const hasPlan = (planToCheck: PlanSlug) =>
    Boolean(isLoaded && isSignedIn && has?.({ plan: planToCheck }));

  return {
    isLoaded,
    isSignedIn,
    plan,
    limits: PLAN_LIMITS[plan],
    hasPlan,
  };
};
