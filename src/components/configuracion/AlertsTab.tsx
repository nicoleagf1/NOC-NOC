"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, ShieldAlert, Loader2, Edit2, X, Save, Activity, Network, HardDrive, CheckCircle2 } from "lucide-react";

export function AlertsTab() {
  const [rules, setRules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [reloadStatus, setReloadStatus] = useState<boolean | null>(null);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/alerts/rules");
      if (res.ok) {
        const data = await res.json();
        setRules(data.rules || []);
      }
    } catch (e) {
      console.error("Error fetching rules", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/alerts/rules`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updates: { isActive: !currentActive } })
      });
      if (res.ok) {
        const data = await res.json();
        setRules(data.rules);
        setReloadStatus(data.reloaded);
      }
    } catch (e) {
      console.error("Error toggling rule", e);
    }
  };

  const handleSaveRule = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/alerts/rules`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: editingRule.id, 
          updates: { 
            expr: editingRule.expr,
            forDuration: editingRule.forDuration,
            severity: editingRule.severity
          } 
        })
      });
      if (res.ok) {
        const data = await res.json();
        setRules(data.rules);
        setReloadStatus(data.reloaded);
        setIsEditModalOpen(false);
      } else {
        alert("Error al guardar la regla");
      }
    } catch (e) {
      console.error("Error saving rule", e);
    } finally {
      setIsSaving(false);
    }
  };

  const openEditModal = (rule: any) => {
    setEditingRule({ ...rule });
    setIsEditModalOpen(true);
  };

  const getCategoryIcon = (category: string) => {
    switch(category) {
      case 'Disponibilidad': return <Activity className="w-5 h-5 text-blue-500" />;
      case 'Saturación': return <HardDrive className="w-5 h-5 text-orange-500" />;
      case 'Seguridad y Red': return <Network className="w-5 h-5 text-purple-500" />;
      default: return <ShieldAlert className="w-5 h-5 text-vepagos-green" />;
    }
  };

  return (
    <div className="pt-4 space-y-6">
      
      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-100">
        <div>
          <h2 className="text-lg font-bold text-vepagos-navy uppercase font-barlow-condensed tracking-wide flex items-center">
            <ShieldAlert className="w-5 h-5 mr-2 text-vepagos-green" />
            Motor de Reglas de Alerta
          </h2>
          <p className="text-xs text-gray-500">Configura los umbrales críticos de evaluación para Prometheus. Los cambios aplican en tiempo real.</p>
        </div>
        
        {reloadStatus !== null && (
          <div className={`px-3 py-1.5 rounded-md text-xs font-bold border flex items-center ${reloadStatus ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
            {reloadStatus ? <CheckCircle2 className="w-4 h-4 mr-1" /> : <AlertCircle className="w-4 h-4 mr-1" />}
            {reloadStatus ? 'Prometheus Sincronizado' : 'Fallo Reload de Prometheus'}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-12 flex justify-center items-center">
            <Loader2 className="w-8 h-8 text-vepagos-green animate-spin" />
          </div>
        ) : rules.map(rule => (
          <Card key={rule.id} className="p-5 flex flex-col relative overflow-hidden group hover:border-vepagos-green/50 transition-colors">
            <div className="absolute top-0 right-0 p-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={rule.isActive} 
                  onChange={() => handleToggleActive(rule.id, rule.isActive)} 
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-vepagos-green"></div>
              </label>
            </div>
            
            <div className="flex items-center mb-3 pr-12">
              <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center mr-3">
                {getCategoryIcon(rule.category)}
              </div>
              <div>
                <h3 className="text-sm font-bold text-vepagos-navy">{rule.name}</h3>
                <Badge variant={rule.severity === 'critical' ? 'destructive' : 'warning'} className="text-[9px] uppercase mt-0.5 px-1 py-0 shadow-none border-0">
                  {rule.severity}
                </Badge>
              </div>
            </div>
            
            <p className="text-xs text-gray-500 mb-4 flex-1">
              {rule.description}
            </p>

            <div className="space-y-3 mt-auto bg-gray-50/50 p-3 rounded-lg border border-gray-100">
              <div>
                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Expresión (PromQL)</div>
                <div className="text-[11px] font-mono text-gray-700 bg-white border border-gray-200 rounded px-2 py-1.5 mt-1 truncate" title={rule.expr}>
                  {rule.expr}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Duración (FOR)</div>
                  <div className="text-xs font-bold text-vepagos-navy">{rule.forDuration}</div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-7 text-[10px] font-bold uppercase tracking-wider text-vepagos-navy hover:text-vepagos-green border-gray-200"
                  onClick={() => openEditModal(rule)}
                >
                  <Edit2 className="w-3 h-3 mr-1" /> Editar
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* MODAL EDITAR REGLA */}
      {isEditModalOpen && editingRule && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-vepagos-navy/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-lg bg-white overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] rounded-2xl border border-gray-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
              <div>
                <h2 className="text-lg font-bold font-barlow-condensed text-vepagos-navy uppercase tracking-wide">
                  Editar Umbrales: {editingRule.name}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">{editingRule.category} • {editingRule.description}</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 bg-white p-1.5 rounded-md border border-gray-200">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-5 space-y-5 overflow-y-auto">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Severidad de la Alerta</label>
                <select 
                  className="w-full text-sm border border-gray-200 rounded-lg p-2.5 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-vepagos-green outline-none"
                  value={editingRule.severity}
                  onChange={e => setEditingRule({...editingRule, severity: e.target.value})}
                >
                  <option value="critical">Crítica (Critical)</option>
                  <option value="warning">Advertencia (Warning)</option>
                  <option value="info">Informativa (Info)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                  <span>Expresión de Evaluación (PromQL)</span>
                  <span className="text-xs text-orange-500 font-normal normal-case tracking-normal">¡Modificar con precaución!</span>
                </label>
                <textarea 
                  className="w-full text-sm font-mono border border-gray-200 rounded-lg p-3 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-vepagos-green outline-none min-h-[100px]"
                  value={editingRule.expr}
                  onChange={e => setEditingRule({...editingRule, expr: e.target.value})}
                />
                <p className="text-[10px] text-gray-500 mt-1.5 leading-relaxed">
                  Aquí defines la lógica que dispara la alerta. Los operadores relacionales (`&gt;`, `&lt;`) determinan el umbral (porcentaje, bytes, etc). 
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Tiempo de Tolerancia (FOR)</label>
                <input 
                  type="text" 
                  className="w-full text-sm border border-gray-200 rounded-lg p-2.5 bg-gray-50 focus:bg-white font-mono"
                  value={editingRule.forDuration}
                  onChange={e => setEditingRule({...editingRule, forDuration: e.target.value})}
                  placeholder="ej. 5m, 1h, 30s"
                />
                <p className="text-[10px] text-gray-500 mt-1">Tiempo que debe cumplirse la condición continuamente para disparar la alerta (ej: 5m, 1m, 30s).</p>
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 bg-gray-50 flex gap-3 rounded-b-2xl">
              <Button variant="outline" className="flex-1" onClick={() => setIsEditModalOpen(false)} disabled={isSaving}>
                Cancelar
              </Button>
              <Button 
                className="flex-[2] bg-vepagos-green text-vepagos-navy hover:bg-[#00b36b] font-bold tracking-wide"
                onClick={handleSaveRule}
                disabled={isSaving || !editingRule.expr || !editingRule.forDuration}
              >
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Guardar y Recargar Prometheus
              </Button>
            </div>
          </Card>
        </div>, document.body
      )}
    </div>
  );
}
