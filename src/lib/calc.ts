import type { Plan, PremiumRates, ProductMix } from "../types";

/**
 * Mock but internally-consistent simulator math.
 * Avg annual premium per product defaults to the sample figures shown in the
 * production design (A&H $383.33, Term $240, Life $2,000 per policy/year) —
 * agents can override them per plan. The six commission-stream formulas
 * below are a discovery-sprint approximation of the real design's numbers,
 * not a reverse-engineered exact match — see NOTES.md.
 */
export const DEFAULT_PREMIUM_RATES: PremiumRates = { ah: 383.33, term: 240, life: 2000 };
const FYC_RATE = 0.35;

export function blendedAnnualPremium(mix: ProductMix, rates: PremiumRates = DEFAULT_PREMIUM_RATES): number {
  return (mix.ah / 100) * rates.ah + (mix.term / 100) * rates.term + (mix.life / 100) * rates.life;
}

export function projectedAnnualPremium(policiesPerMonth: number, mix: ProductMix, rates: PremiumRates = DEFAULT_PREMIUM_RATES): number {
  return policiesPerMonth * 12 * blendedAnnualPremium(mix, rates);
}

export function projectedIncome(policiesPerMonth: number, mix: ProductMix, rates: PremiumRates = DEFAULT_PREMIUM_RATES): number {
  return projectedAnnualPremium(policiesPerMonth, mix, rates) * FYC_RATE;
}

export function pctOfGoal(projected: number, goal: number): number {
  if (goal <= 0) return 0;
  return Math.round((projected / goal) * 100);
}

/** Grade-based monthly policy benchmark, used for the manager's gap column
 *  when an agent has no submitted plan to compare pace against. */
const GRADE_POLICY_BENCHMARK: Record<string, number> = { G1: 6, G2: 10, G3: 14, G4: 18 };

export function policyBenchmark(grade: string, policiesPerMonthFromPlan?: number): number {
  return policiesPerMonthFromPlan ?? GRADE_POLICY_BENCHMARK[grade] ?? 8;
}

/** Rebalance a product mix so it always sums to 100, proportionally
 *  redistributing the remainder across the other two keys. */
export function rebalanceMix(mix: ProductMix, changedKey: keyof ProductMix, newValue: number): ProductMix {
  const clamped = Math.max(0, Math.min(100, newValue));
  const otherKeys = (Object.keys(mix) as (keyof ProductMix)[]).filter((k) => k !== changedKey);
  const remaining = 100 - clamped;
  const otherTotal = otherKeys.reduce((sum, k) => sum + mix[k], 0);

  const next: ProductMix = { ...mix, [changedKey]: clamped };
  if (otherTotal === 0) {
    const share = remaining / otherKeys.length;
    otherKeys.forEach((k) => (next[k] = Math.round(share)));
  } else {
    otherKeys.forEach((k) => {
      next[k] = Math.round((mix[k] / otherTotal) * remaining);
    });
  }
  // fix rounding drift on the last key so total is exactly 100
  const drift = 100 - (next[changedKey] + otherKeys.reduce((s, k) => s + next[k], 0));
  next[otherKeys[otherKeys.length - 1]] += drift;
  return next;
}

/**
 * Funnel multipliers per policy/month, taken from the production design's
 * sample activity plan (100 new contacts : 28 fact findings : 12 closing
 * meetings : 4 policies : 100 referrals). Treated as a fixed conversion
 * rate rather than something the agent tunes directly.
 */
export const ACTIVITY_MULTIPLIER = { newContacts: 25, factFindings: 7, closingMeetings: 3, referrals: 25 } as const;
const WEEKS_PER_MONTH = 4.33;

export interface ActivityRow {
  name: string;
  perWeek: number;
  perMonth: number;
  perYear: number;
}

export interface ActivityCounts {
  newContacts: number;
  factFindings: number;
  closingMeetings: number;
  policies: number;
  referrals: number;
}

/** Activity counts implied by any policy count — used for a single flat
 *  monthly target and, month by month, for historical actuals. */
export function activityForPolicies(policies: number): ActivityCounts {
  return {
    newContacts: Math.round(policies * ACTIVITY_MULTIPLIER.newContacts),
    factFindings: Math.round(policies * ACTIVITY_MULTIPLIER.factFindings),
    closingMeetings: Math.round(policies * ACTIVITY_MULTIPLIER.closingMeetings),
    policies,
    referrals: Math.round(policies * ACTIVITY_MULTIPLIER.referrals),
  };
}

export function activityPlan(policiesPerMonth: number): ActivityRow[] {
  const a = activityForPolicies(policiesPerMonth);
  const monthly = {
    "New Contacts": a.newContacts,
    "Fact Findings": a.factFindings,
    "Closing Meetings": a.closingMeetings,
    Policies: a.policies,
    Referrals: a.referrals,
  };
  return Object.entries(monthly).map(([name, perMonth]) => ({
    name,
    perWeek: Math.round((perMonth / WEEKS_PER_MONTH) * 10) / 10,
    perMonth,
    perYear: perMonth * 12,
  }));
}

export interface ConversionRates {
  contactsToFactFindings: number;
  factFindingsToClosingMeetings: number;
  closingMeetingsToPolicies: number;
  referralsPerPolicy: number;
}

export function conversionRates(): ConversionRates {
  const { newContacts, factFindings, closingMeetings, referrals } = ACTIVITY_MULTIPLIER;
  return {
    contactsToFactFindings: Math.round((newContacts / factFindings) * 10) / 10,
    factFindingsToClosingMeetings: Math.round((factFindings / closingMeetings) * 10) / 10,
    closingMeetingsToPolicies: closingMeetings,
    referralsPerPolicy: referrals,
  };
}

/* ============================================================
 * Six-stream commission engine
 * ============================================================ */

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;
/** Jan–May are "actual" (ramping toward the plan's pace), Jun–Dec are "projected" (flat, at pace). */
export const CURRENT_MONTH_INDEX = 5;
const RAMP = [0.15, 0.3, 0.55, 0.8, 0.95];

export const COMMISSION_COMPONENTS = [
  { key: "fyc", label: "First Year Commission", color: "#1366B8" },
  { key: "lifeMepb", label: "Life Quarterly Persistency Bonus (MEPB)", color: "#16A34A" },
  { key: "ahQuarterly", label: "A&H Quarterly Performance Bonus", color: "#D97706" },
  { key: "ahMonthly", label: "A&H Monthly Persistency Bonus", color: "#9333EA" },
  { key: "acp", label: "Annual Performance Bonus (ACP)", color: "#DB2777" },
  { key: "renewal", label: "Renewal Commission", color: "#0891B2" },
] as const;
export type CommissionKey = (typeof COMMISSION_COMPONENTS)[number]["key"];

export interface MonthRow {
  month: string;
  isActual: boolean;
  policies: number;
  ahCount: number;
  termCount: number;
  lifeCount: number;
  ahPremium: number;
  termPremium: number;
  lifePremium: number;
  totalPremium: number;
  fyc: number;
  lifeMepb: number;
  ahQuarterly: number;
  ahMonthly: number;
  acp: number;
  renewal: number;
  total: number;
}

export function monthlySeries(policiesPerMonth: number, mix: ProductMix, rates: PremiumRates = DEFAULT_PREMIUM_RATES): MonthRow[] {
  const rows: MonthRow[] = [];
  let cumAh = 0;
  let cumLife = 0;
  let yearPremiumSoFar = 0;
  let quarterAh = 0;

  MONTHS.forEach((month, i) => {
    const isActual = i < CURRENT_MONTH_INDEX;
    const policies = Math.round(policiesPerMonth * (isActual ? RAMP[i] : 1));
    const ahCount = Math.round(policies * (mix.ah / 100));
    const termCount = Math.round(policies * (mix.term / 100));
    const lifeCount = Math.max(0, policies - ahCount - termCount);

    const ahPremium = ahCount * rates.ah;
    const termPremium = termCount * rates.term;
    const lifePremium = lifeCount * rates.life;
    const totalPremium = ahPremium + termPremium + lifePremium;

    const fyc = totalPremium * FYC_RATE;
    const ahMonthly = cumAh * 0.0175;

    quarterAh += ahPremium;
    const isQuarterEnd = i % 3 === 2;
    const ahQuarterly = isQuarterEnd ? quarterAh * 0.025 : 0;
    const lifeMepb = isQuarterEnd ? cumLife * 0.06 : 0;
    if (isQuarterEnd) quarterAh = 0;

    yearPremiumSoFar += totalPremium;
    const acp = i === 11 ? yearPremiumSoFar * 0.03 : 0;
    const renewal = 0; // no prior-year book in year 1

    const total = fyc + lifeMepb + ahQuarterly + ahMonthly + acp + renewal;

    rows.push({
      month,
      isActual,
      policies,
      ahCount,
      termCount,
      lifeCount,
      ahPremium,
      termPremium,
      lifePremium,
      totalPremium,
      fyc,
      lifeMepb,
      ahQuarterly,
      ahMonthly,
      acp,
      renewal,
      total,
    });

    cumAh += ahPremium;
    cumLife += lifePremium;
  });

  return rows;
}

export interface YearRow {
  label: string;
  fyc: number;
  lifeMepb: number;
  ahQuarterly: number;
  ahMonthly: number;
  acp: number;
  renewal: number;
  total: number;
}

/** 5-year projection. Year 1 is the actual+projected blend from monthlySeries;
 *  years 2–5 assume the plan's pace repeats flat, with an 80%/yr persistency
 *  decay driving renewal commission on prior years' business. */
export function yearlySeries(policiesPerMonth: number, mix: ProductMix, rates: PremiumRates = DEFAULT_PREMIUM_RATES, years = 5): YearRow[] {
  const year1Months = monthlySeries(policiesPerMonth, mix, rates);
  const sum = (rows: MonthRow[], key: CommissionKey) => rows.reduce((s, r) => s + r[key], 0);

  const annualNewPremium = policiesPerMonth * 12 * blendedAnnualPremium(mix, rates);
  const out: YearRow[] = [
    {
      label: "Yr 1",
      fyc: sum(year1Months, "fyc"),
      lifeMepb: sum(year1Months, "lifeMepb"),
      ahQuarterly: sum(year1Months, "ahQuarterly"),
      ahMonthly: sum(year1Months, "ahMonthly"),
      acp: sum(year1Months, "acp"),
      renewal: 0,
      total: year1Months.reduce((s, r) => s + r.total, 0),
    },
  ];

  for (let y = 2; y <= years; y++) {
    const fyc = annualNewPremium * FYC_RATE;
    const ahMonthly = annualNewPremium * (mix.ah / 100) * 0.0175 * 6; // avg 6 months of prior in-force balance
    const ahQuarterly = annualNewPremium * (mix.ah / 100) * 0.025 * 4;
    const lifeMepb = annualNewPremium * (mix.life / 100) * 0.06 * 4;
    const acp = annualNewPremium * 0.03;
    let renewal = 0;
    for (let priorY = 1; priorY < y; priorY++) {
      renewal += annualNewPremium * 0.1 * Math.pow(0.8, y - priorY);
    }
    out.push({
      label: `Yr ${y}`,
      fyc,
      lifeMepb,
      ahQuarterly,
      ahMonthly,
      acp,
      renewal,
      total: fyc + lifeMepb + ahQuarterly + ahMonthly + acp + renewal,
    });
  }

  return out;
}

export function totalPoliciesThisYear(policiesPerMonth: number): { total: number; actual: number; projected: number } {
  const actual = RAMP.reduce((s, r) => s + Math.round(policiesPerMonth * r), 0);
  const projectedMonths = 12 - CURRENT_MONTH_INDEX;
  const projected = policiesPerMonth * projectedMonths;
  return { total: actual + projected, actual, projected };
}

/* ============================================================
 * Manager-side team analytics
 * ============================================================ */

interface MemberLike {
  grade: string;
  policiesMtd: number;
  fycMtd: number;
  plan: Plan | null;
}

/** Fallback mix assumed for agents with no submitted plan yet — used only
 *  to give the manager's gap table a number to show, never shown to the agent. */
const UNPLANNED_MIX: ProductMix = { ah: 40, term: 30, life: 30 };

export interface AgentMetrics {
  totalPolicies: number;
  targetPolicies: number;
  policyGap: number;
  achievedPremium: number;
  targetPremium: number | null;
  premiumGap: number | null;
  targetFyc: number | null;
  currentFyc: number;
  fycGap: number | null;
  ahPolicies: number;
  ahPremium: number;
  lifePolicies: number;
  lifePremium: number;
}

/** Monthly policy/premium/FYC gaps for one team member, reusing the same
 *  commission engine as the agent side so both roles read the same numbers. */
export function agentMetrics(member: MemberLike): AgentMetrics {
  const mix = member.plan?.productMix ?? UNPLANNED_MIX;
  const rates = member.plan?.avgPremium ?? DEFAULT_PREMIUM_RATES;
  const targetPolicies = policyBenchmark(member.grade, member.plan?.policiesPerMonth);

  const ahPolicies = Math.round(member.policiesMtd * (mix.ah / 100));
  const lifePolicies = Math.round(member.policiesMtd * (mix.life / 100));
  const ahPremium = ahPolicies * rates.ah;
  const lifePremium = lifePolicies * rates.life;
  const achievedPremium = blendedAnnualPremium(mix, rates) * member.policiesMtd;

  const targetPremium = member.plan ? projectedAnnualPremium(member.plan.policiesPerMonth, mix, rates) / 12 : null;
  const targetFyc = member.plan ? projectedIncome(member.plan.policiesPerMonth, mix, rates) / 12 : null;

  return {
    totalPolicies: member.policiesMtd,
    targetPolicies,
    policyGap: member.policiesMtd - targetPolicies,
    achievedPremium,
    targetPremium,
    premiumGap: targetPremium !== null ? achievedPremium - targetPremium : null,
    targetFyc,
    currentFyc: member.fycMtd,
    fycGap: targetFyc !== null ? member.fycMtd - targetFyc : null,
    ahPolicies,
    ahPremium,
    lifePolicies,
    lifePremium,
  };
}

export type AttainmentStatus = "on_track" | "needs_attention" | "at_risk";

export function classifyAttainment(actual: number, target: number): AttainmentStatus {
  if (target <= 0) return actual > 0 ? "on_track" : "needs_attention";
  const pct = actual / target;
  if (pct >= 0.9) return "on_track";
  if (pct >= 0.6) return "needs_attention";
  return "at_risk";
}

/** Grade-based "New Opportunities Pipeline" target — a supplementary,
 *  roughly-flat quota alongside the five funnel metrics. Simplified: not a
 *  reverse-engineered formula, just a plausible per-grade constant. */
const NOP_TARGET_BY_GRADE: Record<string, number> = { G1: 20, G2: 25, G3: 25, G4: 30 };

export interface TeamActivityRow {
  actual: ActivityCounts;
  target: ActivityCounts;
  nop: { actual: number; target: number };
  anp: { actual: number; target: number };
  status: AttainmentStatus;
}

export function teamActivityRow(member: MemberLike): TeamActivityRow {
  const targetPolicies = policyBenchmark(member.grade, member.plan?.policiesPerMonth);
  const actual = activityForPolicies(member.policiesMtd);
  const target = activityForPolicies(targetPolicies);
  const metrics = agentMetrics(member);

  return {
    actual,
    target,
    nop: { actual: Math.round(actual.referrals / 8), target: NOP_TARGET_BY_GRADE[member.grade] ?? 20 },
    anp: { actual: Math.round(metrics.achievedPremium), target: metrics.targetPremium !== null ? Math.round(metrics.targetPremium) : 0 },
    status: classifyAttainment(member.policiesMtd, targetPolicies),
  };
}

export interface MonthlyActivityRow extends TeamActivityRow {
  month: string;
}

/** Month-by-month (actual months only) version of teamActivityRow, used for
 *  "My Progress" YTD breakdowns — same ramp-toward-target assumption as the
 *  rest of the historical tables. */
export function monthlyActivityRows(member: MemberLike): MonthlyActivityRow[] {
  const mix = member.plan?.productMix ?? UNPLANNED_MIX;
  const rates = member.plan?.avgPremium ?? DEFAULT_PREMIUM_RATES;
  const targetPolicies = policyBenchmark(member.grade, member.plan?.policiesPerMonth);
  const series = monthlySeries(targetPolicies, mix, rates).filter((m) => m.isActual);
  const targetActivity = activityForPolicies(targetPolicies);
  const nopTarget = NOP_TARGET_BY_GRADE[member.grade] ?? 20;
  const targetAnp = Math.round(targetPolicies * blendedAnnualPremium(mix, rates));

  return series.map((row) => {
    const actual = activityForPolicies(row.policies);
    return {
      month: row.month,
      actual,
      target: targetActivity,
      nop: { actual: Math.round(actual.referrals / 8), target: nopTarget },
      anp: { actual: Math.round(row.totalPremium), target: targetAnp },
      status: classifyAttainment(row.policies, targetPolicies),
    };
  });
}
