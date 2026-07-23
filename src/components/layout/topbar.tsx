"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Menu, Bell, ChevronDown, LogOut, User } from "lucide-react";

export function Topbar({ isSidebarCollapsed }: { isSidebarCollapsed: boolean }) {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [user, setUser] = useState<{ firstName?: string, lastName?: string, roleName?: string, username?: string, email?: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
        }
      })
      .catch(console.error);
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        router.push("/login");
        router.refresh();
      }
    } catch (e) {
      console.error("Error al cerrar sesión", e);
    }
  };

  const getInitials = () => {
    if (!user?.firstName || !user?.lastName) return "U";
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  };

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

        {/* User Profile Dropdown */}
        <div className="relative">
          <div 
            className="flex items-center cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <div className="w-10 h-10 rounded-full bg-vepagos-green flex items-center justify-center text-vepagos-navy font-bold text-sm mr-3">
              {getInitials()}
            </div>
            <div className="flex flex-col mr-2">
              <span className="text-sm font-bold text-white leading-tight">
                {user ? `${user.firstName} ${user.lastName}` : "Cargando..."}
              </span>
              <span className="text-xs text-gray-400 leading-tight uppercase">
                {user?.roleName || "Usuario"}
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </div>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-50">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm text-vepagos-navy font-bold">@{user?.username || "user"}</p>
              </div>
              <button 
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                onClick={() => { setIsDropdownOpen(false); /* A futuro: mi perfil */ }}
              >
                <User className="w-4 h-4 mr-2 text-gray-400" />
                Mi Perfil
              </button>
              <button 
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center font-bold"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
