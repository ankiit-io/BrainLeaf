import { auth } from "@clerk/nextjs/server";

import {
  PLAN_SLUGS,
  resolvePlanFromHas,
  type PlanSlug,
} from "@/lib/subscriptions-constants";

export const getUserPlan = async (): Promise<PlanSlug> => {
  const { userId, has } = await auth();

  if (!userId) {
    return PLAN_SLUGS.free;
  }

  return resolvePlanFromHas(has);
};

export const userHasPlan = async (plan: PlanSlug): Promise<boolean> => {
  const { userId, has } = await auth();

  if (!userId || !has) {
    return false;
  }

  return has({ plan });
};
