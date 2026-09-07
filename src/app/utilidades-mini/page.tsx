"use client";

import { useEffect, useState } from "react";
import { UtilitiesView } from "@/components/noc/UtilitiesView";
import { LogOut, LogIn } from "lucide-react";
import Link from "next/link";

export default function UtilidadesMiniPage() {
  const [isAuth, setIsAuth] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      const auth = document.cookie.includes("noc_session");
      setIsAuth(auth);
      
      try {
        const res = await fetch("/api/settings/public-utilities");
        const data = await res.json();
        
        if (!data.enabled && !auth) {
          window.location.href = "/login";
        } else {
          setIsReady(true);
        }
      } catch (e) {
        setIsReady(true);
      }
    };
    checkAccess();
  }, []);

  const handleLogout = () => {
    document.cookie = "noc_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    window.location.href = "/login";
  };

  if (!isReady) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex flex-col items-center justify-center">
         <div className="w-12 h-12 border-4 border-vepagos-green border-t-transparent rounded-full animate-spin"></div>
         <p className="mt-4 text-vepagos-navy font-bold font-barlow-condensed tracking-widest uppercase">Verificando Accesos...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 font-barlow selection:bg-[#00CE7C] selection:text-[#001F60] flex flex-col">
      {/* Cintillo Replicado (Logo en blanco + Topbar azul) */}
      <header className="h-[72px] w-full flex relative z-10 shadow-sm">
        {/* Zona del Logo (simula el Sidebar) */}
        <div className="w-[280px] bg-white border-b border-gray-100 flex items-center justify-center shrink-0">
          <img
            src="/logo3.png"
            alt="Vepagos Logo"
            className="h-40 w-auto max-w-full object-contain"
          />
        </div>
        
        {/* Zona de la Barra Superior (simula el Topbar) */}
        <div className="flex-1 bg-[#001F60] text-white flex items-center justify-between px-6">
          <div className="flex items-center space-x-3 text-lg font-bold font-barlow-condensed tracking-wide">
            <span className="uppercase">NOC-NOC</span>
            <span className="text-gray-400 font-normal">|</span>
            <span className="text-gray-200 uppercase">MODO RÁPIDO</span>
          </div>
          
          <div className="flex items-center space-x-4">
            {isAuth ? (
              <button 
                onClick={handleLogout}
                className="flex items-center text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-[var(--radius-pill)] transition-colors border border-white/10"
              >
                <LogOut className="w-3.5 h-3.5 mr-2" />
                Cerrar Sesión
              </button>
            ) : (
              <Link 
                href="/login"
                className="flex items-center text-xs font-bold bg-vepagos-green text-vepagos-navy hover:bg-[#00b36b] px-3 py-1.5 rounded-[var(--radius-pill)] transition-colors"
              >
                <LogIn className="w-3.5 h-3.5 mr-2" />
                Iniciar Sesión
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto custom-scrollbar p-6 max-w-7xl mx-auto w-full">
        <UtilitiesView isReadOnly={true} />
      </main>
    </div>
  );
}
