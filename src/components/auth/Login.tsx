import { useState } from "react";

export default function Login({ onSignIn }: { onSignIn: () => void }) {
  const [keepSignedIn, setKeepSignedIn] = useState(true);

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
      <div className="relative hidden items-end overflow-hidden bg-gradient-to-br from-ink via-brand-blue-dark to-brand-blue p-10 text-white md:flex">
        <div className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, white 0, transparent 45%), radial-gradient(circle at 80% 75%, white 0, transparent 40%)" }} />
        <div className="relative">
          <h1 className="font-display text-3xl font-extrabold">Income Accelerator</h1>
          <p className="mt-1 text-sm text-white/80">Sign in to access the tool and insights for your role.</p>
        </div>
      </div>

      <div className="flex items-center justify-center bg-app-bg px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center justify-center gap-2">
            <svg width="26" height="24" viewBox="0 0 26 24" className="shrink-0">
              <path d="M2 22 L8 2 L13 14 L18 2 L24 22 H19 L16.5 13 L13 21 L9.5 13 L7 22 Z" fill="#1366B8" />
              <path d="M8 2 L13 14 L11 19 L5.5 5.5 Z" fill="#7ED957" />
            </svg>
            <span className="font-display text-xl font-bold text-ink">MetLife</span>
          </div>

          <div className="animate-fade-in-up rounded-app border border-line bg-card p-7 shadow-app">
            <h2 className="text-center font-display text-lg">Welcome back</h2>
            <p className="text-center text-[0.8rem] text-ink-secondary">Sign in to your account</p>

            <form
              className="mt-5 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                onSignIn();
              }}
            >
              <div>
                <label className="block text-[0.68rem] font-bold uppercase tracking-wide text-ink-secondary">Username / Agent ID</label>
                <input
                  defaultValue="MG945F21"
                  className="mt-1 w-full rounded-lg border border-line bg-app-bg px-3 py-2.5 text-sm transition focus:border-brand-blue focus:bg-card focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                />
              </div>
              <div>
                <label className="block text-[0.68rem] font-bold uppercase tracking-wide text-ink-secondary">Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  className="mt-1 w-full rounded-lg border border-line bg-app-bg px-3 py-2.5 text-sm transition focus:border-brand-blue focus:bg-card focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                />
              </div>

              <div className="flex items-center justify-between text-[0.78rem]">
                <label className="flex items-center gap-1.5 text-ink-secondary">
                  <input type="checkbox" checked={keepSignedIn} onChange={(e) => setKeepSignedIn(e.target.checked)} className="accent-brand-blue" />
                  Keep me signed in
                </label>
                <span className="font-semibold text-brand-blue">Forgot password?</span>
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-brand-blue py-2.5 text-sm font-bold text-white transition hover:bg-brand-blue-dark hover:shadow-md active:scale-[0.98]"
              >
                Sign In
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-[0.65rem] uppercase tracking-widest text-ink-secondary/60">
            © 2026 MetLife · Enterprise Performance Management System
          </p>
        </div>
      </div>
    </div>
  );
}
