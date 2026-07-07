import { fmt } from "../../lib/format";
import { activityForPolicies, conversionRates, COMMISSION_COMPONENTS, type MonthRow } from "../../lib/calc";

/** The three historical reference tables shown both in the agent's Goal
 *  Setup Step 1 and on their Dashboard: production/income by product,
 *  income by commission type, and activity vs. target with conversion
 *  ratios — all scoped to the actual (non-projected) months. */
export default function HistoricalTables({ actualMonths, policiesPerMonth }: { actualMonths: MonthRow[]; policiesPerMonth: number }) {
  const conversion = conversionRates();

  return (
    <div>
      <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-secondary">
        <span aria-hidden="true">▤</span> Production &amp; Income Breakdown
      </h4>
      <div className="mt-2 overflow-x-auto rounded-lg bg-app-bg">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead>
            <tr className="text-[0.6rem] uppercase tracking-wider text-ink-secondary">
              <th className="px-3 py-2">Month</th>
              <th className="px-2 py-2 text-right">A&amp;H (#)</th>
              <th className="px-2 py-2 text-right">A&amp;H ($)</th>
              <th className="px-2 py-2 text-right">Term (#)</th>
              <th className="px-2 py-2 text-right">Term ($)</th>
              <th className="px-2 py-2 text-right">VUL (#)</th>
              <th className="px-2 py-2 text-right">VUL ($)</th>
              <th className="px-2 py-2 text-right">Total ($)</th>
              <th className="px-2 py-2 text-right">FYC</th>
              <th className="px-3 py-2 text-right">Income</th>
            </tr>
          </thead>
          <tbody>
            {actualMonths.map((r) => (
              <tr key={r.month} className="border-t border-line">
                <td className="px-3 py-1.5 font-semibold text-ink">{r.month}</td>
                <td className="px-2 py-1.5 text-right">{r.ahCount}</td>
                <td className="px-2 py-1.5 text-right">{fmt(r.ahPremium)}</td>
                <td className="px-2 py-1.5 text-right">{r.termCount}</td>
                <td className="px-2 py-1.5 text-right">{fmt(r.termPremium)}</td>
                <td className="px-2 py-1.5 text-right">{r.lifeCount}</td>
                <td className="px-2 py-1.5 text-right">{fmt(r.lifePremium)}</td>
                <td className="px-2 py-1.5 text-right font-semibold">{fmt(r.totalPremium)}</td>
                <td className="px-2 py-1.5 text-right">{fmt(r.fyc)}</td>
                <td className="px-3 py-1.5 text-right font-semibold text-brand-blue-dark">{fmt(r.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h4 className="mt-5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-secondary">
        <span aria-hidden="true">▤</span> Income Breakdown
      </h4>
      <div className="mt-2 overflow-x-auto rounded-lg bg-app-bg">
        <table className="w-full min-w-[560px] text-left text-xs">
          <thead>
            <tr className="text-[0.6rem] uppercase tracking-wider text-ink-secondary">
              <th className="px-3 py-2">Income type</th>
              {actualMonths.map((r) => (
                <th key={r.month} className="px-2 py-2 text-right">
                  {r.month}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMMISSION_COMPONENTS.map((c) => (
              <tr key={c.key} className="border-t border-line">
                <td className="px-3 py-1.5 text-ink">{c.label}</td>
                {actualMonths.map((r) => (
                  <td key={r.month} className="px-2 py-1.5 text-right text-ink-secondary">
                    {r[c.key] > 0 ? fmt(r[c.key]) : "—"}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="border-t border-line font-bold text-brand-blue-dark">
              <td className="px-3 py-1.5">Total Earned</td>
              {actualMonths.map((r) => (
                <td key={r.month} className="px-2 py-1.5 text-right">
                  {fmt(r.total)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <h4 className="mt-5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-secondary">
        <span aria-hidden="true">📈</span> Historical Performance
      </h4>
      <div className="mt-2 overflow-x-auto rounded-lg bg-app-bg">
        <table className="w-full min-w-[720px] text-left text-xs">
          <thead>
            <tr className="text-[0.6rem] uppercase tracking-wider text-ink-secondary">
              <th className="px-3 py-2">Month</th>
              <th className="px-2 py-2 text-right">New Contacts</th>
              <th className="px-2 py-2 text-right">Fact Findings</th>
              <th className="px-2 py-2 text-right">Closing Meetings</th>
              <th className="px-2 py-2 text-right">Policies</th>
              <th className="px-2 py-2 text-right">Referrals</th>
              <th className="px-2 py-2 text-right">R1</th>
              <th className="px-2 py-2 text-right">R2</th>
              <th className="px-2 py-2 text-right">R3</th>
              <th className="px-3 py-2 text-right">R4</th>
            </tr>
          </thead>
          <tbody>
            {actualMonths.map((r) => {
              const act = activityForPolicies(r.policies);
              const tgt = activityForPolicies(policiesPerMonth);
              return (
                <tr key={r.month} className="border-t border-line">
                  <td className="px-3 py-1.5 font-semibold text-ink">{r.month}</td>
                  <td className="px-2 py-1.5 text-right">
                    {act.newContacts}/{tgt.newContacts}
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    {act.factFindings}/{tgt.factFindings}
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    {act.closingMeetings}/{tgt.closingMeetings}
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    {act.policies}/{tgt.policies}
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    {act.referrals}/{tgt.referrals}
                  </td>
                  <td className="px-2 py-1.5 text-right text-brand-blue-dark">{conversion.contactsToFactFindings}</td>
                  <td className="px-2 py-1.5 text-right text-brand-blue-dark">{conversion.factFindingsToClosingMeetings}</td>
                  <td className="px-2 py-1.5 text-right text-brand-blue-dark">{conversion.closingMeetingsToPolicies}</td>
                  <td className="px-3 py-1.5 text-right text-brand-blue-dark">{conversion.referralsPerPolicy}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
