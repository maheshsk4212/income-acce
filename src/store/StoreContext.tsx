import { createContext, useContext, useMemo, useReducer, type ReactNode } from "react";
import { seedTeam, FOCAL_AGENT_ID } from "../data/seed";
import { DEFAULT_PREMIUM_RATES } from "../lib/calc";
import type { Plan, PremiumRates, ProductMix, Role, TeamMember } from "../types";

interface State {
  team: TeamMember[];
  role: Role;
  currentAgentId: string;
  toast: string | null;
}

type PlanDraft = {
  goalIncome: number;
  policiesPerMonth: number;
  productMix: ProductMix;
  avgPremium: PremiumRates;
};

type Action =
  | { type: "SET_ROLE"; role: Role }
  | { type: "SUBMIT_PLAN"; agentId: string; draft: PlanDraft }
  | { type: "ASSIGN_GOAL"; agentId: string; goalIncome: number }
  | { type: "APPROVE_PLAN"; agentId: string }
  | { type: "REQUEST_CHANGES"; agentId: string; note: string }
  | { type: "CLEAR_TOAST" };

function withPlan(team: TeamMember[], agentId: string, updater: (m: TeamMember) => TeamMember): TeamMember[] {
  return team.map((m) => (m.id === agentId ? updater(m) : m));
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_ROLE":
      return { ...state, role: action.role };

    case "SUBMIT_PLAN": {
      const team = withPlan(state.team, action.agentId, (m) => ({
        ...m,
        plan: {
          agentId: action.agentId,
          status: "pending",
          source: "self_set",
          goalIncome: action.draft.goalIncome,
          policiesPerMonth: action.draft.policiesPerMonth,
          productMix: action.draft.productMix,
          avgPremium: action.draft.avgPremium,
          submittedAt: new Date().toISOString(),
        } satisfies Plan,
      }));
      const agent = team.find((m) => m.id === action.agentId);
      return { ...state, team, toast: `Plan submitted for ${agent?.name ?? "agent"} — awaiting manager approval` };
    }

    case "ASSIGN_GOAL": {
      const team = withPlan(state.team, action.agentId, (m) => ({
        ...m,
        plan: {
          agentId: action.agentId,
          status: "pending",
          source: "manager_assigned",
          goalIncome: action.goalIncome,
          policiesPerMonth: m.plan?.policiesPerMonth ?? Math.max(4, Math.round(m.policiesMtd || 6)),
          productMix: m.plan?.productMix ?? { ah: 25, term: 40, life: 35 },
          avgPremium: m.plan?.avgPremium ?? DEFAULT_PREMIUM_RATES,
          submittedAt: new Date().toISOString(),
        } satisfies Plan,
      }));
      const agent = team.find((m) => m.id === action.agentId);
      return { ...state, team, toast: `Goal assigned to ${agent?.name ?? "agent"} — pending their review` };
    }

    case "APPROVE_PLAN": {
      const team = withPlan(state.team, action.agentId, (m) =>
        m.plan ? { ...m, plan: { ...m.plan, status: "approved", managerNote: undefined } } : m
      );
      const agent = team.find((m) => m.id === action.agentId);
      return { ...state, team, toast: `${agent?.name ?? "Plan"} approved — now the live target` };
    }

    case "REQUEST_CHANGES": {
      const team = withPlan(state.team, action.agentId, (m) =>
        m.plan ? { ...m, plan: { ...m.plan, status: "changes", managerNote: action.note } } : m
      );
      const agent = team.find((m) => m.id === action.agentId);
      return { ...state, team, toast: `Changes requested from ${agent?.name ?? "agent"}` };
    }

    case "CLEAR_TOAST":
      return { ...state, toast: null };

    default:
      return state;
  }
}

interface StoreValue extends State {
  currentAgent: TeamMember;
  pendingCount: number;
  setRole: (role: Role) => void;
  submitPlan: (agentId: string, draft: PlanDraft) => void;
  assignGoal: (agentId: string, goalIncome: number) => void;
  approvePlan: (agentId: string) => void;
  requestChanges: (agentId: string, note: string) => void;
  clearToast: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    team: seedTeam,
    role: "agent",
    currentAgentId: FOCAL_AGENT_ID,
    toast: null,
  });

  const value = useMemo<StoreValue>(() => {
    const currentAgent = state.team.find((m) => m.id === state.currentAgentId) ?? state.team[0];
    // Only self-set submissions await a manager decision; manager-assigned
    // pending plans are awaiting the *agent's* review, not the manager's.
    const pendingCount = state.team.filter((m) => m.plan?.status === "pending" && m.plan.source === "self_set").length;
    return {
      ...state,
      currentAgent,
      pendingCount,
      setRole: (role) => dispatch({ type: "SET_ROLE", role }),
      submitPlan: (agentId, draft) => dispatch({ type: "SUBMIT_PLAN", agentId, draft }),
      assignGoal: (agentId, goalIncome) => dispatch({ type: "ASSIGN_GOAL", agentId, goalIncome }),
      approvePlan: (agentId) => dispatch({ type: "APPROVE_PLAN", agentId }),
      requestChanges: (agentId, note) => dispatch({ type: "REQUEST_CHANGES", agentId, note }),
      clearToast: () => dispatch({ type: "CLEAR_TOAST" }),
    };
  }, [state]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within a StoreProvider");
  return ctx;
}
