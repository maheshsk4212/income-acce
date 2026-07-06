import { COMMISSION_COMPONENTS, type CommissionKey } from "../../lib/calc";
import { fmt } from "../../lib/format";

export interface ChartRow {
  label: string;
  isActual?: boolean;
  values: Record<CommissionKey, number>;
}

export default function CommissionChart({ rows, showActualDivider = false }: { rows: ChartRow[]; showActualDivider?: boolean }) {
  const width = 720;
  const height = 220;
  const padTop = 16;
  const padBottom = 24;
  const padLeft = 4;
  const chartH = height - padTop - padBottom;

  const totals = rows.map((r) => COMMISSION_COMPONENTS.reduce((s, c) => s + (r.values[c.key] || 0), 0));
  const max = Math.max(1, ...totals);
  const barWidth = Math.min(48, (width - padLeft * 2) / rows.length - 10);
  const step = (width - padLeft * 2) / rows.length;

  const dividerIndex = rows.findIndex((r) => !r.isActual);

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        {showActualDivider && dividerIndex > 0 && (
          <>
            <line
              x1={padLeft + dividerIndex * step - (step - barWidth) / 2}
              x2={padLeft + dividerIndex * step - (step - barWidth) / 2}
              y1={padTop}
              y2={padTop + chartH}
              stroke="var(--color-line-strong, #C3CFCC)"
              strokeDasharray="3 3"
            />
            <text x={padLeft + (dividerIndex * step) / 2} y={10} fontSize="9" fill="currentColor" className="text-ink-secondary" textAnchor="middle">
              ACTUAL
            </text>
            <text
              x={padLeft + dividerIndex * step + ((rows.length - dividerIndex) * step) / 2}
              y={10}
              fontSize="9"
              fill="currentColor"
              className="text-ink-secondary"
              textAnchor="middle"
            >
              PROJECTED
            </text>
          </>
        )}

        {rows.map((row, i) => {
          const x = padLeft + i * step + (step - barWidth) / 2;
          let yCursor = padTop + chartH;
          const opacity = row.isActual === false ? 0.55 : 1;
          return (
            <g key={row.label}>
              {COMMISSION_COMPONENTS.map((c) => {
                const v = row.values[c.key] || 0;
                if (v <= 0) return null;
                const h = (v / max) * chartH;
                yCursor -= h;
                return (
                  <rect
                    key={c.key}
                    x={x}
                    y={yCursor}
                    width={barWidth}
                    height={h}
                    fill={c.color}
                    opacity={opacity}
                    style={{ transition: "y 0.35s ease-out, height 0.35s ease-out, opacity 0.2s" }}
                  />
                );
              })}
              <text x={x + barWidth / 2} y={height - 6} fontSize="9" fill="currentColor" className="text-ink-secondary" textAnchor="middle">
                {row.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[0.62rem] text-ink-secondary">
        {COMMISSION_COMPONENTS.map((c) => (
          <span key={c.key} className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: c.color }} />
            {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function commissionBreakdownList(values: Record<CommissionKey, number>, denom: "month" | "year" = "month") {
  return COMMISSION_COMPONENTS.filter((c) => (values[c.key] || 0) > 0).map((c) => ({
    label: c.label,
    color: c.color,
    amount: fmt(values[c.key]),
    runRate: denom === "month" ? fmt(values[c.key] * 12) : undefined,
  }));
}
