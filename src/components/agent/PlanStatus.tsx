import { useStore } from "../../store/StoreContext";
import { fmt, fmtDate } from "../../lib/format";
import { activityPlan, blendedAnnualPremium, conversionRates, projectedIncome } from "../../lib/calc";
import StatusBadge from "../shared/StatusBadge";

const ACTIVITY_DOT: Record<string, string> = {
  "New Contacts": "#1366B8",
  "Fact Findings": "#9333EA",
  "Closing Meetings": "#0891B2",
  Policies: "#16A34A",
  Referrals: "#D97706",
};

export default function PlanStatus({ onEdit }: { onEdit: () => void }) {
  const { currentAgent, approvePlan } = useStore();
  const plan = currentAgent.plan!;

  const isAwaitingAcceptance = plan.status === "pending" && plan.source === "manager_assigned";
  const isPendingApproval = plan.status === "pending" && plan.source === "self_set";
  const isApproved = plan.status === "approved";
  const isChanges = plan.status === "changes";

  const projIncome = projectedIncome(plan.policiesPerMonth, plan.productMix, plan.avgPremium);
  const blendedPremium = blendedAnnualPremium(plan.productMix, plan.avgPremium);
  const activity = activityPlan(plan.policiesPerMonth);
  const conversion = conversionRates();

  return (
    <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-12">
      {isAwaitingAcceptance && (
        <div className="animate-fade-in-up flex flex-wrap items-center gap-3 rounded-app border border-brand-blue/30 bg-blue-50 px-4 py-3 lg:col-span-12">
          <StatusBadge status="awaiting_agent" />
          <span className="text-sm font-medium text-brand-blue-dark">
            Your manager assigned an income goal of {fmt(plan.goalIncome)} — review the activity plan, then accept it or adjust and resubmit.
          </span>
          <button
            onClick={() => approvePlan(currentAgent.id)}
            className="ml-auto rounded-lg bg-brand-blue px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-brand-blue-dark hover:shadow-md active:scale-[0.97]"
          >
            Accept &amp; make live
          </button>
        </div>
      )}
      {isChanges && (
        <div className="animate-fade-in-up flex flex-wrap items-center gap-3 rounded-app border border-red-200 bg-red-50 px-4 py-3 lg:col-span-12">
          <StatusBadge status="changes" />
          <span className="text-sm font-medium text-brand-red">Manager note: “{plan.managerNote}”</span>
        </div>
      )}
      {isPendingApproval && (
        <div className="animate-fade-in-up flex flex-wrap items-center gap-3 rounded-app border border-amber-200 bg-amber-50 px-4 py-3 lg:col-span-12">
          <StatusBadge status="pending" />
          <span className="text-sm font-medium text-brand-amber">This plan is with your manager for approval.</span>
          <span className="ml-auto text-[0.7rem] text-brand-amber/80">Submitted {fmtDate(plan.submittedAt)}</span>
        </div>
      )}
      {isApproved && (
        <div className="animate-fade-in-up flex flex-wrap items-center gap-3 rounded-app border border-green-200 bg-green-50 px-4 py-3 lg:col-span-12">
          <StatusBadge status="approved" />
          <span className="text-sm font-medium text-brand-green">This plan is approved and live.</span>
        </div>
      )}

      <div className="rounded-app border border-line bg-card shadow-app p-4 lg:col-span-12">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h3 className="font-display text-[0.95rem]">My Plan</h3>
            <p className="text-[0.77rem] text-ink-secondary">Your submitted income plan and its approval status.</p>
          </div>
          <button
            onClick={onEdit}
            className="rounded-lg bg-brand-blue px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-brand-blue-dark hover:shadow-md active:scale-[0.97]"
          >
            Edit Plan
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Income goal" value={fmt(plan.goalIncome)} />
          <Stat label="Est. monthly income" value={fmt(projIncome)} />
          <Stat label="Policies / month" value={String(plan.policiesPerMonth)} />
          <Stat label="Avg premium" value={fmt(blendedPremium)} />
        </div>

        <h4 className="mt-5 text-xs font-bold uppercase tracking-wider text-ink-secondary">Activity targets</h4>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {activity.map((row) => (
            <div key={row.name} className="rounded-lg border border-line px-3 py-2.5 text-center transition-colors hover:bg-app-bg">
              <span className="mx-auto mb-1 block h-1.5 w-1.5 rounded-full" style={{ background: ACTIVITY_DOT[row.name] }} />
              <div className="text-xl font-extrabold text-ink">{row.perMonth}</div>
              <div className="text-[0.6rem] uppercase tracking-wide text-ink-secondary">{row.name}</div>
              <div className="text-[0.58rem] text-ink-secondary/70">per month</div>
            </div>
          ))}
        </div>

        <h4 className="mt-5 text-xs font-bold uppercase tracking-wider text-ink-secondary">Conversion rates</h4>
        <div className="mt-2 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            ["New Contacts → Fact Findings", `${conversion.contactsToFactFindings}:1`],
            ["Fact Findings → Closing Meetings", `${conversion.factFindingsToClosingMeetings}:1`],
            ["Closing Meetings → Policies", `${conversion.closingMeetingsToPolicies}:1`],
            ["Referrals per policy", `${conversion.referralsPerPolicy}:1`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg bg-app-bg px-3 py-2 transition-colors hover:bg-blue-50/60">
              <div className="text-[0.58rem] font-bold uppercase tracking-wider text-ink-secondary">{label}</div>
              <div className="text-lg font-extrabold text-ink">{value}</div>
            </div>
          ))}
        </div>

        <h4 className="mt-5 text-xs font-bold uppercase tracking-wider text-ink-secondary">Your detailed activity plan list</h4>
        <table className="mt-2 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-[0.62rem] uppercase tracking-wider text-ink-secondary">
              <th className="py-2">Activity</th>
              <th className="py-2 text-right">Per week</th>
              <th className="py-2 text-right">Per month</th>
              <th className="py-2 text-right">Per year</th>
            </tr>
          </thead>
          <tbody>
            {activity.map((row) => (
              <tr key={row.name} className="border-b border-line transition-colors last:border-none hover:bg-app-bg/70">
                <td className="py-2 font-semibold text-ink">{row.name}</td>
                <td className="py-2 text-right text-brand-blue-dark font-semibold">{row.perWeek}</td>
                <td className="py-2 text-right text-ink">{row.perMonth}</td>
                <td className="py-2 text-right text-ink-secondary">{row.perYear.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-app-bg px-3 py-2 transition-colors hover:bg-blue-50/60">
      <div className="text-[0.58rem] font-bold uppercase tracking-wider text-ink-secondary">{label}</div>
      <div className="text-lg font-extrabold text-ink">{value}</div>
    </div>
  );
}
