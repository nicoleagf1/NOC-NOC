"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Menu, Bell, ChevronDown, LogOut, User, Home, Clock } from "lucide-react";

export function Topbar({ isSidebarCollapsed }: { isSidebarCollapsed: boolean }) {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [user, setUser] = useState<{ firstName?: string, lastName?: string, roleName?: string, username?: string, email?: string } | null>(null);
  const [activeAlertsCount, setActiveAlertsCount] = useState(0);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    // Reloj en tiempo real sincronizado
    setCurrentTime(new Date());
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(clockInterval);
  }, []);

  useEffect(() => {
    // Fetch User
    fetch("/api/auth/me")
      .then(res => res.json())
      .then(data => {
        if (data.user) setUser(data.user);
      })
      .catch(console.error);

    // Fetch Alerts Count
    const fetchAlertsCount = async () => {
      try {
        const res = await fetch("/api/metrics/alerts");
        const json = await res.json();
        if (json.success) {
          const activeCount = json.data.filter((a: any) => a.status === 'ACTIVA').length;
          setActiveAlertsCount(activeCount);
        }
      } catch (e) {
        console.error("Error fetching alerts", e);
      }
    };
    
    fetchAlertsCount();
    const interval = setInterval(fetchAlertsCount, 30000);
    return () => clearInterval(interval);
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

  const [timeZoneMode, setTimeZoneMode] = useState<'VET' | 'UTC'>('VET');

  const formatTime = (date: Date, mode: 'VET' | 'UTC') => {
    return date.toLocaleTimeString('es-VE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: mode === 'VET' ? 'America/Caracas' : 'UTC',
    });
  };

  const formatDate = (date: Date, mode: 'VET' | 'UTC') => {
    return date.toLocaleDateString('es-VE', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      timeZone: mode === 'VET' ? 'America/Caracas' : 'UTC',
    }).toUpperCase();
  };

  return (
    <header className={`h-[72px] bg-vepagos-navy text-white flex items-center justify-between px-6 fixed top-0 right-0 z-50 transition-all duration-300 ${isSidebarCollapsed ? 'left-[80px]' : 'left-[280px]'}`}>
      {/* Left side: Menu and Title */}
      <div className="flex items-center">
        <div className="flex items-center space-x-3 text-lg font-bold font-barlow-condensed tracking-wide">
          <span className="uppercase">NOC-NOC</span>
          <span className="text-gray-400 font-normal">|</span>
          <span className="text-gray-200 uppercase">Centro de Monitoreo</span>
        </div>
      </div>

      {/* Center: Live NOC Operations Clock (Centrado geométrico absoluto en el header) */}
      <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center justify-center pointer-events-auto">
        <button
          onClick={() => setTimeZoneMode(prev => prev === 'VET' ? 'UTC' : 'VET')}
          title={`Zona Horaria activa: ${timeZoneMode === 'VET' ? 'Hora de Venezuela (America/Caracas)' : 'Hora Universal (UTC para Prometheus/Logs)'}. Haz clic para alternar.`}
          className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-vepagos-green/40 backdrop-blur-md px-4 py-1.5 rounded-xl flex items-center space-x-3 shadow-inner transition-all duration-200 cursor-pointer group"
        >
          <div className="flex items-center space-x-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-vepagos-green opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-vepagos-green"></span>
            </span>
            <Clock className="w-3.5 h-3.5 text-vepagos-green group-hover:rotate-12 transition-transform duration-300" strokeWidth={2} />
            <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-vepagos-green">
              NOC TIME
            </span>
          </div>

          <div className="h-4 w-[1px] bg-white/15" />

          <div className="flex items-center space-x-2 font-mono">
            <span className="text-base font-bold text-white tracking-widest tabular-nums drop-shadow-sm font-mono">
              {currentTime ? formatTime(currentTime, timeZoneMode) : "--:--:--"}
            </span>
            <span className="text-[10px] text-gray-300 font-sans tracking-wide font-medium">
              {currentTime ? formatDate(currentTime, timeZoneMode) : "---, -- ---"}
            </span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold tracking-wide transition-colors ${
              timeZoneMode === 'VET' 
                ? 'bg-vepagos-green/20 text-vepagos-green border border-vepagos-green/30' 
                : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
            }`}>
              {timeZoneMode}
            </span>
          </div>
        </button>
      </div>

      {/* Right side: Notifications and Profile */}
      <div className="flex items-center space-x-6">
        {/* Notification Bell */}
        <button className="relative hover:bg-white/10 p-1.5 rounded-md transition-colors">
          <Bell className="w-6 h-6 text-gray-200" />
          {activeAlertsCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-vepagos-green text-vepagos-navy text-[10px] font-bold rounded-full flex items-center justify-center border border-vepagos-navy">
              {activeAlertsCount}
            </span>
          )}
        </button>

        {/* User Profile Dropdown */}
        <div className="relative">
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <span className="text-sm font-bold text-white group-hover:text-gray-200 transition-colors">
              {user ? `${user.firstName} ${user.lastName}` : "Cargando..."}
            </span>
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm group-hover:bg-gray-100 transition-colors">
              <User className="w-5 h-5 text-vepagos-navy" strokeWidth={1.5} />
            </div>
          </div>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-3 p-3 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 z-50 min-w-[240px]">
              <div className="flex items-center justify-between gap-1">
                <button 
                  className="flex flex-col items-center justify-center space-y-1.5 p-2 flex-1 hover:bg-gray-50 rounded-lg transition-all group"
                  onClick={() => { setIsDropdownOpen(false); router.push("/"); }}
                >
                  <Home className="w-5 h-5 text-vepagos-navy group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                  <span className="text-[11px] font-semibold text-vepagos-navy">Home</span>
                </button>
                <button 
                  className="flex flex-col items-center justify-center space-y-1.5 p-2 flex-1 hover:bg-gray-50 rounded-lg transition-all group"
                  onClick={() => { setIsDropdownOpen(false); router.push("/perfil"); }}
                >
                  <User className="w-5 h-5 text-vepagos-navy group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                  <span className="text-[11px] font-semibold text-vepagos-navy">Perfil</span>
                </button>
                <button 
                  className="flex flex-col items-center justify-center space-y-1.5 p-2 flex-1 hover:bg-red-50 rounded-lg transition-all group"
                  onClick={handleLogout}
                >
                  <LogOut className="w-5 h-5 text-vepagos-navy group-hover:text-red-500 group-hover:scale-110 transition-all" strokeWidth={1.5} />
                  <span className="text-[11px] font-semibold text-vepagos-navy group-hover:text-red-600">Salir</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
