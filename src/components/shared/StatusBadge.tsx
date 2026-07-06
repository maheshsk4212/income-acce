import type { PlanStatus } from "../../types";

// "awaiting_agent" is a display-only variant (not a stored PlanStatus): a
// manager-assigned plan is technically "pending", but it's pending the
// *agent's* review, not the manager's — it must never read as "awaiting
// my approval" on the manager's own screens.
export type BadgeStatus = PlanStatus | "none" | "awaiting_agent";

const CONFIG: Record<BadgeStatus, { label: string; icon: string; classes: string }> = {
  none: { label: "Goal Not Set", icon: "○", classes: "bg-slate-100 text-slate-500 border-slate-200" },
  draft: { label: "Draft", icon: "✎", classes: "bg-slate-100 text-slate-600 border-slate-200" },
  pending: { label: "Pending approval", icon: "◔", classes: "bg-amber-50 text-brand-amber border-amber-200" },
  awaiting_agent: { label: "Awaiting agent review", icon: "◔", classes: "bg-amber-50 text-brand-amber border-amber-200" },
  approved: { label: "Approved", icon: "✓", classes: "bg-green-50 text-brand-green border-green-200" },
  changes: { label: "Changes requested", icon: "!", classes: "bg-red-50 text-brand-red border-red-200" },
};

export default function StatusBadge({ status }: { status: BadgeStatus }) {
  const c = CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.68rem] font-bold ${c.classes}`}
    >
      <span aria-hidden="true">{c.icon}</span>
      {c.label}
    </span>
  );
}
