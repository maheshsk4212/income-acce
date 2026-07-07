import { useStore } from "../../store/StoreContext";

export default function Welcome({ onEnter }: { onEnter: (screen: "goals" | "dashboard") => void }) {
  const { role, currentAgent } = useStore();
  const initials = role === "agent" ? "SA" : "AT";

  const cards =
    role === "agent"
      ? [
          {
            key: "goals" as const,
            icon: "🎯",
            title: "Goal Setting",
            desc: "Define your income targets and reverse-engineer them into actionable daily activities.",
            cta: "Edit Plan",
            primary: true,
          },
          {
            key: "dashboard" as const,
            icon: "👤",
            title: "Dashboard",
            desc: "Manage your daily pipeline, log activities, and monitor your business health in real-time.",
            cta: "Enter Dashboard",
            primary: false,
          },
        ]
      : [
          {
            key: "goals" as const,
            icon: "🎯",
            title: "Team Goals",
            desc: "Set and review income targets for your team. Approve agent growth plans and track goal progress across your entire portfolio.",
            cta: "View Team Goals",
            primary: false,
          },
          {
            key: "dashboard" as const,
            icon: "👤",
            title: "Dashboard",
            desc: "Monitor your team's daily pipeline, log activities, and track performance against targets in real-time.",
            cta: "Enter Dashboard",
            primary: false,
          },
        ];

  return (
    <div className="min-h-screen bg-app-bg">
      <div className="flex items-center gap-2 border-b border-line bg-card px-6 py-3.5">
        <svg width="22" height="20" viewBox="0 0 26 24" className="shrink-0">
          <path d="M2 22 L8 2 L13 14 L18 2 L24 22 H19 L16.5 13 L13 21 L9.5 13 L7 22 Z" fill="#1366B8" />
          <path d="M8 2 L13 14 L11 19 L5.5 5.5 Z" fill="#7ED957" />
        </svg>
        <span className="font-display text-base font-bold text-ink">MetLife</span>
        <span className="text-sm text-ink-secondary">Income Accelerator</span>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-ink-secondary">🔔</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-blue text-xs font-bold text-white">{initials}</span>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-14 text-center">
        <div className="mx-auto mb-3 flex items-center justify-center gap-2">
          <svg width="30" height="27" viewBox="0 0 26 24" className="shrink-0">
            <path d="M2 22 L8 2 L13 14 L18 2 L24 22 H19 L16.5 13 L13 21 L9.5 13 L7 22 Z" fill="#1366B8" />
            <path d="M8 2 L13 14 L11 19 L5.5 5.5 Z" fill="#7ED957" />
          </svg>
          <span className="font-display text-2xl font-bold text-ink">MetLife</span>
        </div>
        <h1 className="font-display text-2xl">Welcome to Income Accelerator</h1>
        <p className="mt-1 text-sm text-ink-secondary">Select your role to access the tools and insights needed to achieve goals.</p>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {cards.map((c) => (
            <div
              key={c.key}
              className="animate-fade-in-up overflow-hidden rounded-app border border-line bg-card text-left shadow-app transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex h-32 items-start bg-gradient-to-br from-ink to-brand-blue-dark p-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-lg">{c.icon}</span>
              </div>
              <div className="p-5">
                <h3 className="font-display text-[0.95rem]">{c.title}</h3>
                <p className="mt-1 text-[0.78rem] text-ink-secondary">{c.desc}</p>
                <button
                  onClick={() => onEnter(c.key)}
                  className={`mt-4 w-full rounded-lg py-2.5 text-sm font-bold transition active:scale-[0.98] ${
                    c.primary
                      ? "bg-brand-blue text-white hover:bg-brand-blue-dark hover:shadow-md"
                      : "border border-line text-ink-secondary hover:border-brand-blue hover:text-brand-blue-dark"
                  }`}
                >
                  {c.cta}
                </button>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-10 text-[0.65rem] uppercase tracking-widest text-ink-secondary/60">Enterprise Performance Management System</p>
        <p className="mt-1 text-[0.7rem] text-ink-secondary/60">Signed in as {role === "agent" ? currentAgent.name : "Ahmad Tarabay"}</p>
      </div>
    </div>
  );
}
