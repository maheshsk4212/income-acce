import { useState } from "react";
import { StoreProvider, useStore } from "./store/StoreContext";
import AppShell from "./components/layout/AppShell";
import type { AgentScreen, ManagerScreen } from "./components/layout/Sidebar";
import AgentDashboard from "./components/agent/AgentDashboard";
import MyPlan from "./components/agent/MyPlan";
import TeamDashboard from "./components/manager/TeamDashboard";
import PlanApprovals from "./components/manager/PlanApprovals";

const TITLES: Record<string, [string, string]> = {
  dashboard: ["Dashboard", "Agent workspace"],
  plan: ["My Plan", "Agent workspace"],
  team: ["Team Dashboard", "Manager workspace"],
  approvals: ["Plan Approvals", "Manager workspace"],
};

function Screens() {
  const { role } = useStore();
  const [agentScreen, setAgentScreen] = useState<AgentScreen>("dashboard");
  const [managerScreen, setManagerScreen] = useState<ManagerScreen>("team");

  const screenKey = role === "agent" ? agentScreen : managerScreen;
  const [title, subtitle] = TITLES[screenKey];

  return (
    <AppShell
      agentScreen={agentScreen}
      managerScreen={managerScreen}
      onAgentNav={setAgentScreen}
      onManagerNav={setManagerScreen}
      title={title}
      subtitle={subtitle}
    >
      {role === "agent" ? (
        agentScreen === "dashboard" ? (
          <AgentDashboard onGoToPlan={() => setAgentScreen("plan")} />
        ) : (
          <MyPlan />
        )
      ) : managerScreen === "team" ? (
        <TeamDashboard onOpenApprovals={() => setManagerScreen("approvals")} />
      ) : (
        <PlanApprovals />
      )}
    </AppShell>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Screens />
    </StoreProvider>
  );
}
