import { useState, type ReactNode } from "react";
import Sidebar, { type AgentScreen, type ManagerScreen } from "./Sidebar";
import TopBar from "./TopBar";
import Toast from "../shared/Toast";
import { useStore } from "../../store/StoreContext";

interface AppShellProps {
  agentScreen: AgentScreen;
  managerScreen: ManagerScreen;
  onAgentNav: (s: AgentScreen) => void;
  onManagerNav: (s: ManagerScreen) => void;
  title: string;
  subtitle: string;
  onBackToHome: () => void;
  children: ReactNode;
}

export default function AppShell({ agentScreen, managerScreen, onAgentNav, onManagerNav, title, subtitle, onBackToHome, children }: AppShellProps) {
  const { role } = useStore();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen">
      <Sidebar
        role={role}
        agentScreen={agentScreen}
        managerScreen={managerScreen}
        onAgentNav={onAgentNav}
        onManagerNav={onManagerNav}
        collapsed={collapsed}
      />
      <div className={`flex min-h-screen flex-col transition-all ${collapsed ? "ml-16" : "ml-60"}`}>
        <TopBar title={title} subtitle={subtitle} onToggleSidebar={() => setCollapsed((c) => !c)} onBackToHome={onBackToHome} />
        <div className="flex-1 px-5 py-4 pb-16">{children}</div>
      </div>
      <Toast />
    </div>
  );
}
