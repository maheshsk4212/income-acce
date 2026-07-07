export interface FunnelStage {
  label: string;
  value: number;
}

const COLORS = ["#0C4F92", "#1366B8", "#3B82C4", "#6BA3D6"];

/**
 * A true narrowing funnel (not just ratio tiles): each stage renders as a
 * trapezoid sized relative to the top stage, with a 28%-floor on width so
 * the smallest stage (Policies) never visually disappears. Widths are
 * therefore illustrative, not to mathematical scale — the point is the
 * shape reads as "funnel" at a glance.
 */
export default function FunnelChart({ stages }: { stages: FunnelStage[] }) {
  const top = stages[0]?.value || 1;
  const widthPct = (v: number) => 28 + 72 * Math.min(1, v / top);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center">
      {stages.map((s, i) => {
        const wTop = widthPct(s.value);
        const wBottom = i < stages.length - 1 ? widthPct(stages[i + 1].value) : wTop;
        const topLeft = (100 - wTop) / 2;
        const bottomLeft = (100 - wBottom) / 2;
        const conversion = i > 0 && stages[i - 1].value > 0 ? Math.round((s.value / stages[i - 1].value) * 100) : null;

        return (
          <div key={s.label} className="w-full">
            {conversion !== null && (
              <div className="flex items-center justify-center gap-1 py-1 text-[0.68rem] font-bold text-ink-secondary">
                <span aria-hidden="true">↓</span> {conversion}% converted
              </div>
            )}
            <div
              className="mx-auto flex h-14 items-center justify-center text-center transition-all duration-500"
              style={{
                width: "100%",
                clipPath: `polygon(${topLeft}% 0, ${100 - topLeft}% 0, ${100 - bottomLeft}% 100%, ${bottomLeft}% 100%)`,
                background: COLORS[i % COLORS.length],
              }}
            >
              <div className="text-white">
                <div className="text-lg font-extrabold leading-none">{s.value.toLocaleString()}</div>
                <div className="text-[0.62rem] font-semibold uppercase tracking-wide opacity-90">{s.label}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
