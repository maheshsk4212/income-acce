import { useStore } from "../../store/StoreContext";
import type { Role } from "../../types";

interface TopBarProps {
  title: string;
  subtitle: string;
  onToggleSidebar: () => void;
  onBackToHome: () => void;
}

export default function TopBar({ title, subtitle, onToggleSidebar, onBackToHome }: TopBarProps) {
  const { role, setRole } = useStore();

  return (
    <div className="sticky top-0 z-30 flex flex-wrap items-center gap-3.5 border-b border-line bg-app-bg/90 px-5 py-2.5 backdrop-blur">
      <button
        onClick={onToggleSidebar}
        className="h-8 w-8 rounded-lg border border-line bg-card text-ink-secondary transition hover:border-brand-blue hover:text-brand-blue active:scale-95"
        title="Toggle navigation"
      >
        ☰
      </button>
      <div key={title} className="animate-fade-in-up text-[0.68rem] text-ink-secondary">
        {subtitle}
        <b className="block font-display text-[0.95rem] text-ink">{title}</b>
      </div>

      <button
        onClick={onBackToHome}
        className="rounded-lg border border-line bg-card px-3 py-1.5 text-xs font-bold text-ink-secondary transition hover:border-brand-blue hover:text-brand-blue-dark active:scale-95"
      >
        ← Back to Home
      </button>

      <div className="ml-auto flex gap-1 rounded-full border border-line bg-card p-1">
        {(["agent", "manager"] as Role[]).map((r) => (
          <button
            key={r}
            onClick={() => setRole(r)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold capitalize transition-all duration-200 active:scale-95 ${
              role === r ? "bg-ink text-white shadow-sm" : "text-ink-secondary hover:text-ink"
            }`}
          >
            {r} view
          </button>
        ))}
      </div>
    </div>
  );
}
