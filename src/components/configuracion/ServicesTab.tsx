import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2, Globe, Activity, CheckCircle2, AlertCircle, X, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function ServicesTab() {
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/services");
      if (res.ok) setServices(await res.json());
    } catch (e) {
      console.error("Error fetching services", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const isNew = !editingService?.id;
      const url = isNew ? "/api/services" : `/api/services/${editingService.id}`;
      const method = isNew ? "POST" : "PUT";
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingService)
      });
      
      if (res.ok) {
        await fetchServices();
        setIsModalOpen(false);
      } else {
        const data = await res.json();
        alert(data.error || "Error al guardar");
      }
    } catch (e) {
      console.error("Error saving service", e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este servicio del monitoreo?")) return;
    try {
      const res = await fetch(`/api/services/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchServices();
        setIsModalOpen(false);
      }
    } catch (e) {
      console.error("Error deleting", e);
    }
  };

  return (
    <div className="pt-4">
      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h3 className="text-sm font-bold text-vepagos-navy uppercase tracking-wider">Catálogo de Servicios de Negocio</h3>
            <p className="text-xs text-gray-500">Los servicios agregados aquí serán provisionados automáticamente en Uptime Kuma.</p>
          </div>
          <Button size="sm" className="bg-vepagos-navy text-white text-xs uppercase font-bold" onClick={() => { setEditingService({ current_status: 'DISPONIBLE', monitor_type: 'http', monitor_interval: 60 }); setIsModalOpen(true); }}>
            <Plus className="w-4 h-4 mr-1" /> Añadir Servicio
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-white text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                <th className="px-6 py-4">Servicio</th>
                <th className="px-6 py-4">Endpoint (URL)</th>
                <th className="px-6 py-4 text-center">Estado Kuma</th>
                <th className="px-6 py-4">Estado Operativo</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {isLoading ? (
                <tr><td colSpan={5} className="p-6 text-center text-gray-500 text-xs">Cargando servicios...</td></tr>
              ) : services.length === 0 ? (
                <tr><td colSpan={5} className="p-6 text-center text-gray-500 text-xs">No hay servicios registrados.</td></tr>
              ) : services.map(service => (
                <tr key={service.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <Globe className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <div className="font-bold text-vepagos-navy">{service.name}</div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-widest">{service.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <a href={service.endpoint_url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline">{service.endpoint_url || 'N/A'}</a>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {service.uptime_kuma_monitor_id ? (
                      <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">
                        ID: {service.uptime_kuma_monitor_id}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] bg-yellow-50 text-yellow-700 border-yellow-200">
                        Pendiente
                      </Badge>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${service.current_status === 'DISPONIBLE' ? 'bg-green-100 text-green-700' : service.current_status === 'DEGRADADO' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      {service.current_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-vepagos-navy" onClick={() => { setEditingService(service); setIsModalOpen(true); }}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal */}
      {isModalOpen && editingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md bg-white overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold font-barlow-condensed text-vepagos-navy uppercase tracking-wide">
                {editingService.id ? 'Editar Servicio' : 'Añadir Servicio Web'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Nombre del Servicio</label>
                <input type="text" className="w-full text-sm border border-gray-200 rounded-md p-2" value={editingService.name || ''} onChange={e => {
                  const name = e.target.value;
                  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                  setEditingService({...editingService, name, slug});
                }} placeholder="ej. API de Pagos" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Slug (Identificador único)</label>
                <input type="text" className="w-full text-sm border border-gray-200 rounded-md p-2 bg-gray-50" value={editingService.slug || ''} onChange={e => setEditingService({...editingService, slug: e.target.value})} placeholder="api-pagos" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Tipo de monitor</label>
                <select className="w-full text-sm border border-gray-200 rounded-md p-2" value={editingService.monitor_type || 'http'} onChange={e => {
                  const type = e.target.value;
                  setEditingService({...editingService, monitor_type: type, monitor_config: editingService.monitor_config || {}});
                }}>
                  <option value="http">HTTP(s)</option>
                  <option value="keyword">HTTP(s) - Palabra clave</option>
                  <option value="port">TCP Port</option>
                  <option value="ping">Ping</option>
                  <option value="dns">DNS</option>
                  <option value="push">Push (Pasivo)</option>
                  <option value="docker">Contenedor de Docker</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                  {editingService.monitor_type === 'ping' || editingService.monitor_type === 'dns' || editingService.monitor_type === 'port' ? 'Hostname / IP' : 'URL del Endpoint'}
                </label>
                <input type="text" className="w-full text-sm border border-gray-200 rounded-md p-2" value={editingService.endpoint_url || ''} onChange={e => setEditingService({...editingService, endpoint_url: e.target.value})} placeholder={editingService.monitor_type === 'ping' ? '192.168.1.10' : 'https://api.miproyecto.com/health'} />
              </div>

              {editingService.monitor_type === 'port' && (
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Puerto TCP</label>
                  <input type="number" className="w-full text-sm border border-gray-200 rounded-md p-2" value={editingService.monitor_config?.port || ''} onChange={e => setEditingService({...editingService, monitor_config: { ...editingService.monitor_config, port: e.target.value }})} placeholder="8080" />
                </div>
              )}

              {editingService.monitor_type === 'keyword' && (
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Palabra Clave</label>
                  <input type="text" className="w-full text-sm border border-gray-200 rounded-md p-2" value={editingService.monitor_config?.keyword || ''} onChange={e => setEditingService({...editingService, monitor_config: { ...editingService.monitor_config, keyword: e.target.value }})} placeholder="ok" />
                </div>
              )}

              {editingService.monitor_type === 'dns' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Servidor DNS (Opcional)</label>
                    <input type="text" className="w-full text-sm border border-gray-200 rounded-md p-2" value={editingService.monitor_config?.dns_resolve_server || ''} onChange={e => setEditingService({...editingService, monitor_config: { ...editingService.monitor_config, dns_resolve_server: e.target.value }})} placeholder="8.8.8.8" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Tipo de Registro DNS</label>
                    <select className="w-full text-sm border border-gray-200 rounded-md p-2" value={editingService.monitor_config?.dns_resolve_type || 'A'} onChange={e => setEditingService({...editingService, monitor_config: { ...editingService.monitor_config, dns_resolve_type: e.target.value }})}>
                      <option value="A">A</option>
                      <option value="AAAA">AAAA</option>
                      <option value="CNAME">CNAME</option>
                      <option value="MX">MX</option>
                      <option value="TXT">TXT</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Intervalo (Latidos por segundo)</label>
                <input type="number" min="10" className="w-full text-sm border border-gray-200 rounded-md p-2" value={editingService.monitor_interval || 60} onChange={e => setEditingService({...editingService, monitor_interval: parseInt(e.target.value) || 60})} />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Estado Forzado</label>
                <select className="w-full text-sm border border-gray-200 rounded-md p-2" value={editingService.current_status || 'DISPONIBLE'} onChange={e => setEditingService({...editingService, current_status: e.target.value})}>
                  <option value="DISPONIBLE">DISPONIBLE</option>
                  <option value="DEGRADADO">DEGRADADO</option>
                  <option value="CAÍDO">CAÍDO</option>
                </select>
              </div>

              {!editingService.id && (
                <div className="mt-4 p-3 border border-indigo-100 bg-indigo-50 rounded-md flex items-start">
                  <Activity className="w-4 h-4 text-indigo-500 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-indigo-800">
                    Al guardar este servicio, <b>NOC-NOC intentará conectarse a Uptime Kuma</b> para aprovisionar el monitor automáticamente. Esto puede tomar unos segundos.
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-2">
              {editingService.id && (
                <Button variant="destructive" className="flex-1" onClick={() => handleDelete(editingService.id!)} disabled={isSaving}>
                  Eliminar
                </Button>
              )}
              <Button 
                className={`flex-[2] bg-vepagos-green text-vepagos-navy hover:bg-[#00b36b]`}
                onClick={handleSave}
                disabled={!editingService.name || !editingService.slug || isSaving}
              >
                {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Aprovisionando...</> : 'Guardar y Aprovisionar'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
