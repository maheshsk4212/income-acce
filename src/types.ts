export type PlanStatus = "draft" | "pending" | "approved" | "changes";
export type PlanSource = "self_set" | "manager_assigned";

export interface ProductMix {
  ah: number;
  term: number;
  life: number;
}

export interface PremiumRates {
  ah: number;
  term: number;
  life: number;
}

export interface Plan {
  agentId: string;
  status: PlanStatus;
  source: PlanSource;
  goalIncome: number;
  policiesPerMonth: number;
  productMix: ProductMix;
  avgPremium: PremiumRates;
  managerNote?: string;
  submittedAt: string; // ISO date
}

export interface TeamMember {
  id: string;
  name: string;
  grade: string;
  agency: string;
  policiesMtd: number;
  targetIncome: number;
  fycMtd: number;
  plan: Plan | null;
}

export type Role = "agent" | "manager";
