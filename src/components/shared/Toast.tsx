import { useEffect } from "react";
import { useStore } from "../../store/StoreContext";

export default function Toast() {
  const { toast, clearToast } = useStore();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(clearToast, 2600);
    return () => clearTimeout(t);
  }, [toast, clearToast]);

  if (!toast) return null;

  return (
    <div
      key={toast}
      className="animate-toast-in fixed bottom-6 left-1/2 z-50 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white shadow-lg"
    >
      {toast}
    </div>
  );
}
