import { useMemo, useState } from "react";
import { useStore } from "../../store/StoreContext";
import { fmt } from "../../lib/format";
import { agentMetrics, policyBenchmark } from "../../lib/calc";
import KpiTile from "../shared/KpiTile";
import StatusBadge from "../shared/StatusBadge";
import AssignGoalModal from "./AssignGoalModal";
import type { TeamMember } from "../../types";

type SortKey = "anp" | "name" | "gap";

export default function TeamDashboard({ onOpenApprovals }: { onOpenApprovals: () => void }) {
  const { team, pendingCount } = useStore();
  const [modalAgent, setModalAgent] = useState<TeamMember | null>(null);
  const [range, setRange] = useState<"month" | "ytd">("month");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("anp");

  const rows = useMemo(
    () =>
      team.map((m) => {
        const benchmark = policyBenchmark(m.grade, m.plan?.policiesPerMonth);
        return { ...m, benchmark, gap: m.policiesMtd - benchmark, metrics: agentMetrics(m) };
      }),
    [team]
  );

  const mostAtRisk = [...rows].sort((a, b) => a.gap - b.gap)[0];
  const recommendation = !mostAtRisk.plan
    ? `No income plan set — assign a goal to create accountability and a coaching baseline.`
    : mostAtRisk.plan.status === "changes"
    ? `Their plan is awaiting revisions after your note — a quick check-in may help them resubmit faster.`
    : `Behind pace this month — a short coaching conversation on activity could close the gap.`;

  // No historical monthly log exists yet, so "vs last month" deltas are
  // approximated from a flat prior-period factor rather than real history.
  const priorFactor = range === "month" ? 1.18 : 1.06;
  const prior = (n: number) => Math.round(n * priorFactor);
  const delta = (current: number, isCurrency: boolean) => {
    const d = current - prior(current);
    return { value: `${d >= 0 ? "+" : ""}${isCurrency ? fmt(d) : d} vs ${range === "month" ? "last month" : "last year"}`, positive: d >= 0 };
  };

  const totals = rows.reduce(
    (acc, m) => {
      acc.policies += m.metrics.totalPolicies;
      acc.premium += m.metrics.achievedPremium;
      acc.lifePolicies += m.metrics.lifePolicies;
      acc.lifePremium += m.metrics.lifePremium;
      acc.ahPolicies += m.metrics.ahPolicies;
      acc.ahPremium += m.metrics.ahPremium;
      return acc;
    },
    { policies: 0, premium: 0, lifePolicies: 0, lifePremium: 0, ahPolicies: 0, ahPremium: 0 }
  );

  const filtered = rows.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));
  const sorted = [...filtered].sort((a, b) => {
    if (sortKey === "name") return a.name.localeCompare(b.name);
    if (sortKey === "gap") return a.gap - b.gap;
    return b.metrics.achievedPremium - a.metrics.achievedPremium;
  });

  return (
    <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-12">
      <div className="flex items-center justify-between gap-3 lg:col-span-12">
        <div>
          <h2 className="font-display text-xl">Agent Activities</h2>
          <p className="text-[0.78rem] text-ink-secondary">
            Monday, June 29, 2026 · <b className="text-ink">{team.length} Agents Managed</b> · May 2026
          </p>
        </div>
        <div className="flex gap-1 rounded-full border border-line bg-card p-1 text-xs font-bold">
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

      <div className="animate-fade-in-up flex flex-wrap items-start gap-3 rounded-app border border-amber-200 bg-amber-50 px-4 py-3 lg:col-span-12">
        <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-amber-100 text-brand-amber">!</span>
        <div>
          <div className="text-sm font-bold text-brand-amber">
            Coaching insight — {mostAtRisk.name} is {Math.abs(mostAtRisk.gap)} {mostAtRisk.gap < 0 ? "behind" : "ahead of"} pace this month
          </div>
          <div className="text-[0.78rem] text-ink-secondary">{recommendation}</div>
        </div>
        <button
          onClick={() => setModalAgent(mostAtRisk)}
          className="ml-auto flex-none rounded-lg bg-ink px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-brand-blue-dark hover:shadow-md active:scale-[0.97]"
        >
          Assign / adjust goal
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3.5 lg:col-span-12 lg:grid-cols-3 xl:grid-cols-6">
        <KpiTile label="Total policies" value={String(totals.policies)} delta={delta(totals.policies, false)} />
        <KpiTile label="Total premium" value={fmt(totals.premium)} delta={delta(totals.premium, true)} />
        <KpiTile label="Life policies" value={String(totals.lifePolicies)} delta={delta(totals.lifePolicies, false)} />
        <KpiTile label="Life premium" value={fmt(totals.lifePremium)} delta={delta(totals.lifePremium, true)} />
        <KpiTile label="A&H policies" value={String(totals.ahPolicies)} delta={delta(totals.ahPolicies, false)} />
        <KpiTile label="A&H premium" value={fmt(totals.ahPremium)} delta={delta(totals.ahPremium, true)} />
      </div>

      <div className="flex flex-wrap items-center gap-2 lg:col-span-12">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search agents or regions…"
          className="min-w-[220px] flex-1 rounded-lg border border-line bg-card px-3 py-2 text-sm transition focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
        />
        <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-secondary">
          Sort by
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="rounded-lg border border-line bg-card px-2 py-1.5 text-xs font-bold text-ink"
          >
            <option value="anp">ANP Value</option>
            <option value="name">Name</option>
            <option value="gap">Policy gap</option>
          </select>
        </label>
        <button className="rounded-lg border border-line bg-card px-3 py-2 text-xs font-bold text-ink-secondary transition hover:border-brand-blue hover:text-brand-blue-dark active:scale-[0.97]">
          ⚑ Filters
        </button>
      </div>

      <div className="rounded-app border border-line bg-card shadow-app p-4 lg:col-span-12">
        <div className="mb-2 flex items-baseline gap-2">
          <h3 className="font-display text-[0.95rem]">Team</h3>
          {pendingCount > 0 && (
            <button
              onClick={onOpenApprovals}
              className="ml-auto rounded-lg bg-brand-blue px-3 py-1.5 text-xs font-bold text-white transition hover:bg-brand-blue-dark hover:shadow-md active:scale-[0.97]"
            >
              Review {pendingCount} pending plan{pendingCount > 1 ? "s" : ""} →
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line text-[0.6rem] uppercase tracking-wider text-ink-secondary">
                <th className="px-2 py-2">Agent</th>
                <th className="px-2 py-2">Grade</th>
                <th className="px-2 py-2 text-right">Total policies</th>
                <th className="px-2 py-2 text-right">Target policy</th>
                <th className="px-2 py-2 text-right">Policy gap</th>
                <th className="px-2 py-2 text-right">Achieved premium</th>
                <th className="px-2 py-2 text-right">Target premium</th>
                <th className="px-2 py-2 text-right">Premium gap</th>
                <th className="px-2 py-2 text-right">Target FYC</th>
                <th className="px-2 py-2 text-right">Current FYC</th>
                <th className="px-2 py-2 text-right">FYC gap</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((m) => {
                const { metrics } = m;
                return (
                  <tr key={m.id} className="border-b border-line transition-colors last:border-none hover:bg-app-bg/60">
                    <td className="px-2 py-2.5">
                      <span className="font-semibold text-ink">{m.name}</span>
                      <div className="text-[0.65rem] text-ink-secondary/70">{m.id}</div>
                    </td>
                    <td className="px-2 py-2.5">
                      <span className="rounded bg-app-bg px-1.5 py-0.5 text-[0.62rem] font-bold text-ink-secondary">{m.grade}</span>
                    </td>
                    <td className="px-2 py-2.5 text-right font-semibold text-ink">{metrics.totalPolicies}</td>
                    <td className="px-2 py-2.5 text-right text-ink-secondary">{metrics.targetPolicies}</td>
                    <td className={`px-2 py-2.5 text-right font-bold ${metrics.policyGap < 0 ? "text-brand-red" : "text-brand-green"}`}>
                      {metrics.policyGap > 0 ? "+" : ""}
                      {metrics.policyGap}
                    </td>
                    <td className="px-2 py-2.5 text-right font-semibold text-ink">{fmt(metrics.achievedPremium)}</td>
                    <td className="px-2 py-2.5 text-right text-ink-secondary">{metrics.targetPremium !== null ? fmt(metrics.targetPremium) : "—"}</td>
                    <td className={`px-2 py-2.5 text-right font-bold ${metrics.premiumGap !== null ? (metrics.premiumGap < 0 ? "text-brand-red" : "text-brand-green") : "text-ink-secondary"}`}>
                      {metrics.premiumGap !== null ? fmt(metrics.premiumGap) : "—"}
                    </td>
                    <td className="px-2 py-2.5 text-right text-ink-secondary">{metrics.targetFyc !== null ? fmt(metrics.targetFyc) : "—"}</td>
                    <td className="px-2 py-2.5 text-right font-semibold text-ink">{fmt(metrics.currentFyc)}</td>
                    <td className={`px-2 py-2.5 text-right font-bold ${metrics.fycGap !== null ? (metrics.fycGap < 0 ? "text-brand-red" : "text-brand-green") : "text-ink-secondary"}`}>
                      {metrics.fycGap !== null ? fmt(metrics.fycGap) : "—"}
                    </td>
                    <td className="px-2 py-2.5">
                      <StatusBadge
                        status={m.plan?.status === "pending" && m.plan.source === "manager_assigned" ? "awaiting_agent" : m.plan?.status ?? "none"}
                      />
                    </td>
                    <td className="px-2 py-2.5 text-right">
                      <button
                        onClick={() => setModalAgent(m)}
                        className="rounded-full border border-line px-2 py-1 text-xs font-bold text-ink-secondary transition hover:border-brand-blue hover:text-brand-blue-dark active:scale-90"
                        title="Actions"
                      >
                        •••
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-center text-[0.68rem] text-ink-secondary/70">Data synced: today at 12:07 PM</p>
      </div>

      {modalAgent && <AssignGoalModal agent={modalAgent} onClose={() => setModalAgent(null)} />}
    </div>
  );
}
