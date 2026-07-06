import { useStore } from "../../store/StoreContext";
import type { Role } from "../../types";

export type AgentScreen = "dashboard" | "plan";
export type ManagerScreen = "team" | "approvals" | "activity";

interface SidebarProps {
  role: Role;
  agentScreen: AgentScreen;
  managerScreen: ManagerScreen;
  onAgentNav: (s: AgentScreen) => void;
  onManagerNav: (s: ManagerScreen) => void;
  collapsed: boolean;
}

const statusPill: Record<string, { label: string; classes: string }> = {
  none: { label: "Goal Not Set", classes: "bg-white/10 text-slate-300" },
  draft: { label: "Draft", classes: "bg-white/10 text-slate-300" },
  pending: { label: "Pending", classes: "bg-amber-400/20 text-amber-200" },
  awaiting_agent: { label: "Awaiting your review", classes: "bg-amber-400/20 text-amber-200" },
  approved: { label: "Approved", classes: "bg-green-400/20 text-green-200" },
  changes: { label: "Changes requested", classes: "bg-red-400/20 text-red-200" },
};

export default function Sidebar({ role, agentScreen, managerScreen, onAgentNav, onManagerNav, collapsed }: SidebarProps) {
  const { currentAgent, pendingCount } = useStore();
  const plan = currentAgent.plan;
  const pillKey = plan?.status === "pending" && plan.source === "manager_assigned" ? "awaiting_agent" : plan?.status ?? "none";
  const pill = statusPill[pillKey];

  return (
    <aside
      className={`fixed left-0 top-0 bottom-0 z-40 flex flex-col gap-1 overflow-y-auto bg-gradient-to-b from-ink to-[#123354] px-2.5 pb-3 pt-4 transition-all ${
        collapsed ? "w-16 px-1.5" : "w-60"
      }`}
    >
      <div className="flex items-center gap-2 px-2 pb-4 pt-0.5 text-white">
        <svg width="22" height="20" viewBox="0 0 26 24" className="shrink-0">
          <path d="M2 22 L8 2 L13 14 L18 2 L24 22 H19 L16.5 13 L13 21 L9.5 13 L7 22 Z" fill="#1366B8" />
          <path d="M8 2 L13 14 L11 19 L5.5 5.5 Z" fill="#7ED957" />
        </svg>
        {!collapsed && (
          <span className="text-sm font-bold leading-tight">
            Income Accelerator
            <small className="block text-[0.58rem] font-normal tracking-widest text-slate-400">DISCOVERY PROTOTYPE</small>
          </span>
        )}
      </div>

      {role === "agent" ? (
        <>
          <NavButton active={agentScreen === "dashboard"} icon="⌂" label="Dashboard" collapsed={collapsed} onClick={() => onAgentNav("dashboard")} />
          <NavButton active={agentScreen === "plan"} icon="◎" label="My Plan" collapsed={collapsed} onClick={() => onAgentNav("plan")} />
          {!collapsed && (
            <div className="mx-1 mt-3 rounded-lg bg-white/5 p-2.5">
              <div className="text-[0.6rem] uppercase tracking-wider text-slate-400">My plan status</div>
              <span key={pillKey} className={`animate-pop-in mt-1 inline-block rounded-full px-2 py-0.5 text-[0.65rem] font-bold transition-colors ${pill.classes}`}>
                {pill.label}
              </span>
            </div>
          )}
        </>
      ) : (
        <>
          <NavButton active={managerScreen === "team"} icon="⌂" label="Dashboard" collapsed={collapsed} onClick={() => onManagerNav("team")} />
          <NavButton
            active={managerScreen === "approvals"}
            icon="◔"
            label="Plan Approvals"
            collapsed={collapsed}
            badge={pendingCount || undefined}
            onClick={() => onManagerNav("approvals")}
          />
          <NavButton active={managerScreen === "activity"} icon="📈" label="Activity Plan" collapsed={collapsed} onClick={() => onManagerNav("activity")} />
        </>
      )}

      <div className="flex-1" />
      <div className="mt-2 flex items-center gap-2 border-t border-white/10 pt-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-blue text-[0.66rem] font-bold text-white">
          {role === "agent" ? "SA" : "AT"}
        </span>
        {!collapsed && (
          <div className="leading-tight">
            <div className="text-[0.74rem] font-semibold text-white">{role === "agent" ? "Sabine Aouad" : "Ahmad Tarabay"}</div>
            <div className="text-[0.6rem] text-slate-400">{role === "agent" ? "Agent · G1 · LB Agency" : "Manager · LB Agency"}</div>
          </div>
        )}
      </div>
    </aside>
  );
}

function NavButton({
  active,
  icon,
  label,
  collapsed,
  badge,
  onClick,
}: {
  active: boolean;
  icon: string;
  label: string;
  collapsed: boolean;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-all duration-150 active:scale-[0.98] ${
        active ? "bg-brand-blue font-bold text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"
      }`}
    >
      <span className="w-4 flex-none text-center">{icon}</span>
      {!collapsed && <span className="flex-1">{label}</span>}
      {!collapsed && badge ? (
        <span className="animate-pop-in flex-none rounded-full bg-amber-400 px-1.5 text-[0.62rem] font-bold text-ink">{badge}</span>
      ) : null}
    </button>
  );
}
