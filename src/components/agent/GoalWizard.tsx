import { useEffect, useRef, useState } from "react";
import { useStore } from "../../store/StoreContext";
import { fmt } from "../../lib/format";
import {
  activityPlan,
  CURRENT_MONTH_INDEX,
  COMMISSION_COMPONENTS,
  conversionRates,
  DEFAULT_PREMIUM_RATES,
  MONTHS,
  monthlySeries,
  pctOfGoal,
  policyBenchmark,
  projectedAnnualPremium,
  projectedIncome,
  rebalanceMix,
  totalPoliciesThisYear,
  yearlySeries,
  type CommissionKey,
} from "../../lib/calc";
import type { PremiumRates, ProductMix } from "../../types";
import CommissionChart, { commissionBreakdownList, type ChartRow } from "./CommissionChart";
import SuccessModal from "../shared/SuccessModal";
import HistoricalTables from "../shared/HistoricalTables";
import FunnelChart from "../shared/FunnelChart";

const GROWTH_CHIPS = [10, 20, 30, 40, 50];
const DEFAULT_MIX: ProductMix = { ah: 25, term: 40, life: 35 };
const STEP_LABELS = ["Planning period", "Monthly targets", "Activity plan", "Plan summary"];

type Period = "yearly" | "monthly";

function emptyCommission(): Record<CommissionKey, number> {
  return { fyc: 0, lifeMepb: 0, ahQuarterly: 0, ahMonthly: 0, acp: 0, renewal: 0 };
}

export default function GoalWizard({ onDone }: { onDone: () => void }) {
  const { currentAgent, submitPlan, clearToast } = useStore();
  const { plan } = currentAgent;

  const [step, setStep] = useState(1);
  const [period, setPeriod] = useState<Period>("yearly");
  const [goalIncome, setGoalIncome] = useState(plan?.goalIncome ?? currentAgent.targetIncome);
  const [policiesPerMonth, setPoliciesPerMonth] = useState(plan?.policiesPerMonth ?? 8);
  const [mix, setMix] = useState<ProductMix>(plan?.productMix ?? DEFAULT_MIX);
  const [avgPremium, setAvgPremium] = useState<PremiumRates>(plan?.avgPremium ?? DEFAULT_PREMIUM_RATES);
  const [showGuardrail, setShowGuardrail] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // If a manager assigns a goal in the background while this agent has no
  // plan yet and is mid-wizard, surface it — but never while we're mid- or
  // just-submitted ourselves (that's handled by the success modal below).
  const prevPlanRef = useRef(plan);
  useEffect(() => {
    const prev = prevPlanRef.current;
    prevPlanRef.current = plan;
    if (!submitted && prev === null && plan && plan.source === "manager_assigned") {
      onDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, submitted]);

  const [projTab, setProjTab] = useState<"current" | "projection" | "table">("projection");
  const [yearScope, setYearScope] = useState<"current" | "all">("current");
  const [tableYearIdx, setTableYearIdx] = useState(0);
  const [showActivityDetail, setShowActivityDetail] = useState(false);
  const [showHistorical, setShowHistorical] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const monthly = monthlySeries(policiesPerMonth, mix, avgPremium);
  const yearly = yearlySeries(policiesPerMonth, mix, avgPremium);
  const currentMonthRow = monthly[CURRENT_MONTH_INDEX];
  const totalPolicies = totalPoliciesThisYear(policiesPerMonth);

  const anp = projectedAnnualPremium(policiesPerMonth, mix, avgPremium);
  const annualIncome = yearly[0].total;
  const pct = pctOfGoal(currentMonthRow.fyc, goalIncome / 12);
  const activity = activityPlan(policiesPerMonth);
  const conversion = conversionRates();

  const benchmarkPolicies = policyBenchmark(currentAgent.grade);
  const benchAnp = projectedAnnualPremium(benchmarkPolicies, DEFAULT_MIX);
  const benchIncome = projectedIncome(benchmarkPolicies, DEFAULT_MIX);

  function handleMixChange(key: keyof ProductMix, value: number) {
    setMix((m) => rebalanceMix(m, key, value));
  }

  function handleSubmit() {
    submitPlan(currentAgent.id, { goalIncome, policiesPerMonth, productMix: mix, avgPremium });
    setSubmitted(true);
    // the success modal below covers this moment; skip the redundant toast
    clearToast();
  }

  function handleSubmitClick() {
    if (annualIncome < goalIncome) setShowGuardrail(true);
    else handleSubmit();
  }

  const chipBase = period === "yearly" ? currentAgent.targetIncome : currentAgent.targetIncome / 12;
  const goalForPeriod = period === "yearly" ? goalIncome : goalIncome / 12;

  const actualMonths = monthly.filter((r) => r.isActual);

  const ytdAvg = (key: "ahCount" | "termCount" | "lifeCount") =>
    Math.round((actualMonths.reduce((s, r) => s + r[key], 0) / actualMonths.length) * 10) / 10;

  const monthlyChartRows: ChartRow[] = monthly.map((r) => ({
    label: r.month,
    isActual: r.isActual,
    values: { fyc: r.fyc, lifeMepb: r.lifeMepb, ahQuarterly: r.ahQuarterly, ahMonthly: r.ahMonthly, acp: r.acp, renewal: r.renewal },
  }));
  const yearlyChartRows: ChartRow[] = yearly.map((y) => ({
    label: y.label,
    values: { fyc: y.fyc, lifeMepb: y.lifeMepb, ahQuarterly: y.ahQuarterly, ahMonthly: y.ahMonthly, acp: y.acp, renewal: y.renewal },
  }));

  const allYearsTotals = yearly.reduce((acc, y) => {
    (Object.keys(acc) as CommissionKey[]).forEach((k) => (acc[k] += y[k]));
    return acc;
  }, emptyCommission());

  return (
    <div className="mx-auto max-w-5xl">
      <div className="text-center">
        <h2 className="font-display text-xl text-ink">Design Your Success Plan</h2>
        <p className="mt-1 text-sm text-ink-secondary">Let's reverse-engineer your income goals into daily activities.</p>
      </div>

      <div className="mx-auto mt-6 flex max-w-md items-center justify-between">
        {STEP_LABELS.map((label, i) => {
          const n = i + 1;
          const state = n === step ? "current" : n < step ? "done" : "upcoming";
          return (
            <div key={label} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ${
                    state === "current"
                      ? "scale-110 bg-brand-blue text-white shadow-[0_0_0_4px_rgba(19,102,184,0.15)]"
                      : state === "done"
                      ? "border-2 border-brand-blue text-brand-blue"
                      : "bg-app-bg text-ink-secondary"
                  }`}
                >
                  <span className={state === "done" ? "animate-pop-in inline-block" : "inline-block"}>{state === "done" ? "✓" : n}</span>
                </div>
              </div>
              {n < STEP_LABELS.length && (
                <div className="mx-2 h-0.5 flex-1 overflow-hidden rounded-full bg-line">
                  <div className={`h-full bg-brand-blue transition-transform duration-500 ease-out ${n < step ? "translate-x-0" : "-translate-x-full"}`} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {step === 2 && (
        <div className="mx-auto mt-6 grid grid-cols-1 gap-3 rounded-app border border-line bg-card p-4 shadow-app sm:grid-cols-3">
          <div>
            <div className="text-[0.6rem] font-bold uppercase tracking-wider text-ink-secondary">Projected monthly FY commission</div>
            <div className="text-xl font-extrabold text-ink">{fmt(currentMonthRow.fyc)}</div>
          </div>
          <div>
            <div className="text-[0.6rem] font-bold uppercase tracking-wider text-ink-secondary">Progress to monthly target</div>
            <div className="text-sm font-semibold text-ink">{pct}% of {fmt(goalIncome / 12)}</div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-app-bg">
              <div
                className={`h-full rounded-full transition-[width] duration-500 ease-out ${pct >= 100 ? "bg-brand-green" : "bg-brand-blue"}`}
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </div>
          </div>
          <div className="text-right sm:text-right">
            <div className="text-[0.6rem] font-bold uppercase tracking-wider text-ink-secondary">Remaining to goal</div>
            <div className={`text-xl font-extrabold transition-colors ${goalIncome / 12 - currentMonthRow.fyc > 0 ? "text-brand-red" : "text-brand-green"}`}>
              {fmt(Math.max(0, goalIncome / 12 - currentMonthRow.fyc))}
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 rounded-app border border-line bg-card shadow-app p-6">
        {step === 1 && (
          <div key="step1" className="animate-fade-in-up">
            <h3 className="text-center font-display text-[1rem]">Step 1: Select your planning period</h3>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {(
                [
                  ["yearly", "Yearly Goal", "Full year tracking"],
                  ["monthly", "Monthly Goal", "30-day sprint"],
                ] as [Period, string, string][]
              ).map(([p, title, sub]) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`rounded-app border-2 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99] ${
                    period === p ? "border-brand-blue bg-blue-50" : "border-line hover:border-brand-blue/50"
                  }`}
                >
                  <div className="font-bold text-ink">{title}</div>
                  <div className="text-xs text-ink-secondary">{sub}</div>
                  <div className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-3 text-center">
                    <MiniStat label="Policies/mo" value={String(benchmarkPolicies)} />
                    <MiniStat label={p === "yearly" ? "Premium" : "Premium/mo"} value={fmt(p === "yearly" ? benchAnp : benchAnp / 12)} />
                    <MiniStat label={p === "yearly" ? "FY Commission" : "Commission/mo"} value={fmt(p === "yearly" ? benchIncome : benchIncome / 12)} />
                  </div>
                </button>
              ))}
            </div>

            <p className="mt-6 text-center text-sm font-semibold text-ink">What is your {period} income goal?</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {GROWTH_CHIPS.map((p) => {
                const val = Math.round(chipBase * (1 + p / 100));
                const selected = Math.round(goalForPeriod) === val;
                return (
                  <button
                    key={p}
                    onClick={() => setGoalIncome(period === "yearly" ? val : val * 12)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 ${
                      selected ? "border-brand-blue bg-blue-50 text-brand-blue-dark" : "border-line text-ink-secondary hover:border-brand-blue"
                    }`}
                  >
                    {fmt(val)} <span className="text-brand-green">↑{p}%</span>
                  </button>
                );
              })}
            </div>
            <div className="mx-auto mt-3 flex max-w-xs items-center gap-2">
              <span className="text-xs font-semibold text-ink-secondary">Or custom</span>
              <input
                type="number"
                value={Math.round(goalForPeriod)}
                onChange={(e) => {
                  const v = Number(e.target.value) || 0;
                  setGoalIncome(period === "yearly" ? v : v * 12);
                }}
                className="w-full rounded-lg border border-line px-3 py-1.5 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
              />
            </div>

            <button
              onClick={() => setShowHistorical((v) => !v)}
              className="mx-auto mt-8 block text-xs font-bold text-brand-blue transition hover:text-brand-blue-dark"
            >
              {showHistorical ? "Hide" : "Show"} my historical performance {showHistorical ? "▲" : "▼"}
            </button>
            {showHistorical && (
              <div className="animate-fade-in-up mt-3">
                <HistoricalTables actualMonths={actualMonths} policiesPerMonth={policiesPerMonth} />
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div key="step2" className="animate-fade-in-up">
            <h3 className="text-center font-display text-[1rem]">Step 2: Monthly targets</h3>
            <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-ink-secondary">Policies per month: {policiesPerMonth}</label>
                <input
                  type="range"
                  min={1}
                  max={30}
                  value={policiesPerMonth}
                  onChange={(e) => setPoliciesPerMonth(Number(e.target.value))}
                  className="w-full accent-brand-blue"
                />

                <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-app-bg p-2 text-center">
                  <div className="text-[0.6rem] font-bold uppercase tracking-wider text-ink-secondary">
                    YTD averages/mo
                    <div className="mt-1 text-sm font-extrabold text-ink">{ytdAvg("ahCount")}</div>
                    <div className="text-[0.58rem] font-normal normal-case">A&amp;H</div>
                  </div>
                  <div className="text-[0.6rem] font-bold uppercase tracking-wider text-ink-secondary">
                    &nbsp;
                    <div className="mt-1 text-sm font-extrabold text-ink">{ytdAvg("termCount")}</div>
                    <div className="text-[0.58rem] font-normal normal-case">Term</div>
                  </div>
                  <div className="text-[0.6rem] font-bold uppercase tracking-wider text-ink-secondary">
                    &nbsp;
                    <div className="mt-1 text-sm font-extrabold text-ink">{ytdAvg("lifeCount")}</div>
                    <div className="text-[0.58rem] font-normal normal-case">Life (VUL)</div>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="text-xs font-semibold text-ink-secondary">Policy mix split (%) — must total 100%</div>
                  {(
                    [
                      ["ah", "A&H"],
                      ["term", "Term"],
                      ["life", "Life"],
                    ] as [keyof ProductMix, string][]
                  ).map(([key, label]) => (
                    <div key={key}>
                      <div className="flex justify-between text-xs font-semibold text-ink-secondary">
                        <span>{label}</span>
                        <span className="text-ink">{mix[key]}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={mix[key]}
                        onChange={(e) => handleMixChange(key, Number(e.target.value))}
                        className="w-full accent-brand-blue"
                      />
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setShowAdvanced((v) => !v)}
                  className="mt-4 text-xs font-bold text-brand-blue transition hover:text-brand-blue-dark"
                >
                  {showAdvanced ? "Hide" : "Show"} advanced: premiums &amp; policy breakdown {showAdvanced ? "▲" : "▼"}
                </button>

                {showAdvanced && (
                  <div className="animate-fade-in-up">
                    <div className="mt-4">
                      <div className="text-xs font-semibold text-ink-secondary">Avg premium per category ($)</div>
                      <div className="mt-1.5 grid grid-cols-3 gap-2">
                        {(
                          [
                            ["ah", "A&H"],
                            ["term", "Term"],
                            ["life", "Life"],
                          ] as [keyof PremiumRates, string][]
                        ).map(([key, label]) => (
                          <div key={key}>
                            <label className="block text-[0.62rem] text-ink-secondary">{label}</label>
                            <input
                              type="number"
                              value={avgPremium[key]}
                              onChange={(e) => setAvgPremium((p) => ({ ...p, [key]: Number(e.target.value) || 0 }))}
                              className="w-full rounded-lg border border-line px-2 py-1 text-sm focus:border-brand-blue focus:outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="text-xs font-semibold text-ink-secondary">Policy breakdown</div>
                      <table className="mt-1.5 w-full text-left text-xs">
                        <thead>
                          <tr className="text-[0.6rem] uppercase tracking-wider text-ink-secondary">
                            <th className="py-1">Category</th>
                            <th className="py-1 text-right">Policies</th>
                            <th className="py-1 text-right">Avg premium</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(
                            [
                              ["ah", "A&H"],
                              ["term", "Term"],
                              ["life", "Life"],
                            ] as [keyof ProductMix, string][]
                          ).map(([key, label]) => (
                            <tr key={key} className="border-t border-line">
                              <td className="py-1">{label}</td>
                              <td className="py-1 text-right">{(Math.round((policiesPerMonth * mix[key]) / 10) / 10).toFixed(1)}</td>
                              <td className="py-1 text-right">{fmt(avgPremium[key])}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-display text-[0.9rem]">Income Projection</h4>
                <div className="mt-2 flex gap-1 rounded-full border border-line bg-app-bg p-1 text-[0.68rem] font-bold">
                  {(["current", "projection", "table"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setProjTab(t)}
                      className={`flex-1 rounded-full py-1 transition-all duration-200 active:scale-95 ${
                        projTab === t ? "bg-brand-blue text-white shadow-sm" : "text-ink-secondary hover:text-ink"
                      }`}
                    >
                      {t === "current" ? "Current View" : t === "projection" ? "Projection" : "Table View"}
                    </button>
                  ))}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <MiniCard label="Total policies" value={`${totalPolicies.actual} actual + (${policiesPerMonth} × ${12 - CURRENT_MONTH_INDEX} mo)`} />
                  <MiniCard label="Average policy / month" value={String(policiesPerMonth)} />
                  <MiniCard label="Estimated current year income" value={fmt(annualIncome)} />
                  <MiniCard label={`Estimated income for ${MONTHS[CURRENT_MONTH_INDEX]}`} value={fmt(currentMonthRow.total)} />
                </div>

                {projTab === "current" && (
                  <>
                    <div className="mt-4">
                      <CommissionChart rows={monthlyChartRows} showActualDivider />
                    </div>
                    <BreakdownList title={`Commission for ${MONTHS[CURRENT_MONTH_INDEX]}`} values={currentMonthRow} />
                  </>
                )}

                {projTab === "projection" && (
                  <>
                    <div className="mt-3 flex gap-1 rounded-full border border-line p-1 text-[0.68rem] font-bold w-fit">
                      {(["current", "all"] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => setYearScope(s)}
                          className={`rounded-full px-3 py-1 transition-all duration-200 active:scale-95 ${
                            yearScope === s ? "bg-brand-blue text-white shadow-sm" : "text-ink-secondary hover:text-ink"
                          }`}
                        >
                          {s === "current" ? "Current Year" : "All Years"}
                        </button>
                      ))}
                    </div>
                    <div className="mt-3">
                      <CommissionChart rows={yearScope === "current" ? monthlyChartRows : yearlyChartRows} showActualDivider={yearScope === "current"} />
                    </div>
                    {yearScope === "current" ? (
                      <BreakdownList title={`Commission for ${MONTHS[CURRENT_MONTH_INDEX]}`} values={currentMonthRow} />
                    ) : (
                      <BreakdownList title="Total commission for all years" values={allYearsTotals} denom="year" />
                    )}
                  </>
                )}

                {projTab === "table" && (
                  <>
                    <div className="mt-3 flex flex-wrap gap-1 rounded-full border border-line p-1 text-[0.66rem] font-bold w-fit">
                      {yearly.map((y, i) => (
                        <button
                          key={y.label}
                          onClick={() => setTableYearIdx(i)}
                          className={`rounded-full px-2.5 py-1 transition-all duration-200 active:scale-95 ${
                            tableYearIdx === i ? "bg-brand-blue text-white shadow-sm" : "text-ink-secondary hover:text-ink"
                          }`}
                        >
                          {i === 0 ? "Current Year" : y.label}
                        </button>
                      ))}
                    </div>
                    {tableYearIdx === 0 ? (
                      <div className="mt-3 overflow-x-auto">
                        <table className="w-full min-w-[520px] text-left text-xs">
                          <thead>
                            <tr className="text-[0.6rem] uppercase tracking-wider text-ink-secondary">
                              <th className="py-1.5">Component</th>
                              {MONTHS.map((m) => (
                                <th key={m} className="py-1.5 text-right">
                                  {m}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {COMMISSION_COMPONENTS.map((c) => (
                              <tr key={c.key} className="border-t border-line">
                                <td className="py-1.5">
                                  <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full" style={{ background: c.color }} />
                                  {c.label}
                                </td>
                                {monthly.map((r) => (
                                  <td key={r.month} className={`py-1.5 text-right ${r.month === MONTHS[CURRENT_MONTH_INDEX] ? "font-bold text-brand-blue-dark" : "text-ink-secondary"}`}>
                                    {r[c.key] > 0 ? fmt(r[c.key]) : "—"}
                                  </td>
                                ))}
                              </tr>
                            ))}
                            <tr className="border-t border-line font-bold text-ink">
                              <td className="py-1.5">Total</td>
                              {monthly.map((r) => (
                                <td key={r.month} className="py-1.5 text-right">
                                  {fmt(r.total)}
                                </td>
                              ))}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <table className="mt-3 w-full text-left text-xs">
                        <thead>
                          <tr className="text-[0.6rem] uppercase tracking-wider text-ink-secondary">
                            <th className="py-1.5">Component</th>
                            <th className="py-1.5 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {COMMISSION_COMPONENTS.map((c) => (
                            <tr key={c.key} className="border-t border-line">
                              <td className="py-1.5">
                                <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full" style={{ background: c.color }} />
                                {c.label}
                              </td>
                              <td className="py-1.5 text-right">{fmt(yearly[tableYearIdx][c.key])}</td>
                            </tr>
                          ))}
                          <tr className="border-t border-line font-bold text-ink">
                            <td className="py-1.5">Total</td>
                            <td className="py-1.5 text-right">{fmt(yearly[tableYearIdx].total)}</td>
                          </tr>
                        </tbody>
                      </table>
                    )}
                  </>
                )}

                <div className="mt-4 rounded-lg bg-app-bg p-3 text-[0.74rem] text-ink-secondary">
                  At {policiesPerMonth} policies/month with this product mix, you're projected to reach <b className="text-ink">{fmt(annualIncome)}</b> against
                  a goal of <b className="text-ink">{fmt(goalIncome)}</b> ({pctOfGoal(annualIncome, goalIncome)}%). Annualized premium: {fmt(anp)}.
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div key="step3" className="animate-fade-in-up">
            <h3 className="text-center font-display text-[1rem]">Step 3: Review your activity plan</h3>
            <p className="mt-1 text-center text-[0.8rem] text-ink-secondary">How your {policiesPerMonth} policies/month get there.</p>

            <div className="mt-6">
              <FunnelChart
                stages={[
                  { label: "New Contacts", value: activity[0].perMonth },
                  { label: "Fact Findings", value: activity[1].perMonth },
                  { label: "Closing Meetings", value: activity[2].perMonth },
                  { label: "Policies", value: activity[3].perMonth },
                ]}
              />
              <div className="mx-auto mt-3 flex max-w-md items-center justify-center gap-2 rounded-lg bg-app-bg px-3 py-2 text-center text-[0.78rem] text-ink-secondary">
                <span aria-hidden="true">↻</span> Plus <b className="text-ink">{activity[4].perMonth}</b> referrals/month ({conversion.referralsPerPolicy}
                :1 per policy)
              </div>
            </div>

            <button
              onClick={() => setShowActivityDetail((v) => !v)}
              className="mx-auto mt-5 block text-xs font-bold text-brand-blue transition hover:text-brand-blue-dark"
            >
              {showActivityDetail ? "Hide" : "Show"} weekly &amp; yearly breakdown {showActivityDetail ? "▲" : "▼"}
            </button>

            {showActivityDetail && (
              <table className="animate-fade-in-up mt-3 w-full text-left text-sm">
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
                    <tr key={row.name} className="border-b border-line last:border-none">
                      <td className="py-2 font-semibold text-ink">{row.name}</td>
                      <td className="py-2 text-right text-brand-blue-dark font-semibold">{row.perWeek}</td>
                      <td className="py-2 text-right text-ink">{row.perMonth}</td>
                      <td className="py-2 text-right text-ink-secondary">{row.perYear.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {step === 4 && (
          <div key="step4" className="animate-fade-in-up">
            <h3 className="text-center font-display text-[1rem]">Step 4: Plan summary</h3>
            <div className="relative mt-4 rounded-app bg-gradient-to-br from-ink to-brand-blue-dark p-5 text-white transition-transform duration-300 hover:scale-[1.01]">
              <button
                onClick={() => setStep(2)}
                className="absolute right-4 top-4 rounded-full border border-white/30 px-2.5 py-1 text-[0.65rem] font-bold text-white transition hover:bg-white/10 active:scale-95"
              >
                ✎ Edit Plan
              </button>
              <div className="text-center text-xs text-white/70">Monthly goal</div>
              <div className="text-center text-2xl font-extrabold">{fmt(goalIncome)}</div>
              <div className="mt-4 border-t border-white/20 pt-4 text-center text-[0.68rem] text-white/70">Total policies</div>
              <div className="text-center text-lg font-extrabold text-white">{policiesPerMonth}</div>
              <p className="text-center text-[0.62rem] text-white/60">All policies across product categories</p>
              <div className="mt-3 text-center text-[0.6rem] uppercase tracking-wider text-white/60">Policy split by product category</div>
              <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <MiniCard dark label="Health & Accident" value={`${Math.round((policiesPerMonth * mix.ah) / 100)} (${mix.ah}%)`} />
                <MiniCard dark label="Term Life" value={`${Math.round((policiesPerMonth * mix.term) / 100)} (${mix.term}%)`} />
                <MiniCard dark label="Universal Life" value={`${Math.round((policiesPerMonth * mix.life) / 100)} (${mix.life}%)`} />
              </div>
            </div>
            <table className="mt-5 w-full text-left text-sm">
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
                  <tr key={row.name} className="border-b border-line last:border-none">
                    <td className="py-2 font-semibold text-ink">{row.name}</td>
                    <td className="py-2 text-right text-brand-blue-dark font-semibold">{row.perWeek}</td>
                    <td className="py-2 text-right text-ink">{row.perMonth}</td>
                    <td className="py-2 text-right text-ink-secondary">{row.perYear.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 flex justify-between gap-2">
          <button
            onClick={() => (step === 1 ? onDone() : setStep((s) => s - 1))}
            className="rounded-lg border border-line px-4 py-2 text-sm font-bold text-ink-secondary transition hover:border-brand-blue active:scale-[0.97]"
          >
            Back
          </button>
          {step < 4 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-blue-dark hover:shadow-md active:scale-[0.97]"
            >
              Next Step →
            </button>
          ) : (
            <button
              onClick={handleSubmitClick}
              className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-blue-dark hover:shadow-md active:scale-[0.97]"
            >
              Request Manager Approval ➤
            </button>
          )}
        </div>
      </div>

      {step === 4 && (
        <button
          onClick={() => setStep(1)}
          className="mt-3 w-full rounded-app border border-line bg-card py-3 text-center text-sm font-bold text-ink-secondary shadow-app transition hover:border-brand-blue hover:text-brand-blue-dark active:scale-[0.99]"
        >
          ✎ Revise My Goal Targets
        </button>
      )}

      {showGuardrail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4" onClick={() => setShowGuardrail(false)}>
          <div
            className="animate-pop-in w-full max-w-sm rounded-app border border-line bg-card shadow-app p-5 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-brand-amber">!</div>
            <h3 className="font-display text-[1rem]">Please review your changes</h3>
            <p className="mt-2 text-sm text-ink-secondary">
              Your current activity plan projects {fmt(annualIncome)}, below your goal of {fmt(goalIncome)}. Would you like to continue
              with the updated target?
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <button
                onClick={() => setShowGuardrail(false)}
                className="rounded-lg border border-line px-3.5 py-2 text-xs font-bold text-ink-secondary transition hover:border-brand-blue active:scale-[0.97]"
              >
                Revise
              </button>
              <button
                onClick={() => {
                  setShowGuardrail(false);
                  handleSubmit();
                }}
                className="rounded-lg bg-brand-blue px-3.5 py-2 text-xs font-bold text-white transition hover:bg-brand-blue-dark active:scale-[0.97]"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {submitted && (
        <SuccessModal
          title="Approval Request Sent!"
          message={`Your ${period === "yearly" ? "Yearly" : "Monthly"} plan has been sent to your manager for approval.`}
          onDone={onDone}
        />
      )}
    </div>
  );
}

function BreakdownList({ title, values, denom = "month" }: { title: string; values: Record<CommissionKey, number>; denom?: "month" | "year" }) {
  const items = commissionBreakdownList(values, denom);
  const total = COMMISSION_COMPONENTS.reduce((s, c) => s + (values[c.key] || 0), 0);
  return (
    <div className="mt-4">
      <div className="text-[0.62rem] font-bold uppercase tracking-wider text-ink-secondary">{title}</div>
      <div className="mt-2 divide-y divide-line">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between py-2">
            <span className="flex items-center gap-2 text-xs font-semibold text-ink">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: item.color }} />
              {item.label}
            </span>
            <span className="text-right text-xs">
              <div className="font-bold text-ink">{item.amount}</div>
              {item.runRate && <div className="text-[0.62rem] text-ink-secondary">{item.runRate} year run-rate</div>}
            </span>
          </div>
        ))}
        {items.length === 0 && <div className="py-2 text-xs text-ink-secondary">No commission components triggered this period.</div>}
        <div className="flex items-center justify-between py-2">
          <span className="text-xs font-bold text-ink">Total</span>
          <span className="text-sm font-bold text-ink">
            {fmt(total)}
            {denom === "month" ? "/mo" : ""}
          </span>
        </div>
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

function MiniCard({ label, value, dark }: { label: string; value: string; dark?: boolean }) {
  return (
    <div className={`rounded-lg px-3 py-2 ${dark ? "bg-white/10" : "bg-app-bg"}`}>
      <div className={`text-[0.58rem] font-bold uppercase tracking-wider ${dark ? "text-white/70" : "text-ink-secondary"}`}>{label}</div>
      <div className={`text-lg font-extrabold ${dark ? "text-white" : "text-ink"}`}>{value}</div>
    </div>
  );
}
