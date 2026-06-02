export type PlanSlug = "free" | "standard" | "pro";

export type PlanLimits = {
  maxBooks: number;
  maxSessionsPerMonth: number;
  maxSessionMinutes: number;
  hasSessionHistory: boolean;
  hasFullSessionMemory: boolean;
};

export const PLAN_SLUGS = {
  free: "free",
  standard: "standard",
  pro: "pro",
} as const;

export const PLAN_LIMITS: Record<PlanSlug, PlanLimits> = {
  free: {
    maxBooks: 1,
    maxSessionsPerMonth: 5,
    maxSessionMinutes: 5,
    hasSessionHistory: false,
    hasFullSessionMemory: false,
  },
  standard: {
    maxBooks: 10,
    maxSessionsPerMonth: 100,
    maxSessionMinutes: 15,
    hasSessionHistory: true,
    hasFullSessionMemory: false,
  },
  pro: {
    maxBooks: 100,
    maxSessionsPerMonth: Number.POSITIVE_INFINITY,
    maxSessionMinutes: 60,
    hasSessionHistory: true,
    hasFullSessionMemory: true,
  },
};

type PlanCheck = { plan?: string };

export const resolvePlanFromHas = (
  has?: (check: PlanCheck) => boolean,
): PlanSlug => {
  if (!has) return PLAN_SLUGS.free;
  if (has({ plan: PLAN_SLUGS.pro })) return PLAN_SLUGS.pro;
  if (has({ plan: PLAN_SLUGS.standard })) return PLAN_SLUGS.standard;
  return PLAN_SLUGS.free;
};

export const isUnlimited = (value: number) => !Number.isFinite(value);

export const getCurrentBillingPeriodStart = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
};
