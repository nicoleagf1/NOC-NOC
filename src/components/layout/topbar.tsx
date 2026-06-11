import { Menu, Bell, ChevronDown } from "lucide-react";

export function Topbar({ isSidebarCollapsed }: { isSidebarCollapsed: boolean }) {
  return (
    <header className={`h-[72px] bg-vepagos-navy text-white flex items-center justify-between px-6 fixed top-0 right-0 z-10 transition-all duration-300 ${isSidebarCollapsed ? 'left-[80px]' : 'left-[280px]'}`}>
      {/* Left side: Menu and Title */}
      <div className="flex items-center">
        <button className="mr-4 hover:bg-white/10 p-1.5 rounded-md transition-colors">
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center space-x-3 text-lg font-bold font-barlow-condensed tracking-wide">
          <span className="uppercase">NOC-NOC</span>
          <span className="text-gray-400 font-normal">|</span>
          <span className="text-gray-200 uppercase">Centro de Monitoreo</span>
        </div>
      </div>

      {/* Right side: Notifications and Profile */}
      <div className="flex items-center space-x-6">
        {/* Notification Bell */}
        <button className="relative hover:bg-white/10 p-1.5 rounded-md transition-colors">
          <Bell className="w-6 h-6 text-gray-200" />
          <span className="absolute top-1 right-1 w-4 h-4 bg-vepagos-green text-vepagos-navy text-[10px] font-bold rounded-full flex items-center justify-center border border-vepagos-navy">
            12
          </span>
        </button>

        {/* User Profile */}
        <div className="flex items-center cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors">
          <div className="w-10 h-10 rounded-full bg-vepagos-green flex items-center justify-center text-vepagos-navy font-bold text-sm mr-3">
            AD
          </div>
          <div className="flex flex-col mr-2">
            <span className="text-sm font-bold text-white leading-tight">Administrador</span>
            <span className="text-xs text-gray-400 leading-tight">Operador NOC</span>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </header>
  );
}
