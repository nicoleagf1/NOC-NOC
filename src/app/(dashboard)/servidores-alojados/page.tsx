"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Server, Shield, Network, Loader2, Edit2, X, AlertCircle } from "lucide-react";

export default function ServidoresAlojadosPage() {
  const [hosts, setHosts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal State
  const [selectedHost, setSelectedHost] = useState<any>(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const fetchVault = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/hosts/vault");
      if (!res.ok) throw new Error("Error al cargar inventario de servidores");
      const data = await res.json();
      setHosts(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const res = await fetch("/api/services");
      if (res.ok) {
        setServices(await res.json());
      }
    } catch (e) {
      console.error("Error fetching services", e);
    }
  };

  useEffect(() => {
    fetchVault();
    fetchServices();
  }, []);

  const openHostModal = (host: any) => {
    setSelectedHost(host);
    setSelectedServiceIds(host.services.map((s: any) => s.id));
  };

  const closeHostModal = () => {
    setSelectedHost(null);
    setSelectedServiceIds([]);
  };

  const toggleService = (serviceId: string) => {
    if (selectedServiceIds.includes(serviceId)) {
      setSelectedServiceIds(selectedServiceIds.filter(id => id !== serviceId));
    } else {
      setSelectedServiceIds([...selectedServiceIds, serviceId]);
    }
  };

  const saveHostServices = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/hosts/${selectedHost.id}/services`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceIds: selectedServiceIds })
      });
      if (!res.ok) throw new Error("Error al guardar relaciones");
      
      await fetchVault(); // Recargar datos
      closeHostModal();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-vepagos-green" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-barlow-condensed text-vepagos-navy uppercase tracking-wide">
            Servidores Alojados (CMDB)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Inventario centralizado de infraestructura y su mapeo de servicios de negocio asociados.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-md flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span className="text-sm font-bold">{error}</span>
        </div>
      )}

      {/* Main Vault Table */}
      <Card className="overflow-hidden bg-white shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                <th className="px-6 py-4">Servidor / IP</th>
                <th className="px-6 py-4">Entorno</th>
                <th className="px-6 py-4">SO y Rol</th>
                <th className="px-6 py-4 w-1/3">Servicios Alojados</th>
                <th className="px-6 py-4 text-right">Mapeo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {hosts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    No hay servidores registrados. Ve a Configuración para agregar hosts.
                  </td>
                </tr>
              ) : hosts.map((host) => (
                <tr key={host.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center mr-3">
                        <Server className="w-5 h-5 text-indigo-500" />
                      </div>
                      <div>
                        <div className="font-bold text-vepagos-navy text-base">{host.hostname}</div>
                        <div className="text-xs text-gray-500 font-mono mt-0.5">{host.ip_address}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={host.environment === 'PROD' ? 'default' : 'secondary'} className="text-[10px] uppercase font-bold tracking-widest">
                      {host.environment}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-700">{host.os_type}</div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-0.5">Rol: {host.server_role}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {host.services.length === 0 ? (
                        <span className="text-xs text-gray-400 italic">Ningún servicio asignado</span>
                      ) : host.services.map((svc: any) => (
                        <Badge key={svc.id} variant="outline" className="bg-white border-gray-200 text-vepagos-navy text-xs">
                          {svc.name}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-vepagos-green opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => openHostModal(host)}
                    >
                      <Edit2 className="w-4 h-4 mr-2" /> 
                      Vincular Servicios
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Mapeo de Servicios */}
      {selectedHost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-2xl bg-white overflow-hidden shadow-2xl flex flex-col max-h-[85vh] rounded-xl border-0">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
              <div>
                <h2 className="text-xl font-bold font-barlow-condensed text-vepagos-navy uppercase tracking-wide flex items-center">
                  <Network className="w-5 h-5 mr-2 text-vepagos-green" />
                  Mapeo de Servicios: {selectedHost.hostname}
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Selecciona qué servicios operan o dependen de esta máquina ({selectedHost.ip_address}).
                </p>
              </div>
              <button onClick={closeHostModal} className="text-gray-400 hover:text-gray-600 bg-white p-2 rounded-full border border-gray-200 hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto bg-gray-50/30">
              <div className="mb-4">
                <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">Servicios Disponibles en el Catálogo</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {services.length === 0 ? (
                    <div className="col-span-2 text-sm text-gray-400 italic py-4">No hay servicios registrados en la plataforma.</div>
                  ) : services.map(svc => {
                    const isSelected = selectedServiceIds.includes(svc.id);
                    return (
                      <div 
                        key={svc.id}
                        onClick={() => toggleService(svc.id)}
                        className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-vepagos-green bg-vepagos-green/5 shadow-sm' 
                            : 'border-gray-200 bg-white hover:border-vepagos-green/50'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 transition-colors ${
                          isSelected ? 'bg-vepagos-green border-vepagos-green' : 'border-gray-300'
                        }`}>
                          {isSelected && <Shield className="w-3 h-3 text-white" />}
                        </div>
                        <div>
                          <div className={`font-bold text-sm ${isSelected ? 'text-vepagos-navy' : 'text-gray-600'}`}>
                            {svc.name}
                          </div>
                          <div className="text-[10px] text-gray-400 mt-0.5">{svc.endpoint_url || 'Sin endpoint HTTP'}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-white flex justify-end gap-3">
              <Button variant="outline" onClick={closeHostModal} disabled={isSaving}>
                Cancelar
              </Button>
              <Button 
                className="bg-vepagos-green text-vepagos-navy hover:bg-[#00b36b]" 
                onClick={saveHostServices}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Guardar Mapeo
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
