import { useStore } from "../../store/StoreContext";
import { fmt } from "../../lib/format";
import { monthlySeries, pctOfGoal, policyBenchmark, projectedAnnualPremium, projectedIncome } from "../../lib/calc";
import ProgressRing from "../shared/ProgressRing";
import KpiTile from "../shared/KpiTile";
import StatusBadge from "../shared/StatusBadge";
import HistoricalTables from "../shared/HistoricalTables";

const DEFAULT_MIX = { ah: 25, term: 40, life: 35 };

export default function AgentDashboard({ onGoToPlan }: { onGoToPlan: () => void }) {
  const { currentAgent } = useStore();
  const { plan } = currentAgent;

  const projIncome = plan ? projectedIncome(plan.policiesPerMonth, plan.productMix, plan.avgPremium) : currentAgent.fycMtd * 12;
  const goal = plan ? plan.goalIncome : currentAgent.targetIncome;
  const pct = pctOfGoal(projIncome, goal);
  const anp = plan ? projectedAnnualPremium(plan.policiesPerMonth, plan.productMix, plan.avgPremium) : 0;

  const benchmarkPolicies = policyBenchmark(currentAgent.grade, plan?.policiesPerMonth);
  const monthly = monthlySeries(benchmarkPolicies, plan?.productMix ?? DEFAULT_MIX, plan?.avgPremium);
  const actualMonths = monthly.filter((m) => m.isActual);
  const ytdPolicies = actualMonths.reduce((s, m) => s + m.policies, 0);
  const ytdAnp = actualMonths.reduce((s, m) => s + m.totalPremium, 0);
  const ytdFyc = actualMonths.reduce((s, m) => s + m.fyc, 0);
  const ytdAvgPolicies = Math.round((ytdPolicies / actualMonths.length) * 10) / 10;
  const ytdAvgAnp = ytdAnp / actualMonths.length;
  const ytdAvgFyc = ytdFyc / actualMonths.length;

  return (
    <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-12">
      <Banner onGoToPlan={onGoToPlan} />

      <div className="rounded-app border border-line bg-card shadow-app p-4 lg:col-span-5">
        <h3 className="font-display text-[0.95rem]">Am I on track?</h3>
        <p className="mb-2 text-[0.77rem] text-ink-secondary">Projected income vs. {plan ? "your live goal" : "target"}.</p>
        <div className="flex items-center gap-5">
          <ProgressRing pct={pct} label={pct >= 100 ? "ON TRACK" : pct >= 70 ? "CLOSE" : "AT RISK"} />
          <div className="flex-1 space-y-1.5 text-sm">
            <Row label="Projected annual income" value={fmt(projIncome)} />
            <Row label="Goal" value={fmt(goal)} />
            <Row label="Gap" value={fmt(Math.max(0, goal - projIncome))} highlight={goal - projIncome > 0} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3 lg:col-span-7">
        <KpiTile
          label="Policies this month"
          value={String(currentAgent.policiesMtd)}
          sub={plan ? `of ${plan.policiesPerMonth} planned` : "no plan target set"}
          delta={
            plan
              ? {
                  value: `${currentAgent.policiesMtd - plan.policiesPerMonth >= 0 ? "+" : ""}${
                    currentAgent.policiesMtd - plan.policiesPerMonth
                  } vs plan`,
                  positive: currentAgent.policiesMtd >= plan.policiesPerMonth,
                }
              : undefined
          }
        />
        <KpiTile label="Annualized new premium" value={plan ? fmt(anp) : "—"} sub={plan ? "at current plan pace" : "set a plan to project"} />
        <KpiTile
          label="FY commission (MTD)"
          value={fmt(currentAgent.fycMtd)}
          sub="actual, month to date"
          delta={{ value: `pace ${fmt(currentAgent.fycMtd * 12)}/yr`, positive: currentAgent.fycMtd * 12 >= goal }}
        />
      </div>

      <div className="rounded-app border border-line bg-card shadow-app p-4 lg:col-span-12">
        <h3 className="font-display text-[0.95rem]">Next best action</h3>
        <p className="mt-1 text-[0.8rem] text-ink-secondary">
          {plan === null && "Set an income goal in My Plan — the simulator will translate it into a monthly activity target."}
          {plan?.status === "pending" && plan.source === "self_set" && "Your plan is with your manager for approval. No action needed right now."}
          {plan?.status === "pending" &&
            plan.source === "manager_assigned" &&
            "Your manager assigned you a new goal — open My Plan to review the activity target and accept it."}
          {plan?.status === "changes" && `Your manager requested changes: "${plan.managerNote}". Adjust your plan and resubmit.`}
          {plan?.status === "approved" && "Your plan is approved and live. Focus on hitting the monthly policy target."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:col-span-12">
        <div className="rounded-app border border-line bg-card shadow-app p-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-app-bg text-brand-blue-dark">📅</div>
          <h3 className="mt-2 font-display text-[0.9rem]">Yearly Goal</h3>
          <p className="text-[0.72rem] text-ink-secondary">Full year tracking</p>
          <div className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-3 text-center">
            <MiniStat label="Policies" value={String(ytdPolicies)} />
            <MiniStat label="ANP" value={fmt(ytdAnp)} />
            <MiniStat label="FY Commission" value={fmt(ytdFyc)} />
          </div>
        </div>
        <div className="rounded-app border border-brand-blue bg-blue-50 p-4 shadow-app">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-brand-blue-dark">🕐</div>
          <h3 className="mt-2 font-display text-[0.9rem]">Monthly Avg</h3>
          <p className="text-[0.72rem] text-ink-secondary">Year-to-date average</p>
          <div className="mt-3 grid grid-cols-3 gap-2 border-t border-brand-blue/20 pt-3 text-center">
            <MiniStat label="Policies" value={String(ytdAvgPolicies)} />
            <MiniStat label="ANP" value={fmt(ytdAvgAnp)} />
            <MiniStat label="FY Commission" value={fmt(ytdAvgFyc)} />
          </div>
        </div>
      </div>

      <div className="rounded-app border border-line bg-card shadow-app p-4 lg:col-span-12">
        <HistoricalTables actualMonths={actualMonths} policiesPerMonth={benchmarkPolicies} />
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-sm font-extrabold text-ink">{value}</div>
      <div className="text-[0.58rem] text-ink-secondary">{label}</div>
    </div>
  );
}

function Banner({ onGoToPlan }: { onGoToPlan: () => void }) {
  const { currentAgent } = useStore();
  const { plan } = currentAgent;
  const status = plan?.status ?? "none";

  const styles: Record<string, string> = {
    none: "border-brand-blue/30 bg-blue-50 text-brand-blue-dark",
    pending: "border-amber-200 bg-amber-50 text-brand-amber",
    approved: "border-green-200 bg-green-50 text-brand-green",
    changes: "border-red-200 bg-red-50 text-brand-red",
  };

  const message: Record<string, string> = {
    none: "You haven't set an income goal yet.",
    pending:
      plan?.source === "manager_assigned"
        ? "Your manager assigned you a new income goal — review and accept it."
        : "Your plan is awaiting manager approval.",
    approved: "Your plan is approved — this is your live target.",
    changes: "Your manager requested changes to your plan.",
  };

  const badgeStatus = status === "pending" && plan?.source === "manager_assigned" ? "awaiting_agent" : status;

  return (
    <div className={`animate-fade-in-up flex flex-wrap items-center gap-3 rounded-app border px-4 py-3 lg:col-span-12 ${styles[status]}`}>
      <StatusBadge status={badgeStatus} />
      <span className="text-sm font-medium">{message[status]}</span>
      <button
        onClick={onGoToPlan}
        className="ml-auto rounded-lg bg-ink px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-brand-blue-dark hover:shadow-md active:scale-[0.97]"
      >
        Go to My Plan →
      </button>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between border-b border-line pb-1 last:border-none">
      <span className="text-ink-secondary">{label}</span>
      <b className={highlight ? "text-brand-red" : "text-ink"}>{value}</b>
    </div>
  );
}
