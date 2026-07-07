import { useMemo, useState } from "react";
import { useStore } from "../../store/StoreContext";
import { fmt, fmtDateShort, fmtDateTime } from "../../lib/format";
import { activityPlan, pctOfGoal, projectedAnnualPremium, projectedIncome } from "../../lib/calc";
import StatusBadge from "../shared/StatusBadge";
import type { PlanStatus } from "../../types";

type StatusFilter = "all" | PlanStatus;

export default function PlanApprovals() {
  const { team, approvePlan, requestChanges } = useStore();
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [openNoteFor, setOpenNoteFor] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [range, setRange] = useState<"month" | "ytd">("month");

  // "Submitted plans" = plans the agent themselves put forward — a manager-
  // assigned plan is awaiting the agent's review, not the manager's, so it
  // doesn't belong in this queue.
  const submitted = useMemo(() => team.filter((m) => m.plan?.source === "self_set"), [team]);
  const pendingList = submitted.filter((m) => m.plan?.status === "pending");
  const approvedCount = submitted.filter((m) => m.plan?.status === "approved").length;
  const velocity = submitted.length > 0 ? Math.round((approvedCount / submitted.length) * 100) : 0;

  const filtered = submitted.filter((m) => {
    if (statusFilter !== "all" && m.plan?.status !== statusFilter) return false;
    return m.name.toLowerCase().includes(search.toLowerCase());
  });
  const sorted = [...filtered].sort((a, b) => (a.plan?.status === "pending" ? -1 : 1) - (b.plan?.status === "pending" ? -1 : 1));

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = sorted.find((m) => m.id === selectedId) ?? sorted[0] ?? null;

  function submitChanges(agentId: string) {
    const note = noteDrafts[agentId]?.trim();
    if (!note) return;
    requestChanges(agentId, note);
    setOpenNoteFor(null);
  }

  if (submitted.length === 0) {
    return (
      <div className="animate-fade-in-up rounded-app border border-line bg-card shadow-app p-8 text-center">
        <div className="animate-pop-in mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-green-50 text-brand-green">✓</div>
        <h3 className="font-display text-[0.95rem]">Queue is clear</h3>
        <p className="mt-1 text-sm text-ink-secondary">No plans have been submitted for review yet.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl">Plan Approvals</h2>
          <p className="text-[0.78rem] text-ink-secondary">Review and approve agent growth plans.</p>
        </div>
        <div className="flex gap-2">
          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-brand-amber">
            ● {pendingList.length} Pending
          </span>
          <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-bold text-brand-green">
            ● {approvedCount} Approved
          </span>
        </div>
      </div>

      <div className="animate-fade-in-up mt-4 rounded-app border border-brand-blue/20 bg-blue-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-blue-100 text-brand-blue-dark">⚡</span>
          <div className="text-sm font-bold text-brand-blue-dark">Coaching Insight</div>
        </div>
        <p className="mt-1 text-[0.8rem] text-ink-secondary">
          {pendingList.length > 0
            ? `${pendingList.length} plan${pendingList.length > 1 ? "s are" : " is"} awaiting your review. Use filters to prioritize by submission date or status.`
            : "No plans currently awaiting review."}
        </p>
        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-[0.7rem] font-bold text-brand-green">
          ↗ Team Velocity: {velocity}% approved
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search agents…"
          className="min-w-[200px] flex-1 rounded-lg border border-line bg-card px-3 py-2 text-sm transition focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="rounded-lg border border-line bg-card px-3 py-2 text-xs font-bold text-ink"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="changes">Changes requested</option>
        </select>
        <button className="rounded-lg border border-line bg-card px-3 py-2 text-xs font-bold text-ink-secondary transition hover:border-brand-blue hover:text-brand-blue-dark active:scale-[0.97]">
          ⚑ Filters
        </button>
        <div className="ml-auto flex gap-1 rounded-full border border-line bg-card p-1 text-xs font-bold">
          {(["month", "ytd"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-full px-3.5 py-1.5 transition-all duration-200 active:scale-95 ${
                range === r ? "bg-brand-blue text-white shadow-sm" : "text-ink-secondary hover:text-ink"
              }`}
            >
              {r === "month" ? "This Month" : "YTD"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
        <div>
          <p className="mb-2 text-[0.65rem] font-bold uppercase tracking-wider text-ink-secondary">Submitted plans ({sorted.length})</p>
          <div className="space-y-2">
            {sorted.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedId(m.id)}
                className={`w-full rounded-app border p-3 text-left transition-all duration-150 hover:shadow-sm ${
                  selected?.id === m.id ? "border-brand-blue bg-blue-50" : "border-line bg-card"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-ink">{m.name}</span>
                  <StatusBadge status={m.plan!.status} />
                </div>
                <div className="mt-0.5 flex items-center justify-between text-[0.72rem] text-ink-secondary">
                  <span>Goal: {fmt(m.plan!.goalIncome)}</span>
                  <span className="text-ink-secondary/70">{fmtDateShort(m.plan!.submittedAt)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          {selected && (
            <ApprovalDetail
              key={selected.id}
              member={{ ...selected, plan: selected.plan! }}
              noteDraft={noteDrafts[selected.id] ?? ""}
              onNoteChange={(v) => setNoteDrafts((d) => ({ ...d, [selected.id]: v }))}
              noteOpen={openNoteFor === selected.id}
              onOpenNote={() => setOpenNoteFor(selected.id)}
              onCloseNote={() => setOpenNoteFor(null)}
              onApprove={() => approvePlan(selected.id)}
              onSubmitChanges={() => submitChanges(selected.id)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ApprovalDetail({
  member,
  noteDraft,
  onNoteChange,
  noteOpen,
  onOpenNote,
  onCloseNote,
  onApprove,
  onSubmitChanges,
}: {
  member: import("../../types").TeamMember & { plan: NonNullable<import("../../types").TeamMember["plan"]> };
  noteDraft: string;
  onNoteChange: (v: string) => void;
  noteOpen: boolean;
  onOpenNote: () => void;
  onCloseNote: () => void;
  onApprove: () => void;
  onSubmitChanges: () => void;
}) {
  const plan = member.plan;
  const anp = projectedAnnualPremium(plan.policiesPerMonth, plan.productMix, plan.avgPremium);
  const projIncome = projectedIncome(plan.policiesPerMonth, plan.productMix, plan.avgPremium);
  const pct = pctOfGoal(projIncome, plan.goalIncome);
  const activity = activityPlan(plan.policiesPerMonth);
  const isPending = plan.status === "pending";

  return (
    <div className="animate-fade-in-up rounded-app border border-line bg-card shadow-app p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-display text-[1.05rem] text-ink">{member.name}</div>
          <div className="text-[0.74rem] text-ink-secondary">Plan submitted on {fmtDateTime(plan.submittedAt)}</div>
          <div className="mt-0.5 text-[0.72rem] text-ink-secondary">
            {member.grade} · {member.agency} · {isPending ? "awaiting your review" : plan.status === "approved" ? "approved and live" : "changes requested"}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[0.58rem] font-bold uppercase tracking-wider text-ink-secondary">Target goal</div>
          <div className="text-lg font-extrabold text-brand-blue-dark">{fmt(plan.goalIncome)}</div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {activity.slice(0, 4).map((row) => (
          <div key={row.name} className="rounded-lg bg-app-bg px-3 py-2 transition-colors hover:bg-blue-50/60">
            <div className="text-[0.58rem] font-bold uppercase tracking-wider text-ink-secondary">{row.name}</div>
            <div className="text-lg font-extrabold text-ink">{row.perMonth}</div>
          </div>
        ))}
      </div>

      <div className="mt-3 text-[0.72rem] text-ink-secondary">
        Mix — Accident &amp; Health {plan.productMix.ah}% · Term Life {plan.productMix.term}% · Whole Life {plan.productMix.life}% · projected{" "}
        {fmt(projIncome)}/yr · annualized premium {fmt(anp)}
      </div>
      <div className="mt-1 text-[0.72rem] font-semibold text-ink">{pct}% of goal at this activity level.</div>

      {plan.status === "changes" && plan.managerNote && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[0.75rem] text-brand-red">Your note: "{plan.managerNote}"</div>
      )}

      {isPending &&
        (noteOpen ? (
          <div className="animate-fade-in-up mt-3">
            <label className="block text-xs font-semibold text-ink-secondary">Reason for requesting rework</label>
            <textarea
              value={noteDraft}
              onChange={(e) => onNoteChange(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm transition focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
              placeholder="e.g. Product mix looks aggressive on Life given her book."
            />
            <div className="mt-2 flex justify-end gap-2">
              <button onClick={onCloseNote} className="rounded-lg border border-line px-3 py-1.5 text-xs font-bold text-ink-secondary transition active:scale-[0.97]">
                Cancel
              </button>
              <button
                onClick={onSubmitChanges}
                disabled={!noteDraft.trim()}
                className="rounded-lg bg-brand-red px-3 py-1.5 text-xs font-bold text-white transition hover:shadow-md active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100"
              >
                Send request
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex gap-2">
            <button
              onClick={onOpenNote}
              className="flex-1 rounded-lg border border-line py-2 text-xs font-bold text-ink-secondary transition hover:border-brand-red hover:text-brand-red active:scale-[0.97]"
            >
              ↺ Request Rework
            </button>
            <button
              onClick={onApprove}
              className="flex-1 rounded-lg bg-ink py-2 text-xs font-bold text-white transition hover:bg-brand-blue-dark hover:shadow-md active:scale-[0.97]"
            >
              ✓ Approve Plan
            </button>
          </div>
        ))}
    </div>
  );
}
