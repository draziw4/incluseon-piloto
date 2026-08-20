import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

import { Sidebar } from "../components/sidebar";
import { Navbar } from "../components/navbar";
import { isPilotMode } from "../config/pilot";
import { FeedbackLauncher } from "../features/pilot-feedback/components/feedback-launcher";

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = window.localStorage.getItem("incluseon:sidebar-open");
    return saved === null ? true : saved === "true";
  });

  useEffect(() => {
    window.localStorage.setItem("incluseon:sidebar-open", String(sidebarOpen));
  }, [sidebarOpen]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Fechar menu lateral"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/35 md:hidden"
        />
      )}

      <div className="flex min-h-screen flex-1 flex-col">
        <Navbar sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen((current) => !current)} />

        {isPilotMode && (
          <div className="border-b border-amber-200 bg-amber-50 px-6 py-2 text-center text-xs font-semibold text-amber-900">
            Ambiente de validação — utilize somente os dados fictícios fornecidos.
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-6xl"><Outlet /></div>
        </main>
      </div>

      {isPilotMode && <FeedbackLauncher />}
    </div>
  );
}
