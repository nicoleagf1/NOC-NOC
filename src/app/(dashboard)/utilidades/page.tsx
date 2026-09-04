"use client";

import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Wrench,
  Search,
  Plus,
  Terminal,
  Monitor,
  Apple,
  Copy,
  Check,
  XCircle,
  Filter,
  Trash2,
  Loader2
} from "lucide-react";
import { createPortal } from "react-dom";

export default function UtilidadesPage() {
  const [utilities, setUtilities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOs, setFilterOs] = useState("TODOS");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal de añadir
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newUtil, setNewUtil] = useState({
    title: "",
    description: "",
    os_type: "Linux",
    command: "",
    usage_instructions: ""
  });

  useEffect(() => {
    fetchUtilities();
  }, []);

  const fetchUtilities = async () => {
    try {
      const res = await fetch("/api/utilities");
      if (res.ok) {
        const json = await res.json();
        setUtilities(json.data || []);
      }
    } catch (e) {
      console.error("Error fetching utilities", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, command: string) => {
    navigator.clipboard.writeText(command);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar esta utilidad del catálogo?")) return;
    try {
      const res = await fetch(`/api/utilities/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setUtilities(utilities.filter(u => u.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddUtility = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/utilities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUtil)
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        setNewUtil({ title: "", description: "", os_type: "Linux", command: "", usage_instructions: "" });
        fetchUtilities();
      } else {
        alert("Error al guardar la utilidad");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUtilities = useMemo(() => {
    return utilities.filter(u => {
      const matchSearch = u.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.command.toLowerCase().includes(searchTerm.toLowerCase());
      const matchOs = filterOs === "TODOS" || u.os_type.toLowerCase() === filterOs.toLowerCase();
      return matchSearch && matchOs;
    });
  }, [utilities, searchTerm, filterOs]);

  const getOsIcon = (os: string) => {
    const o = os.toLowerCase();
    if (o.includes("windows")) return <Monitor className="w-4 h-4 mr-1 text-blue-500" />;
    if (o.includes("mac") || o.includes("apple")) return <Apple className="w-4 h-4 mr-1 text-gray-700" />;
    return <Terminal className="w-4 h-4 mr-1 text-orange-500" />; // Linux por defecto
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-barlow-condensed text-vepagos-navy uppercase tracking-wide flex items-center">
            <Wrench className="w-8 h-8 mr-3 text-vepagos-green" />
            Catálogo de Utilidades
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Biblioteca de comandos y runbooks frecuentes para tareas de administración. Copia y ejecuta en tu terminal local.
          </p>
        </div>
        
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-vepagos-green text-vepagos-navy hover:bg-[#00b36b] px-4 py-2 rounded-[var(--radius-pill)] text-sm font-bold transition-colors flex items-center shadow-lg shadow-vepagos-green/20"
        >
          <Plus className="w-4 h-4 mr-2" />
          Añadir Utilidad
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-[var(--radius-card)] p-4 border border-gray-100 shadow-sm flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text"
            placeholder="Buscar comando, descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-[var(--radius-input)] text-xs focus:outline-none focus:border-vepagos-green transition-colors"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select 
            value={filterOs}
            onChange={(e) => setFilterOs(e.target.value)}
            className="appearance-none bg-gray-50 border border-gray-200 rounded-[var(--radius-input)] px-4 py-2 text-xs font-bold text-vepagos-navy focus:outline-none focus:border-vepagos-green cursor-pointer"
          >
            <option value="TODOS">Todos los Sistemas</option>
            <option value="Linux">Linux</option>
            <option value="Windows">Windows</option>
            <option value="Mac">macOS</option>
          </select>
        </div>
      </div>

      {/* Grid de Comandos */}
      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-vepagos-green" />
        </div>
      ) : filteredUtilities.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-[var(--radius-card)] border border-gray-100">
          <Terminal className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-bold">No se encontraron utilidades que coincidan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUtilities.map(u => (
            <Card key={u.id} className="flex flex-col h-full bg-white border border-gray-100 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.1)] rounded-[var(--radius-card)] overflow-hidden group hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.15)] transition-all">
              <div className="p-5 border-b border-gray-50 flex-1">
                <div className="flex items-start justify-between mb-3">
                  <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 font-bold px-2 py-0.5 rounded-sm flex items-center">
                    {getOsIcon(u.os_type)}
                    {u.os_type.toUpperCase()}
                  </Badge>
                  <button 
                    onClick={() => handleDelete(u.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all p-1"
                    title="Eliminar utilidad"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="text-sm font-bold text-vepagos-navy mb-2">{u.title}</h3>
                <p className="text-xs text-gray-500 line-clamp-2">{u.description}</p>
                
                {u.usage_instructions && (
                  <div className="mt-4 pt-4 border-t border-dashed border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Uso sugerido:</p>
                    <p className="text-xs text-gray-600 italic">{u.usage_instructions}</p>
                  </div>
                )}
              </div>
              
              <div className="bg-gray-900 p-4 flex flex-col justify-between relative group/cmd">
                <div className="font-mono text-xs text-green-400 mb-6 break-all">
                  <span className="text-gray-500 mr-2">$</span>
                  {u.command}
                </div>
                
                <button 
                  onClick={() => handleCopy(u.id, u.command)}
                  className="absolute bottom-3 right-3 bg-white/10 hover:bg-white/20 text-white rounded p-1.5 transition-colors flex items-center backdrop-blur-sm"
                  title="Copiar Comando"
                >
                  {copiedId === u.id ? <Check className="w-4 h-4 text-vepagos-green" /> : <Copy className="w-4 h-4" />}
                  <span className="text-[10px] font-bold ml-1.5 uppercase">
                    {copiedId === u.id ? 'Copiado' : 'Copiar'}
                  </span>
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Add */}
      {isAddModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-vepagos-navy/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-lg bg-white overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] rounded-2xl border border-gray-100 flex flex-col animate-in zoom-in-95 duration-200">
            <form onSubmit={handleAddUtility}>
              <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-lg font-bold font-barlow-condensed text-vepagos-navy uppercase tracking-wide flex items-center">
                  <Plus className="w-5 h-5 mr-2 text-vepagos-green" />
                  Nueva Utilidad
                </h2>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-vepagos-navy uppercase tracking-widest mb-1">Título</label>
                    <input required type="text" value={newUtil.title} onChange={e => setNewUtil({...newUtil, title: e.target.value})} className="w-full border border-gray-200 rounded p-2 text-sm focus:outline-none focus:border-vepagos-green" placeholder="Ej. Limpiar Caché DNS" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-vepagos-navy uppercase tracking-widest mb-1">Descripción</label>
                    <input required type="text" value={newUtil.description} onChange={e => setNewUtil({...newUtil, description: e.target.value})} className="w-full border border-gray-200 rounded p-2 text-sm focus:outline-none focus:border-vepagos-green" placeholder="¿Para qué sirve este comando?" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-vepagos-navy uppercase tracking-widest mb-1">Sistema Operativo</label>
                    <select value={newUtil.os_type} onChange={e => setNewUtil({...newUtil, os_type: e.target.value})} className="w-full border border-gray-200 rounded p-2 text-sm focus:outline-none focus:border-vepagos-green bg-white">
                      <option value="Linux">Linux</option>
                      <option value="Windows">Windows</option>
                      <option value="Mac">macOS</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-vepagos-navy uppercase tracking-widest mb-1">Comando (Terminal)</label>
                    <textarea required value={newUtil.command} onChange={e => setNewUtil({...newUtil, command: e.target.value})} className="w-full border border-gray-200 rounded p-2 text-sm font-mono focus:outline-none focus:border-vepagos-green bg-gray-50 h-20" placeholder="sudo systemctl restart nginx"></textarea>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-vepagos-navy uppercase tracking-widest mb-1">Instrucciones de Uso (Opcional)</label>
                    <input type="text" value={newUtil.usage_instructions} onChange={e => setNewUtil({...newUtil, usage_instructions: e.target.value})} className="w-full border border-gray-200 rounded p-2 text-sm focus:outline-none focus:border-vepagos-green" placeholder="Ej. Ejecutar en PowerShell como admin" />
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 border border-gray-200 rounded text-xs font-bold text-gray-600 hover:bg-gray-100">
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-vepagos-green text-vepagos-navy rounded text-xs font-bold hover:bg-[#00b36b] flex items-center">
                  {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                  Guardar Comando
                </button>
              </div>
            </form>
          </Card>
        </div>, document.body
      )}
    </div>
  );
}
