interface ProgressRingProps {
  pct: number; // 0-100+
  label: string;
  size?: number;
}

export default function ProgressRing({ pct, label, size = 104 }: ProgressRingProps) {
  const clamped = Math.min(100, Math.max(0, pct));
  const color = pct >= 90 ? "var(--color-brand-green)" : pct >= 60 ? "var(--color-brand-amber)" : "var(--color-brand-red)";
  const inner = size - 24;

  return (
    <div
      className="animate-pop-in flex items-center justify-center rounded-full transition-[background] duration-700 ease-out"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${color} ${clamped}%, #e4edf3 0)`,
      }}
      role="img"
      aria-label={`${label}: ${pct}%`}
    >
      <div
        className="flex flex-col items-center justify-center rounded-full bg-card transition-transform"
        style={{ width: inner, height: inner }}
      >
        <b className="font-display text-2xl text-ink transition-colors duration-300">{pct}%</b>
        <span className="text-[0.62rem] font-bold transition-colors duration-300" style={{ color }}>
          {label}
        </span>
      </div>
    </div>
  );
}
