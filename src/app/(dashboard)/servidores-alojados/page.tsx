"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Server, Shield, Network, Loader2, Edit2, X, AlertCircle, Plus, Eye, EyeOff, Lock } from "lucide-react";

export default function ServidoresAlojadosPage() {
  const [hosts, setHosts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Mapping Modal State (for existing hosts)
  const [selectedHost, setSelectedHost] = useState<any>(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Add Server Modal State
  const [isAddHostModalOpen, setIsAddHostModalOpen] = useState(false);
  const [newHost, setNewHost] = useState({
    hostname: '',
    ip_address: '',
    os_type: 'Linux',
    server_role: 'Sin Asignar',
    vault_username: '',
    vault_password: '',
    environment: 'PROD',
    description: 'Añadido desde Vault'
  });
  const [showPassword, setShowPassword] = useState(false);

  // Create Service State
  const [newServiceName, setNewServiceName] = useState('');
  const [isCreatingService, setIsCreatingService] = useState(false);

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

  const openHostFormModal = (host?: any) => {
    if (host) {
      setNewHost({
        ...host,
        vault_password: host.vault_password === 'ERROR_DECRYPTING' ? '' : (host.vault_password || ''),
        vault_username: host.vault_username || ''
      });
      setSelectedServiceIds(host.services.map((s: any) => s.id));
    } else {
      setNewHost({
        hostname: '',
        ip_address: '',
        os_type: 'Linux',
        server_role: 'Sin Asignar',
        vault_username: '',
        vault_password: '',
        environment: 'PROD',
        description: 'Añadido desde Vault'
      } as any);
      setSelectedServiceIds([]);
    }
    setIsAddHostModalOpen(true);
  };

  const toggleService = (serviceId: string) => {
    if (selectedServiceIds.includes(serviceId)) {
      setSelectedServiceIds(selectedServiceIds.filter(id => id !== serviceId));
    } else {
      setSelectedServiceIds([...selectedServiceIds, serviceId]);
    }
  };

  const handleCreateService = async () => {
    if (!newServiceName.trim()) return;
    setIsCreatingService(true);
    try {
      const slug = newServiceName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newServiceName, slug })
      });
      if (res.ok) {
        const createdService = await res.json();
        setServices([...services, createdService]);
        setSelectedServiceIds([...selectedServiceIds, createdService.id]);
        setNewServiceName('');
      } else {
        alert("Error al crear el servicio");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCreatingService(false);
    }
  };

  const saveHostServices = async (hostId: string, refresh = true) => {
    try {
      const res = await fetch(`/api/hosts/${hostId}/services`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceIds: selectedServiceIds })
      });
      if (!res.ok) throw new Error("Error al guardar relaciones de servicios");
      if (refresh) await fetchVault();
    } catch (err: any) {
      throw err;
    }
  };

  const handleSaveMapping = async () => {
    setIsSaving(true);
    try {
      await saveHostServices(selectedHost.id, true);
      closeHostModal();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveHost = async () => {
    setIsSaving(true);
    try {
      const isEdit = !!newHost.id;
      const url = isEdit ? `/api/hosts/${newHost.id}` : '/api/hosts';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newHost)
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || `Error al ${isEdit ? 'actualizar' : 'crear'} servidor`);
      }
      
      const savedHost = await res.json();
      
      // Si seleccionó servicios, vincularlos
      if (selectedServiceIds.length > 0 || isEdit) {
        await saveHostServices(savedHost.id || newHost.id, false);
      }
      
      await fetchVault();
      setIsAddHostModalOpen(false);
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
        <Button className="bg-vepagos-green text-vepagos-navy hover:bg-[#00b36b] font-bold tracking-wide" onClick={() => openHostFormModal()}>
          <Plus className="w-4 h-4 mr-2" /> Añadir Servidor Seguro
        </Button>
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
                    No hay servidores registrados. Haz clic en "Añadir Servidor Seguro" para comenzar.
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
                        <div className="font-bold text-vepagos-navy text-base flex items-center">
                          {host.hostname}
                          {host.vault_password && <Lock className="w-3 h-3 text-vepagos-green ml-2" title="Credenciales Vault Asignadas" />}
                        </div>
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
                      className="text-vepagos-navy opacity-0 group-hover:opacity-100 transition-opacity mr-2"
                      onClick={() => openHostFormModal(host)}
                    >
                      <Edit2 className="w-4 h-4 mr-2" /> 
                      Editar
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-vepagos-green opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => openHostModal(host)}
                    >
                      <Network className="w-4 h-4 mr-2" /> 
                      Mapeo Rápido
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Mapeo de Servicios (Edit) */}
      {selectedHost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-2xl bg-white overflow-hidden shadow-2xl flex flex-col max-h-[85vh] rounded-xl border-0">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
              <div>
                <h2 className="text-xl font-bold font-barlow-condensed text-vepagos-navy uppercase tracking-wide flex items-center">
                  <Network className="w-5 h-5 mr-2 text-vepagos-green" />
                  Mapeo de Servicios: {selectedHost.hostname}
                </h2>
              </div>
              <button onClick={closeHostModal} className="text-gray-400 hover:text-gray-600 bg-white p-2 rounded-full border border-gray-200 hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto bg-gray-50/30">
              <div className="mb-4">
                <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">Servicios Disponibles en el Catálogo</h3>
                
                {/* Crear nuevo servicio inline */}
                <div className="flex items-center gap-2 mb-4 bg-white p-2 rounded-md border border-gray-200">
                  <input 
                    type="text" 
                    placeholder="Crear un servicio nuevo..." 
                    className="flex-1 text-sm bg-transparent border-0 outline-none px-2"
                    value={newServiceName}
                    onChange={e => setNewServiceName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCreateService()}
                  />
                  <Button size="sm" variant="outline" className="text-xs" onClick={handleCreateService} disabled={isCreatingService || !newServiceName.trim()}>
                    {isCreatingService ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Plus className="w-3 h-3 mr-1" />}
                    Crear y Asignar
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {services.length === 0 ? (
                    <div className="col-span-2 text-sm text-gray-400 italic py-4">No hay servicios registrados.</div>
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
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-white flex justify-end gap-3">
              <Button variant="outline" onClick={closeHostModal} disabled={isSaving}>Cancelar</Button>
              <Button className="bg-vepagos-green text-vepagos-navy hover:bg-[#00b36b]" onClick={handleSaveMapping} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Guardar Mapeo
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal Add Host (Vault) */}
      {isAddHostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto pt-20 pb-10">
          <Card className="w-full max-w-3xl bg-white overflow-hidden shadow-2xl flex flex-col rounded-xl border-0 relative my-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
              <div>
                <h2 className="text-xl font-bold font-barlow-condensed text-vepagos-navy uppercase tracking-wide flex items-center">
                  <Lock className="w-5 h-5 mr-2 text-vepagos-green" />
                  {newHost.id ? 'Editar Servidor (Vault)' : 'Registrar Servidor (Vault)'}
                </h2>
                <p className="text-xs text-gray-500 mt-1">{newHost.id ? 'Modifica los detalles o las credenciales del servidor.' : 'Registra un nuevo servidor en el inventario y guarda sus credenciales encriptadas.'}</p>
              </div>
              <button onClick={() => setIsAddHostModalOpen(false)} className="text-gray-400 hover:text-gray-600 bg-white p-2 rounded-full border border-gray-200 hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-visible">
              {/* Left Column: Host Details */}
              <div className="space-y-4">
                <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest border-b pb-2">1. Detalles de Infraestructura</h3>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Nombre (Hostname)</label>
                  <input type="text" className="w-full text-sm border border-gray-200 rounded-md p-2 bg-gray-50 focus:bg-white" value={newHost.hostname} onChange={e => setNewHost({...newHost, hostname: e.target.value})} placeholder="Ej: srv-db-01" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Dirección IP</label>
                  <input type="text" className="w-full text-sm border border-gray-200 rounded-md p-2 bg-gray-50 focus:bg-white" value={newHost.ip_address} onChange={e => setNewHost({...newHost, ip_address: e.target.value})} placeholder="Ej: 192.168.1.10" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Sistema Operativo</label>
                    <select className="w-full text-sm border border-gray-200 rounded-md p-2 bg-gray-50" value={newHost.os_type} onChange={e => setNewHost({...newHost, os_type: e.target.value})}>
                      <option value="Linux">Linux</option>
                      <option value="Windows">Windows</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Rol de Servidor</label>
                    <input type="text" className="w-full text-sm border border-gray-200 rounded-md p-2 bg-gray-50" value={newHost.server_role} onChange={e => setNewHost({...newHost, server_role: e.target.value})} placeholder="Ej: Base de Datos" />
                  </div>
                </div>

                <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest border-b pb-2 pt-4">2. Credenciales (Encriptadas)</h3>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Usuario</label>
                  <input type="text" className="w-full text-sm border border-gray-200 rounded-md p-2 bg-indigo-50/50" value={newHost.vault_username} onChange={e => setNewHost({...newHost, vault_username: e.target.value})} placeholder="root, admin, ec2-user..." />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Contraseña</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} className="w-full text-sm border border-gray-200 rounded-md p-2 bg-indigo-50/50 pr-10" value={newHost.vault_password} onChange={e => setNewHost({...newHost, vault_password: e.target.value})} placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Services */}
              <div className="space-y-4">
                <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest border-b pb-2">3. Asignación de Servicios</h3>
                
                {/* Crear nuevo servicio inline */}
                <div className="flex items-center gap-2 bg-white p-2 rounded-md border border-gray-200">
                  <input 
                    type="text" 
                    placeholder="Crear un servicio nuevo..." 
                    className="flex-1 text-sm bg-transparent border-0 outline-none px-2"
                    value={newServiceName}
                    onChange={e => setNewServiceName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCreateService()}
                  />
                  <Button type="button" size="sm" variant="outline" className="text-xs" onClick={handleCreateService} disabled={isCreatingService || !newServiceName.trim()}>
                    {isCreatingService ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Plus className="w-3 h-3 mr-1" />}
                    Añadir
                  </Button>
                </div>

                <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50/30">
                  <div className="max-h-[250px] overflow-y-auto p-2 space-y-1">
                    {services.length === 0 ? (
                      <div className="text-xs text-gray-400 italic p-2">Sin servicios disponibles.</div>
                    ) : services.map(svc => {
                      const isSelected = selectedServiceIds.includes(svc.id);
                      return (
                        <div 
                          key={svc.id}
                          onClick={() => toggleService(svc.id)}
                          className={`flex items-center p-2 rounded-md border cursor-pointer transition-all ${
                            isSelected 
                              ? 'border-vepagos-green bg-vepagos-green/10 shadow-sm' 
                              : 'border-transparent hover:bg-gray-100'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-sm border flex items-center justify-center mr-2 transition-colors ${
                            isSelected ? 'bg-vepagos-green border-vepagos-green' : 'border-gray-300 bg-white'
                          }`}>
                            {isSelected && <Shield className="w-2.5 h-2.5 text-white" />}
                          </div>
                          <div className={`font-bold text-xs ${isSelected ? 'text-vepagos-navy' : 'text-gray-600'}`}>
                            {svc.name}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-white flex justify-end gap-3 rounded-b-xl">
              <Button variant="outline" onClick={() => setIsAddHostModalOpen(false)} disabled={isSaving}>Cancelar</Button>
              <Button className="bg-vepagos-green text-vepagos-navy hover:bg-[#00b36b]" onClick={handleSaveHost} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />} {newHost.id ? 'Guardar Cambios' : 'Registrar Servidor'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
