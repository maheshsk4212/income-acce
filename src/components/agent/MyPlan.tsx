import { useState } from "react";
import { useStore } from "../../store/StoreContext";
import GoalWizard from "./GoalWizard";
import PlanStatus from "./PlanStatus";

export default function MyPlan() {
  const { currentAgent } = useStore();
  const { plan } = currentAgent;
  const [mode, setMode] = useState<"status" | "wizard">(plan ? "status" : "wizard");

  if (!plan || mode === "wizard") {
    return <GoalWizard onDone={() => setMode("status")} />;
  }
  return <PlanStatus onEdit={() => setMode("wizard")} />;
}
