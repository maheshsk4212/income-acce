import { useState } from "react";
import { useStore } from "../../store/StoreContext";
import { fmt } from "../../lib/format";
import { activityPlan, pctOfGoal, projectedAnnualPremium, projectedIncome } from "../../lib/calc";
import StatusBadge from "../shared/StatusBadge";

export default function PlanApprovals() {
  const { team, approvePlan, requestChanges } = useStore();
  const queue = team.filter((m) => m.plan?.status === "pending" && m.plan.source === "self_set");
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [openNoteFor, setOpenNoteFor] = useState<string | null>(null);

  if (queue.length === 0) {
    return (
      <div className="animate-fade-in-up rounded-app border border-line bg-card shadow-app p-8 text-center">
        <div className="animate-pop-in mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-green-50 text-brand-green">✓</div>
        <h3 className="font-display text-[0.95rem]">Queue is clear</h3>
        <p className="mt-1 text-sm text-ink-secondary">No plans are waiting on your approval right now.</p>
      </div>
    );
  }

  function submitChanges(agentId: string) {
    const note = noteDrafts[agentId]?.trim();
    if (!note) return;
    requestChanges(agentId, note);
    setOpenNoteFor(null);
  }

  return (
    <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
      {queue.map((m) => {
        const plan = m.plan!;
        const anp = projectedAnnualPremium(plan.policiesPerMonth, plan.productMix, plan.avgPremium);
        const projIncome = projectedIncome(plan.policiesPerMonth, plan.productMix, plan.avgPremium);
        const pct = pctOfGoal(projIncome, plan.goalIncome);
        const activity = activityPlan(plan.policiesPerMonth);

        return (
          <div key={m.id} className="animate-fade-in-up rounded-app border border-line bg-card shadow-app p-4 transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-display text-[0.95rem] text-ink">{m.name}</div>
                <div className="text-[0.74rem] text-ink-secondary">
                  {m.grade} · {m.agency}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[0.58rem] font-bold uppercase tracking-wider text-ink-secondary">Target goal</div>
                <div className="text-lg font-extrabold text-brand-blue-dark">{fmt(plan.goalIncome)}</div>
              </div>
            </div>
            <div className="mt-1"><StatusBadge status="pending" /></div>

            <div className="mt-3 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
              {activity.slice(0, 4).map((row) => (
                <div key={row.name} className="rounded-lg bg-app-bg px-3 py-2 transition-colors hover:bg-blue-50/60">
                  <div className="text-[0.58rem] font-bold uppercase tracking-wider text-ink-secondary">{row.name}</div>
                  <div className="text-lg font-extrabold text-ink">{row.perMonth}</div>
                </div>
              ))}
            </div>

            <div className="mt-3 text-[0.72rem] text-ink-secondary">
              Mix — Accident &amp; Health {plan.productMix.ah}% · Term Life {plan.productMix.term}% · Whole Life {plan.productMix.life}% · projected {fmt(projIncome)}/yr · annualized premium {fmt(anp)}
            </div>
            <div className="mt-1 text-[0.72rem] font-semibold text-ink">{pct}% of goal at this activity level.</div>

            {openNoteFor === m.id ? (
              <div className="animate-fade-in-up mt-3">
                <label className="block text-xs font-semibold text-ink-secondary">Reason for requesting changes</label>
                <textarea
                  value={noteDrafts[m.id] ?? ""}
                  onChange={(e) => setNoteDrafts((d) => ({ ...d, [m.id]: e.target.value }))}
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm transition focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                  placeholder="e.g. Product mix looks aggressive on Life given her book."
                />
                <div className="mt-2 flex justify-end gap-2">
                  <button
                    onClick={() => setOpenNoteFor(null)}
                    className="rounded-lg border border-line px-3 py-1.5 text-xs font-bold text-ink-secondary transition active:scale-[0.97]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => submitChanges(m.id)}
                    disabled={!noteDrafts[m.id]?.trim()}
                    className="rounded-lg bg-brand-red px-3 py-1.5 text-xs font-bold text-white transition hover:shadow-md active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100"
                  >
                    Send request
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => approvePlan(m.id)}
                  className="flex-1 rounded-lg bg-brand-green py-2 text-xs font-bold text-white transition hover:opacity-90 hover:shadow-md active:scale-[0.97]"
                >
                  ✓ Approve
                </button>
                <button
                  onClick={() => setOpenNoteFor(m.id)}
                  className="flex-1 rounded-lg border border-line py-2 text-xs font-bold text-ink-secondary transition hover:border-brand-red hover:text-brand-red active:scale-[0.97]"
                >
                  Request changes
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
