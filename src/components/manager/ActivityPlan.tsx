import { useMemo, useState } from "react";
import { useStore } from "../../store/StoreContext";
import { fmt } from "../../lib/format";
import { classifyAttainment, teamActivityRow, type AttainmentStatus } from "../../lib/calc";

type Range = "week" | "month" | "ytd";
const RANGE_SCALE: Record<Range, number> = { week: 1 / 4.33, month: 1, ytd: 5 };

const SEGMENT_META: Record<AttainmentStatus, { label: string; dot: string; text: string }> = {
  on_track: { label: "On Track", dot: "bg-brand-green", text: "text-brand-green" },
  needs_attention: { label: "Needs Attention", dot: "bg-brand-amber", text: "text-brand-amber" },
  at_risk: { label: "At Risk", dot: "bg-brand-red", text: "text-brand-red" },
};

function cellClass(actual: number, target: number): string {
  if (target <= 0) return "text-ink";
  const status = classifyAttainment(actual, target);
  return status === "on_track" ? "text-brand-green" : status === "needs_attention" ? "text-brand-amber" : "text-brand-red";
}

export default function ActivityPlan() {
  const { team } = useStore();
  const [range, setRange] = useState<Range>("ytd");
  const [search, setSearch] = useState("");
  const scale = RANGE_SCALE[range];

  const rows = useMemo(
    () =>
      team.map((m) => {
        const row = teamActivityRow(m);
        const scaled = {
          newContacts: { actual: Math.round(row.actual.newContacts * scale), target: Math.round(row.target.newContacts * scale) },
          factFindings: { actual: Math.round(row.actual.factFindings * scale), target: Math.round(row.target.factFindings * scale) },
          closingMeetings: { actual: Math.round(row.actual.closingMeetings * scale), target: Math.round(row.target.closingMeetings * scale) },
          policies: { actual: Math.round(row.actual.policies * scale), target: Math.round(row.target.policies * scale) },
          referrals: { actual: Math.round(row.actual.referrals * scale), target: Math.round(row.target.referrals * scale) },
          nop: { actual: Math.round(row.nop.actual * scale), target: Math.round(row.nop.target * scale) },
          anp: { actual: Math.round(row.anp.actual * scale), target: Math.round(row.anp.target * scale) },
        };
        return { ...m, status: row.status, scaled };
      }),
    [team, scale]
  );

  const segmentCounts = rows.reduce(
    (acc, r) => {
      acc[r.status]++;
      return acc;
    },
    { on_track: 0, needs_attention: 0, at_risk: 0 } as Record<AttainmentStatus, number>
  );

  const filtered = rows.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));

  const teamTotal = filtered.reduce(
    (acc, r) => {
      (["newContacts", "factFindings", "closingMeetings", "policies", "referrals", "nop", "anp"] as const).forEach((k) => {
        acc[k].actual += r.scaled[k].actual;
        acc[k].target += r.scaled[k].target;
      });
      return acc;
    },
    {
      newContacts: { actual: 0, target: 0 },
      factFindings: { actual: 0, target: 0 },
      closingMeetings: { actual: 0, target: 0 },
      policies: { actual: 0, target: 0 },
      referrals: { actual: 0, target: 0 },
      nop: { actual: 0, target: 0 },
      anp: { actual: 0, target: 0 },
    }
  );

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl">Team Activity</h2>
          <p className="text-[0.78rem] text-ink-secondary">Monitor your team's activity performance against targets — Jan – May 2026</p>
        </div>
        <div className="flex gap-1 rounded-full border border-line bg-card p-1 text-xs font-bold">
          {(["week", "month", "ytd"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-full px-3.5 py-1.5 transition-all duration-200 active:scale-95 ${
                range === r ? "bg-brand-blue text-white shadow-sm" : "text-ink-secondary hover:text-ink"
              }`}
            >
              {r === "week" ? "This Week" : r === "month" ? "This Month" : "YTD"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full border border-line bg-card px-3 py-1.5 text-xs font-bold text-ink-secondary">
          👥 Total Agents {team.length}
        </span>
        {(Object.keys(SEGMENT_META) as AttainmentStatus[]).map((s) => (
          <span key={s} className={`inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1.5 text-xs font-bold ${SEGMENT_META[s].text}`}>
            <span className={`h-2 w-2 rounded-full ${SEGMENT_META[s].dot}`} />
            {SEGMENT_META[s].label} {segmentCounts[s]}
          </span>
        ))}
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search agent…"
        className="mt-4 w-full max-w-sm rounded-lg border border-line bg-card px-3 py-2 text-sm transition focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
      />

      <div className="mt-4 overflow-x-auto rounded-app border border-line bg-card shadow-app">
        <table className="w-full min-w-[980px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-line text-[0.6rem] uppercase tracking-wider text-ink-secondary">
              <th className="px-3 py-2.5">Agent</th>
              <th className="px-2 py-2.5">Role</th>
              {(["New Contacts", "Fact Findings", "Closing Meetings", "Policies", "Referrals", "NOP", "ANP"] as const).map((h) => (
                <th key={h} className="px-2 py-2.5 text-right">
                  {h}
                  <div className="mt-0.5 flex justify-end gap-2 text-[0.55rem] normal-case text-ink-secondary/70">
                    <span>Actual</span>
                    <span>Target</span>
                  </div>
                </th>
              ))}
              <th className="px-2 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-line transition-colors last:border-none hover:bg-app-bg/60">
                <td className="px-3 py-2">
                  <span className="font-semibold text-ink">{r.name}</span>
                  <div className="text-[0.65rem] text-ink-secondary/70">{r.id}</div>
                </td>
                <td className="px-2 py-2 text-ink-secondary">{r.grade}</td>
                {(["newContacts", "factFindings", "closingMeetings", "policies", "referrals"] as const).map((k) => (
                  <td key={k} className="px-2 py-2 text-right">
                    <span className={`font-bold ${cellClass(r.scaled[k].actual, r.scaled[k].target)}`}>{r.scaled[k].actual}</span>
                    <span className="text-ink-secondary"> / {r.scaled[k].target || "—"}</span>
                  </td>
                ))}
                <td className="px-2 py-2 text-right">
                  <span className={`font-bold ${cellClass(r.scaled.nop.actual, r.scaled.nop.target)}`}>{r.scaled.nop.actual}</span>
                  <span className="text-ink-secondary"> / {r.scaled.nop.target}</span>
                </td>
                <td className="px-2 py-2 text-right">
                  <span className="font-bold text-brand-green">{fmt(r.scaled.anp.actual).replace("$", "$")}</span>
                  <span className="text-ink-secondary">/{fmt(r.scaled.anp.target)}</span>
                </td>
                <td className="px-2 py-2 text-right">
                  <button className="rounded-full border border-line px-2 py-1 text-xs font-bold text-ink-secondary transition hover:border-brand-blue hover:text-brand-blue-dark active:scale-90">
                    Action ▾
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-line font-bold text-ink">
              <td className="px-3 py-2.5" colSpan={2}>
                Team Total
              </td>
              {(["newContacts", "factFindings", "closingMeetings", "policies", "referrals", "nop"] as const).map((k) => (
                <td key={k} className="px-2 py-2.5 text-right">
                  {teamTotal[k].actual} / {teamTotal[k].target}
                </td>
              ))}
              <td className="px-2 py-2.5 text-right">
                {fmt(teamTotal.anp.actual)}/{fmt(teamTotal.anp.target)}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
