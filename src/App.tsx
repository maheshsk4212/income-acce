import { useState } from "react";
import { StoreProvider, useStore } from "./store/StoreContext";
import AppShell from "./components/layout/AppShell";
import type { AgentScreen, ManagerScreen } from "./components/layout/Sidebar";
import AgentDashboard from "./components/agent/AgentDashboard";
import MyPlan from "./components/agent/MyPlan";
import MyProgress from "./components/agent/MyProgress";
import TeamDashboard from "./components/manager/TeamDashboard";
import PlanApprovals from "./components/manager/PlanApprovals";
import ActivityPlan from "./components/manager/ActivityPlan";
import Login from "./components/auth/Login";
import Welcome from "./components/auth/Welcome";

const TITLES: Record<string, [string, string]> = {
  dashboard: ["Dashboard", "Agent workspace"],
  plan: ["My Plan", "Agent workspace"],
  progress: ["My Progress", "Agent workspace"],
  team: ["Dashboard", "Manager workspace"],
  approvals: ["Plan Approvals", "Manager workspace"],
  activity: ["Activity Plan", "Manager workspace"],
};

type Stage = "login" | "welcome" | "app";

function Gate() {
  const { role } = useStore();
  const [stage, setStage] = useState<Stage>("login");
  const [agentScreen, setAgentScreen] = useState<AgentScreen>("dashboard");
  const [managerScreen, setManagerScreen] = useState<ManagerScreen>("team");

  if (stage === "login") return <Login onSignIn={() => setStage("welcome")} />;

  if (stage === "welcome") {
    return (
      <Welcome
        onEnter={(card) => {
          if (role === "agent") setAgentScreen(card === "goals" ? "plan" : "dashboard");
          else setManagerScreen(card === "goals" ? "approvals" : "team");
          setStage("app");
        }}
      />
    );
  }

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
      onBackToHome={() => setStage("welcome")}
    >
      {role === "agent" ? (
        agentScreen === "dashboard" ? (
          <AgentDashboard onGoToPlan={() => setAgentScreen("plan")} />
        ) : agentScreen === "plan" ? (
          <MyPlan />
        ) : (
          <MyProgress />
        )
      ) : managerScreen === "team" ? (
        <TeamDashboard onOpenApprovals={() => setManagerScreen("approvals")} />
      ) : managerScreen === "approvals" ? (
        <PlanApprovals />
      ) : (
        <ActivityPlan />
      )}
    </AppShell>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Gate />
    </StoreProvider>
  );
}
