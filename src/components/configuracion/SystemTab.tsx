"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Settings, ShieldCheck, Loader2 } from "lucide-react";

export function SystemTab() {
  const [isPublicUtilitiesEnabled, setIsPublicUtilitiesEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings/public-utilities");
      if (res.ok) {
        const data = await res.json();
        setIsPublicUtilitiesEnabled(data.enabled);
      }
    } catch (e) {
      console.error("Error fetching settings", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async () => {
    setIsSaving(true);
    const newValue = !isPublicUtilitiesEnabled;
    setIsPublicUtilitiesEnabled(newValue); // Optimistic UI update
    
    try {
      const res = await fetch("/api/settings/public-utilities", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: newValue })
      });
      if (!res.ok) {
        // Revert on error
        setIsPublicUtilitiesEnabled(!newValue);
        alert("Error al actualizar la configuración");
      }
    } catch (e) {
      console.error(e);
      setIsPublicUtilitiesEnabled(!newValue);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-vepagos-green" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Card className="bg-white border border-gray-100 shadow-sm rounded-xl overflow-hidden">
        <div className="p-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center">
            <Settings className="w-5 h-5 text-vepagos-navy mr-2" />
            <h3 className="font-bold text-vepagos-navy font-barlow-condensed tracking-wide uppercase">Configuración de Accesos</h3>
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex items-start justify-between p-4 bg-gray-50/50 rounded-lg border border-gray-100">
            <div>
              <div className="flex items-center mb-1">
                <ShieldCheck className="w-4 h-4 text-vepagos-green mr-2" />
                <h4 className="font-bold text-sm text-vepagos-navy">Portal Público de Utilidades</h4>
              </div>
              <p className="text-xs text-gray-500 max-w-xl">
                Permite el acceso al panel de utilidades rápidas sin necesidad de iniciar sesión. Ideal para operadores de campo que requieren copiar comandos de forma inmediata. Si se desactiva, cualquier acceso a /utilidades-mini requerirá autenticación.
              </p>
            </div>
            
            <div className="ml-4 flex-shrink-0">
              <label className="relative inline-flex items-center cursor-pointer group">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={isPublicUtilitiesEnabled} 
                  onChange={handleToggle}
                  disabled={isSaving}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-vepagos-green peer-disabled:opacity-50"></div>
              </label>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
