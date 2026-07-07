import { useState } from "react";
import { useStore } from "../../store/StoreContext";
import { fmt } from "../../lib/format";
import { classifyAttainment, monthlyActivityRows } from "../../lib/calc";

const METRICS = ["newContacts", "factFindings", "closingMeetings", "policies", "referrals", "nop", "anp"] as const;
const METRIC_LABEL: Record<(typeof METRICS)[number], string> = {
  newContacts: "New Contacts",
  factFindings: "Fact Findings",
  closingMeetings: "Closing Meetings",
  policies: "Policies",
  referrals: "Referrals",
  nop: "NOP",
  anp: "ANP",
};

function pctColor(status: ReturnType<typeof classifyAttainment>): string {
  return status === "on_track" ? "text-brand-green" : status === "needs_attention" ? "text-brand-amber" : "text-brand-red";
}

export default function MyProgress() {
  const { currentAgent } = useStore();
  const [range, setRange] = useState<"month" | "ytd">("month");

  const rows = monthlyActivityRows(currentAgent);
  const lastRow = rows[rows.length - 1];

  const current =
    range === "month"
      ? {
          newContacts: lastRow.actual.newContacts,
          factFindings: lastRow.actual.factFindings,
          closingMeetings: lastRow.actual.closingMeetings,
          policies: lastRow.actual.policies,
          referrals: lastRow.actual.referrals,
          nop: lastRow.nop.actual,
          anp: lastRow.anp.actual,
        }
      : {
          newContacts: rows.reduce((s, r) => s + r.actual.newContacts, 0),
          factFindings: rows.reduce((s, r) => s + r.actual.factFindings, 0),
          closingMeetings: rows.reduce((s, r) => s + r.actual.closingMeetings, 0),
          policies: rows.reduce((s, r) => s + r.actual.policies, 0),
          referrals: rows.reduce((s, r) => s + r.actual.referrals, 0),
          nop: rows.reduce((s, r) => s + r.nop.actual, 0),
          anp: rows.reduce((s, r) => s + r.anp.actual, 0),
        };
  const target =
    range === "month"
      ? {
          newContacts: lastRow.target.newContacts,
          factFindings: lastRow.target.factFindings,
          closingMeetings: lastRow.target.closingMeetings,
          policies: lastRow.target.policies,
          referrals: lastRow.target.referrals,
          nop: lastRow.nop.target,
          anp: lastRow.anp.target,
        }
      : {
          newContacts: rows.reduce((s, r) => s + r.target.newContacts, 0),
          factFindings: rows.reduce((s, r) => s + r.target.factFindings, 0),
          closingMeetings: rows.reduce((s, r) => s + r.target.closingMeetings, 0),
          policies: rows.reduce((s, r) => s + r.target.policies, 0),
          referrals: rows.reduce((s, r) => s + r.target.referrals, 0),
          nop: rows.reduce((s, r) => s + r.nop.target, 0),
          anp: rows.reduce((s, r) => s + r.anp.target, 0),
        };

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl">My Progress</h2>
          <p className="text-[0.78rem] text-ink-secondary">Your activity performance against targets</p>
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

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {METRICS.map((k) => {
          const pct = target[k] > 0 ? Math.round((current[k] / target[k]) * 100) : 100;
          const status = classifyAttainment(current[k], target[k]);
          return (
            <div key={k} className="rounded-app border border-line bg-card p-3 shadow-app transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="text-[0.6rem] font-bold uppercase tracking-wider text-ink-secondary">{METRIC_LABEL[k]}</div>
              <div className={`text-xl font-extrabold ${pctColor(status)}`}>{k === "anp" ? fmt(current[k]) : current[k]}</div>
              <div className="text-[0.65rem] font-semibold text-ink-secondary">{pct}%</div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 overflow-x-auto rounded-app border border-line bg-card shadow-app">
        <div className="flex items-center gap-2 border-b border-line px-4 py-3">
          <span aria-hidden="true">▤</span>
          <h3 className="font-display text-[0.9rem]">{range === "month" ? "Activity Breakdown" : "Monthly Breakdown"}</h3>
          <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-[0.65rem] font-bold text-brand-green">Approved plan targets</span>
        </div>
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="text-[0.6rem] uppercase tracking-wider text-ink-secondary">
              <th className="px-4 py-2">{range === "month" ? "Metric" : "Month"}</th>
              {range === "month"
                ? null
                : METRICS.map((k) => (
                    <th key={k} className="px-2 py-2 text-right">
                      {METRIC_LABEL[k]}
                      <div className="mt-0.5 flex justify-end gap-2 text-[0.55rem] normal-case text-ink-secondary/70">
                        <span>Actual</span>
                        <span>Target</span>
                      </div>
                    </th>
                  ))}
              {range === "month" && (
                <>
                  <th className="px-2 py-2 text-right">Actual</th>
                  <th className="px-2 py-2 text-right">Target</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {range === "month"
              ? METRICS.map((k) => (
                  <tr key={k} className="border-t border-line transition-colors hover:bg-app-bg/60">
                    <td className="px-4 py-2 font-semibold text-ink">{METRIC_LABEL[k]}</td>
                    <td className={`px-2 py-2 text-right font-bold ${pctColor(classifyAttainment(current[k], target[k]))}`}>
                      {k === "anp" ? fmt(current[k]) : current[k]}
                    </td>
                    <td className="px-2 py-2 text-right text-ink-secondary">{k === "anp" ? fmt(target[k]) : target[k]}</td>
                  </tr>
                ))
              : rows.map((r) => (
                  <tr key={r.month} className="border-t border-line transition-colors hover:bg-app-bg/60">
                    <td className="px-4 py-2 font-semibold text-ink">{r.month}</td>
                    {METRICS.map((k) => {
                      const actual = k === "nop" ? r.nop.actual : k === "anp" ? r.anp.actual : r.actual[k];
                      const tgt = k === "nop" ? r.nop.target : k === "anp" ? r.anp.target : r.target[k];
                      return (
                        <td key={k} className="px-2 py-2 text-right">
                          <span className={`font-bold ${pctColor(classifyAttainment(actual, tgt))}`}>{k === "anp" ? fmt(actual) : actual}</span>
                          <span className="text-ink-secondary"> / {k === "anp" ? fmt(tgt) : tgt}</span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
            {range === "ytd" && (
              <tr className="border-t-2 border-line font-bold text-ink">
                <td className="px-4 py-2">YTD Total</td>
                {METRICS.map((k) => (
                  <td key={k} className="px-2 py-2 text-right">
                    {k === "anp" ? fmt(current[k]) : current[k]} / {k === "anp" ? fmt(target[k]) : target[k]}
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
