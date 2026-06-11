"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-vepagos-soft font-barlow">
      <Sidebar isCollapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
      <Topbar isSidebarCollapsed={isSidebarCollapsed} />
      <main className={`pt-[72px] min-h-screen transition-all duration-300 ${isSidebarCollapsed ? 'pl-[80px]' : 'pl-[280px]'}`}>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
