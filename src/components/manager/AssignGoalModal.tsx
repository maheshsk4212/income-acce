import { useState } from "react";
import { useStore } from "../../store/StoreContext";
import { fmt } from "../../lib/format";
import type { TeamMember } from "../../types";

const GROWTH_CHIPS = [10, 20, 30, 40, 50];

export default function AssignGoalModal({ agent, onClose }: { agent: TeamMember; onClose: () => void }) {
  const { assignGoal } = useStore();
  const baseline = agent.plan?.goalIncome ?? agent.targetIncome;
  const [goalIncome, setGoalIncome] = useState(baseline);

  function handleAssign() {
    assignGoal(agent.id, goalIncome);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 transition-opacity" onClick={onClose}>
      <div className="animate-pop-in w-full max-w-md rounded-app border border-line bg-card shadow-app p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-[1rem]">Assign a goal — {agent.name}</h3>
        <p className="mt-1 text-[0.78rem] text-ink-secondary">
          {agent.grade} · {agent.agency} · current target {fmt(agent.targetIncome)}/yr
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {GROWTH_CHIPS.map((p) => {
            const val = Math.round(agent.targetIncome * (1 + p / 100));
            return (
              <button
                key={p}
                onClick={() => setGoalIncome(val)}
                className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 ${
                  goalIncome === val ? "border-brand-blue bg-blue-50 text-brand-blue-dark" : "border-line text-ink-secondary hover:border-brand-blue"
                }`}
              >
                +{p}%
              </button>
            );
          })}
        </div>

        <label className="mt-3 block text-xs font-semibold text-ink-secondary">Annual income goal ($)</label>
        <input
          type="number"
          value={goalIncome}
          onChange={(e) => setGoalIncome(Number(e.target.value) || 0)}
          className="mt-1 w-full rounded-lg border border-line px-3 py-2 transition focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
        />

        <p className="mt-3 text-[0.72rem] text-ink-secondary">
          {agent.name} will see this as a goal assigned by their manager, and can review or adjust the activity plan before
          accepting it.
        </p>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-line px-3.5 py-2 text-xs font-bold text-ink-secondary transition hover:border-brand-blue active:scale-[0.97]"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            className="rounded-lg bg-brand-blue px-3.5 py-2 text-xs font-bold text-white transition hover:bg-brand-blue-dark hover:shadow-md active:scale-[0.97]"
          >
            Assign goal
          </button>
        </div>
      </div>
    </div>
  );
}
