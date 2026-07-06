import { useEffect } from "react";

export default function SuccessModal({
  title,
  message,
  onDone,
  delayMs = 1600,
}: {
  title: string;
  message: string;
  onDone: () => void;
  delayMs?: number;
}) {
  useEffect(() => {
    const t = setTimeout(onDone, delayMs);
    return () => clearTimeout(t);
  }, [onDone, delayMs]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
      <div className="animate-pop-in w-full max-w-sm rounded-app border border-line bg-card shadow-app p-6 text-center">
        <div className="animate-ring-pulse mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand-blue">
          <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-white">
            <path
              d="M5 13l4 4L19 7"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-check-draw"
            />
          </svg>
        </div>
        <h3 className="font-display text-[1.05rem] text-ink">{title}</h3>
        <p className="mt-2 text-sm text-ink-secondary">{message}</p>
        <p className="mt-3 animate-pulse text-xs text-ink-secondary/70">Redirecting you to home…</p>
      </div>
    </div>
  );
}
