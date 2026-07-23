import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2, Server, Terminal, Copy, CheckCircle2, AlertCircle, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function HostsTab() {
  const [hosts, setHosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHost, setEditingHost] = useState<any>(null);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  useEffect(() => {
    fetchHosts();
  }, []);

  const fetchHosts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/hosts");
      if (res.ok) setHosts(await res.json());
    } catch (e) {
      console.error("Error fetching hosts", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const isNew = !editingHost?.id;
      const url = isNew ? "/api/hosts" : `/api/hosts/${editingHost.id}`;
      const method = isNew ? "POST" : "PUT";
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingHost)
      });
      
      if (res.ok) {
        fetchHosts();
        // Mantenemos modal abierto si es nuevo para mostrar el snippet
        if (!isNew) setIsModalOpen(false);
        else setEditingHost(await res.json()); // actualiza con el ID
      } else {
        const data = await res.json();
        alert(data.error || "Error al guardar");
      }
    } catch (e) {
      console.error("Error saving host", e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este host? Prometheus dejará de monitorearlo.")) return;
    try {
      const res = await fetch(`/api/hosts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchHosts();
        setIsModalOpen(false);
      }
    } catch (e) {
      console.error("Error deleting", e);
    }
  };

  const copySnippet = () => {
    navigator.clipboard.writeText(`curl -sSL https://noc-noc.local/install-node-exporter.sh | bash`);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="pt-4">
      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h3 className="text-sm font-bold text-vepagos-navy uppercase tracking-wider">Inventario de Servidores (Hosts)</h3>
            <p className="text-xs text-gray-500">Service Discovery activado. Prometheus actualizará automáticamente sus targets basados en este inventario.</p>
          </div>
          <Button size="sm" className="bg-vepagos-navy text-white text-xs uppercase font-bold" onClick={() => { setEditingHost({ environment: 'PROD', is_monitored: true, os_type: 'Linux' }); setIsModalOpen(true); }}>
            <Plus className="w-4 h-4 mr-1" /> Añadir Host
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-white text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                <th className="px-6 py-4">Hostname / IP</th>
                <th className="px-6 py-4">Entorno</th>
                <th className="px-6 py-4">Sistema Operativo</th>
                <th className="px-6 py-4">Monitoreo</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {isLoading ? (
                <tr><td colSpan={5} className="p-6 text-center text-gray-500 text-xs">Cargando hosts...</td></tr>
              ) : hosts.length === 0 ? (
                <tr><td colSpan={5} className="p-6 text-center text-gray-500 text-xs">No hay servidores registrados.</td></tr>
              ) : hosts.map(host => (
                <tr key={host.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <Server className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <div className="font-bold text-vepagos-navy">{host.hostname}</div>
                        <div className="text-xs text-gray-500">{host.ip_address}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={host.environment === 'PROD' ? 'default' : 'secondary'} className="text-[10px] uppercase font-bold tracking-wider">
                      {host.environment}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">{host.os_type}</td>
                  <td className="px-6 py-4">
                    {host.is_monitored ? (
                      <span className="flex items-center text-[10px] font-bold text-green-600"><CheckCircle2 className="w-3 h-3 mr-1" /> ACTIVO</span>
                    ) : (
                      <span className="flex items-center text-[10px] font-bold text-gray-400"><AlertCircle className="w-3 h-3 mr-1" /> INACTIVO</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-vepagos-navy" onClick={() => { setEditingHost(host); setIsModalOpen(true); }}>
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
      {isModalOpen && editingHost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md bg-white overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold font-barlow-condensed text-vepagos-navy uppercase tracking-wide">
                {editingHost.id ? 'Editar Host' : 'Añadir Host'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Hostname</label>
                  <input type="text" className="w-full text-sm border border-gray-200 rounded-md p-2" value={editingHost.hostname || ''} onChange={e => setEditingHost({...editingHost, hostname: e.target.value})} placeholder="srv-web-01" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Dirección IP</label>
                  <input type="text" className="w-full text-sm border border-gray-200 rounded-md p-2" value={editingHost.ip_address || ''} onChange={e => setEditingHost({...editingHost, ip_address: e.target.value})} placeholder="10.0.0.10" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Entorno</label>
                  <select className="w-full text-sm border border-gray-200 rounded-md p-2 bg-gray-50" value={editingHost.environment || 'PROD'} onChange={e => setEditingHost({...editingHost, environment: e.target.value})}>
                    <option value="PROD">PROD (Producción)</option>
                    <option value="STG">STG (Staging)</option>
                    <option value="DEV">DEV (Desarrollo)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Sistema Operativo</label>
                  <input type="text" className="w-full text-sm border border-gray-200 rounded-md p-2" value={editingHost.os_type || ''} onChange={e => setEditingHost({...editingHost, os_type: e.target.value})} placeholder="Ubuntu 22.04" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Descripción</label>
                <textarea className="w-full text-sm border border-gray-200 rounded-md p-2" rows={2} value={editingHost.description || ''} onChange={e => setEditingHost({...editingHost, description: e.target.value})} />
              </div>

              <div className="flex items-center mt-2">
                <input type="checkbox" id="is_monitored" checked={editingHost.is_monitored} onChange={e => setEditingHost({...editingHost, is_monitored: e.target.checked})} className="mr-2" />
                <label htmlFor="is_monitored" className="text-xs font-bold text-vepagos-navy">Monitorear activamente este host</label>
              </div>

              {editingHost.id && (
                <div className="mt-4 p-3 border border-indigo-100 bg-indigo-50 rounded-md">
                  <div className="flex items-center text-indigo-800 text-xs font-bold mb-2">
                    <Terminal className="w-4 h-4 mr-1" /> Auto-instalación de Agente (Node Exporter)
                  </div>
                  <div className="flex items-center justify-between bg-black text-green-400 font-mono text-[10px] p-2 rounded">
                    <span className="truncate mr-2">curl -sSL https://noc-noc.local/install-node-exporter.sh | bash</span>
                    <button onClick={copySnippet} className="text-gray-400 hover:text-white p-1">
                      {copiedSnippet ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-indigo-600 mt-2">Ejecuta este comando en el servidor destino para comenzar a enviar métricas automáticamente.</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-2">
              {editingHost.id && (
                <Button variant="destructive" className="flex-1" onClick={() => handleDelete(editingHost.id!)}>
                  Eliminar
                </Button>
              )}
              <Button 
                className={`flex-[2] bg-vepagos-green text-vepagos-navy hover:bg-[#00b36b]`}
                onClick={handleSave}
                disabled={!editingHost.hostname || !editingHost.ip_address}
              >
                Guardar Host
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
