interface KpiTileProps {
  label: string;
  value: string;
  sub?: string;
  delta?: { value: string; positive: boolean };
}

export default function KpiTile({ label, value, sub, delta }: KpiTileProps) {
  return (
    <div className="rounded-app border border-line bg-card shadow-app border-t-[3px] border-t-brand-blue px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="text-[0.62rem] font-bold uppercase tracking-wider text-ink-secondary">{label}</div>
      <div className="mt-0.5 text-2xl font-extrabold text-ink font-display">{value}</div>
      {sub && <div className="text-[0.7rem] text-ink-secondary">{sub}</div>}
      {delta && (
        <div
          className={`mt-1 inline-flex items-center gap-1 text-[0.68rem] font-bold ${
            delta.positive ? "text-brand-green" : "text-brand-red"
          }`}
        >
          <span aria-hidden="true">{delta.positive ? "▲" : "▼"}</span>
          {delta.value}
        </div>
      )}
    </div>
  );
}
