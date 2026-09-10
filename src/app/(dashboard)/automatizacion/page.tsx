"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Workflow, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  RotateCw, 
  Send, 
  ShieldCheck, 
  Zap, 
  Server, 
  Terminal, 
  Layers, 
  Clock, 
  Radio, 
  ArrowRight,
  Code2,
  Copy,
  Check,
  HelpCircle,
  X,
  BookOpen,
  Info
} from "lucide-react";

interface N8nStatus {
  configured: boolean;
  isActive: boolean;
  name?: string;
  url?: string;
  authType?: string;
  isOnline?: boolean;
  latencyMs?: number;
  statusCode?: number;
  message?: string;
  lastChecked?: string;
}

interface WorkflowItem {
  id: string;
  name: string;
  active: boolean;
  tags?: string[];
  updatedAt?: string;
}

export default function AutomatizacionPage() {
  const [status, setStatus] = useState<N8nStatus | null>(null);
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [wfError, setWfError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Estados del Simulador de Incidentes
  const [simScenario, setSimScenario] = useState("fw-down");
  const [simTarget, setSimTarget] = useState("https://192.168.0.1:10443");
  const [simMode, setSimMode] = useState<'test' | 'prod'>('test');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simResult, setSimResult] = useState<any | null>(null);
  const [copiedPayload, setCopiedPayload] = useState(false);

  // Estado del Modal de Ayuda Webhook
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [copiedWebhookUrl, setCopiedWebhookUrl] = useState(false);
  const [copiedTelegramTpl, setCopiedTelegramTpl] = useState(false);

  // Escenarios predefinidos de simulación
  const SCENARIOS: Record<string, { severity: string; trigger: string; detail: string; defaultTarget: string; eventType: 'firing' | 'resolved' }> = {
    "fw-down": {
      severity: "CRITICAL",
      trigger: "ServiceUnreachable",
      detail: "Fallo en sondeo HTTP de administración de Firewall en puerto 10443",
      defaultTarget: "https://192.168.0.1:10443",
      eventType: "firing"
    },
    "cpu-high": {
      severity: "WARNING",
      trigger: "HighCPUUsage",
      detail: "Uso de CPU al 94.8% durante más de 5 minutos consecutivos",
      defaultTarget: "srv-prod-db-01:9100",
      eventType: "firing"
    },
    "mem-limit": {
      severity: "CRITICAL",
      trigger: "HighMemoryUsage",
      detail: "Memoria RAM libre inferior al 5% (Riesgo inminente de OOM Killer)",
      defaultTarget: "192.168.0.110:9100",
      eventType: "firing"
    },
    "service-resolved": {
      severity: "INFO",
      trigger: "ServiceUnreachable",
      detail: "Autorecuperación confirmada: el servicio responde con normalidad",
      defaultTarget: "https://192.168.0.1:10443",
      eventType: "resolved"
    }
  };

  const loadAllData = async () => {
    try {
      // 1. Estado de la conexión
      const statusRes = await fetch('/api/automation/status');
      const statusJson = await statusRes.json();
      setStatus(statusJson);

      // 2. Si está configurado y online, traer workflows
      if (statusJson.configured && statusJson.isActive) {
        const wfRes = await fetch('/api/automation/workflows');
        const wfJson = await wfRes.json();
        if (wfJson.success && Array.isArray(wfJson.workflows)) {
          setWorkflows(wfJson.workflows);
          setWfError(null);
        } else if (wfJson.error) {
          setWfError(wfJson.error);
        }
      }
    } catch (err) {
      console.error('Error al cargar datos de n8n:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadAllData();
  };

  const handleScenarioChange = (key: string) => {
    setSimScenario(key);
    const selected = SCENARIOS[key];
    if (selected) {
      setSimTarget(selected.defaultTarget);
    }
  };

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    setSimResult(null);
    try {
      const selected = SCENARIOS[simScenario];
      const res = await fetch('/api/automation/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: selected.eventType,
          serviceName: simTarget,
          metricTrigger: selected.trigger,
          severity: selected.severity,
          technicalDetail: selected.detail,
          isTestWebhook: simMode === 'test'
        })
      });
      const data = await res.json();
      setSimResult(data);
    } catch (err: any) {
      setSimResult({
        success: false,
        message: err.message || 'Error al ejecutar simulación'
      });
    } finally {
      setIsSimulating(false);
    }
  };

  const handleCopySample = (obj: any) => {
    navigator.clipboard.writeText(JSON.stringify(obj, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <RotateCw className="w-8 h-8 text-vepagos-green animate-spin" />
        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest font-barlow-condensed">
          Consultando telemetría de n8n...
        </p>
      </div>
    );
  }

  // =========================================================================
  // CASO: n8n NO CONFIGURADO O INACTIVO
  // =========================================================================
  if (!status?.configured || !status?.isActive) {
    return (
      <div className="space-y-6 pb-12 animate-in fade-in duration-300">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-barlow-condensed text-vepagos-navy uppercase tracking-wide">
            Automatización y Orquestación
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Motor de respuesta a incidentes, auto-remediación y despacho inteligente de alertas (SOAR).
          </p>
        </div>

        {/* Empty State Banner */}
        <Card className="p-8 border-2 border-dashed border-gray-200 text-center max-w-3xl mx-auto space-y-6">
          <div className="w-20 h-20 bg-rose-50 text-[#EA4B71] rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <Workflow className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-vepagos-navy uppercase tracking-wide">
              {status?.configured ? 'Integración con n8n Desactivada' : 'n8n no está configurado'}
            </h2>
            <p className="text-xs text-gray-500 max-w-lg mx-auto leading-relaxed">
              {status?.configured 
                ? 'La integración con n8n se encuentra registrada pero está inactiva. Actívala en el panel de configuración para habilitar el despacho de eventos y runbooks.'
                : 'Conecta tu instancia de n8n para orquestar notificaciones automáticas por Telegram, WhatsApp o Slack, ejecutar runbooks de recuperación y sincronizar tickets con GLPI o Jira.'}
            </p>
          </div>

          {/* Tres Pilares */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left pt-2">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                <Send className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-vepagos-navy uppercase mb-1">Notificaciones</h3>
              <p className="text-[11px] text-gray-500">Enruta alertas hacia Telegram, WhatsApp, Slack o SMS según la severidad.</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-vepagos-navy uppercase mb-1">Auto-Remediación</h3>
              <p className="text-[11px] text-gray-500">Dispara runbooks para reiniciar servicios caídos o limpiar almacenamiento.</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center mb-3">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-vepagos-navy uppercase mb-1">Ticketing ITSM</h3>
              <p className="text-[11px] text-gray-500">Crea y cierra tickets automáticamente en GLPI, Jira o ServiceNow.</p>
            </div>
          </div>

          <div className="pt-2">
            <Link href="/configuracion">
              <Button className="bg-vepagos-green text-vepagos-navy hover:bg-[#00b36b] font-bold px-6 py-2.5 rounded-full text-xs uppercase tracking-wide">
                Ir a Configuración para Activar n8n
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // =========================================================================
  // CASO: n8n ACTIVO Y OPERATIVO
  // =========================================================================
  const isOnline = status.isOnline;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header y Acciones */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold font-barlow-condensed text-vepagos-navy uppercase tracking-wide">
              Automatización y Orquestación
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-[#EA4B71] border border-[#EA4B71]/30 uppercase">
              n8n SOAR
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Telemetría del motor de automatización, catálogo de runbooks y despacho de incidentes.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setIsHelpModalOpen(true)}
            className="flex items-center border border-indigo-200 bg-indigo-50/80 text-indigo-700 hover:bg-indigo-100/90 px-4 py-2 h-[34px] rounded-full text-xs font-bold transition-colors shadow-sm"
            title="Aprende cómo configurar el nodo Webhook en n8n paso a paso"
          >
            <HelpCircle className="w-3.5 h-3.5 mr-2 text-indigo-600" />
            GUÍA WEBHOOK N8N
          </button>

          {status.url && (
            <a 
              href={status.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center border border-gray-200 text-vepagos-navy hover:bg-gray-50 px-4 py-2 h-[34px] rounded-full text-xs font-bold transition-colors shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-2 text-[#EA4B71]" />
              ABRIR CONSOLA N8N
            </a>
          )}
          <button 
            onClick={handleRefresh}
            className="flex items-center border border-vepagos-green text-vepagos-green hover:bg-vepagos-green/5 px-4 py-2 h-[34px] rounded-full text-xs font-bold transition-colors"
          >
            <RotateCw className={`w-3.5 h-3.5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            ACTUALIZAR
          </button>
        </div>
      </div>

      {/* Row 1: Cuatro KPIs de Telemetría */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Estado del Motor */}
        <Card className="p-5 border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Estado del Motor</span>
            <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-barlow-condensed ${isOnline ? 'text-emerald-600' : 'text-red-500'}`}>
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
            {isOnline && status.latencyMs !== undefined && (
              <span className="text-xs text-gray-400 font-mono">({status.latencyMs}ms)</span>
            )}
          </div>
          <p className="text-[11px] text-gray-500 mt-1 truncate">
            {status.message || (isOnline ? 'Instancia respondiendo al sondeo' : 'Sin respuesta')}
          </p>
        </Card>

        {/* KPI 2: Instancia y Host */}
        <Card className="p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Instancia Vinculada</span>
            <Server className="w-4 h-4 text-gray-400" />
          </div>
          <div className="mt-3">
            <div className="text-sm font-bold text-vepagos-navy truncate" title={status.url}>
              {status.url || 'No definido'}
            </div>
            <p className="text-[11px] text-gray-400 mt-1 uppercase font-bold">
              Autenticación: <span className="text-vepagos-navy font-mono">{status.authType || 'none'}</span>
            </p>
          </div>
        </Card>

        {/* KPI 3: Workflows en n8n */}
        <Card className="p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Workflows en n8n</span>
            <Workflow className="w-4 h-4 text-[#EA4B71]" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-barlow-condensed text-vepagos-navy">
              {workflows.length}
            </span>
            <span className="text-xs text-gray-400 font-bold uppercase">Disponibles</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            {workflows.filter(w => w.active).length} flujos con trigger activo
          </p>
        </Card>

        {/* KPI 4: Modo de Despacho */}
        <Card className="p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Modo Operativo</span>
            <Radio className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-barlow-condensed text-vepagos-navy">
              ACTIVO
            </span>
            <Badge variant="success" className="text-[9px]">24/7</Badge>
          </div>
          <p className="text-[11px] text-gray-500 mt-1 truncate">
            Webhook: Prometheus & Uptime
          </p>
        </Card>
      </div>

      {/* Row 2: Matriz de Enrutamiento & Simulador */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Col 1: Matriz de Enrutamiento de Alertas */}
        <Card className="p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-vepagos-green" />
                <h2 className="text-sm font-bold text-vepagos-navy uppercase tracking-wider">
                  Matriz de Enrutamiento de Eventos
                </h2>
              </div>
              <Badge variant="default" className="text-[10px] font-mono text-gray-500">
                POST /webhook/noc-noc-incident
              </Badge>
            </div>

            <p className="text-xs text-gray-500 mt-3 leading-relaxed">
              NOC-NOC transmite de forma asíncrona todos los eventos de incidentes hacia el Webhook Trigger de tu n8n con el payload estructurado:
            </p>

            {/* Diagrama de Flujo Visual */}
            <div className="mt-4 space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10px]">
                    PROM
                  </div>
                  <div>
                    <div className="font-bold text-vepagos-navy uppercase">Alertas Prometheus</div>
                    <div className="text-[10px] text-gray-500">CPU, Memoria, Interfaces Fortigate, Caídas</div>
                  </div>
                </div>
                <Badge variant="success" className="text-[10px]">ENRUTADO</Badge>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-[10px]">
                    KUMA
                  </div>
                  <div>
                    <div className="font-bold text-vepagos-navy uppercase">Alertas Uptime Kuma</div>
                    <div className="text-[10px] text-gray-500">Disponibilidad de Servicios Web y Pings</div>
                  </div>
                </div>
                <Badge variant="success" className="text-[10px]">ENRUTADO</Badge>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[10px]">
                    RESOLV
                  </div>
                  <div>
                    <div className="font-bold text-vepagos-navy uppercase">Autorecuperación (Resolved)</div>
                    <div className="text-[10px] text-gray-500">Cierre automático de incidentes y tickets</div>
                  </div>
                </div>
                <Badge variant="success" className="text-[10px]">ENRUTADO</Badge>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[11px] text-gray-400">Payload compatible con nodos Webhook de n8n</span>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7 border-gray-200"
              onClick={() => handleCopySample({
                eventType: "firing",
                incidentId: "prom-ServiceUnreachable-192.168.0.1",
                serviceName: "https://192.168.0.1:10443",
                metricTrigger: "ServiceUnreachable",
                severity: "CRITICAL",
                technicalDetail: "Fallo en sondeo HTTP",
                timestamp: new Date().toISOString()
              })}
            >
              {copiedPayload ? <Check className="w-3 h-3 mr-1 text-vepagos-green" /> : <Copy className="w-3 h-3 mr-1 text-gray-400" />}
              {copiedPayload ? '¡Copiado!' : 'Copiar Ejemplo JSON'}
            </Button>
          </div>
        </Card>

        {/* Col 2: Simulador de Incidentes en Vivo */}
        <Card className="p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-[#EA4B71]" />
                <h2 className="text-sm font-bold text-vepagos-navy uppercase tracking-wider">
                  Simulador de Incidentes (Sandbox)
                </h2>
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Test en Vivo</span>
            </div>

            <p className="text-xs text-gray-500 mt-3 leading-relaxed">
              Dispara una alerta simulada hacia n8n para validar que tus flujos de Telegram, WhatsApp o correo reciban el mensaje sin esperar una falla real:
            </p>

            <div className="space-y-3 mt-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                  Escenario de Prueba
                </label>
                <select
                  value={simScenario}
                  onChange={e => handleScenarioChange(e.target.value)}
                  className="w-full text-xs font-bold text-vepagos-navy border border-gray-200 rounded-md p-2 bg-gray-50 focus:outline-none focus:border-vepagos-green"
                >
                  <option value="fw-down">🔴 Caída de Firewall (ServiceUnreachable - Crítico)</option>
                  <option value="cpu-high">🟡 Uso de CPU al 95% (HighCPUUsage - Advertencia)</option>
                  <option value="mem-limit">🔴 Memoria RAM al Límite (HighMemoryUsage - Crítico)</option>
                  <option value="service-resolved">🟢 Autorecuperación de Servicio (Resolved - Informativo)</option>
                </select>
              </div>

              {/* Modo de Webhook: Test o Producción */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Ruta Webhook Destino
                  </label>
                  <span className="text-[10px] font-mono font-bold text-indigo-600">
                    {simMode === 'test' ? 'Para "Listen for test event"' : 'Para workflow "Active"'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setSimMode('test')}
                    className={`py-1.5 px-2 rounded-md text-[11px] font-bold transition-all text-center ${
                      simMode === 'test' 
                        ? 'bg-white text-indigo-700 shadow-sm border border-gray-200' 
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                    title="Usa esto cuando estés dentro del editor de n8n con el botón 'Listen for test event' activo"
                  >
                    🧪 /webhook-test/... (Editor)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimMode('prod')}
                    className={`py-1.5 px-2 rounded-md text-[11px] font-bold transition-all text-center ${
                      simMode === 'prod' 
                        ? 'bg-white text-emerald-700 shadow-sm border border-gray-200' 
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                    title="Usa esto para workflows que ya estén guardados y en estado 'Active'"
                  >
                    🚀 /webhook/... (Producción)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                  Host / Target Afectado
                </label>
                <input
                  type="text"
                  value={simTarget}
                  onChange={e => setSimTarget(e.target.value)}
                  className="w-full text-xs font-mono text-vepagos-navy border border-gray-200 rounded-md p-2 bg-white focus:outline-none focus:border-vepagos-green"
                  placeholder="ej. srv-prod-db-01 o https://192.168.0.1:10443"
                />
              </div>

              <div className="pt-1">
                <Button
                  onClick={handleRunSimulation}
                  disabled={isSimulating}
                  className="w-full bg-[#EA4B71] text-white hover:bg-[#d63d60] font-bold text-xs uppercase tracking-wide h-9 rounded-md transition-colors"
                >
                  <Send className={`w-3.5 h-3.5 mr-2 ${isSimulating ? 'animate-spin' : ''}`} />
                  {isSimulating ? 'Transmitiendo a n8n...' : `Disparar Evento a ${simMode === 'test' ? 'n8n Test' : 'n8n Prod'}`}
                </Button>
              </div>
            </div>

            {/* Resultado del simulador */}
            {simResult && (
              <div className={`mt-4 p-3 rounded-lg border text-xs font-mono break-all ${
                simResult.success 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold uppercase">
                    {simResult.success ? '✅ Entrega Exitosa' : '❌ Fallo en Entrega'}
                  </span>
                  {simResult.latencyMs !== undefined && (
                    <span className="text-[10px] font-normal">{simResult.latencyMs}ms</span>
                  )}
                </div>
                <div className="text-[11px] leading-relaxed">
                  {simResult.message}
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 text-[10px] text-gray-400 flex items-center justify-between">
            <span>Webhook objetivo:</span>
            <code className="font-mono text-gray-600 font-bold">
              {status?.url ? `${status.url.replace(/\/+$/, '')}/${simMode === 'test' ? 'webhook-test' : 'webhook'}/noc-noc-incident` : ''}
            </code>
          </div>
        </Card>
      </div>

      {/* Row 3: Catálogo de Workflows Registrados en n8n */}
      <Card className="p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <Code2 className="w-4 h-4 text-vepagos-navy" />
            <h2 className="text-sm font-bold text-vepagos-navy uppercase tracking-wider">
              Catálogo de Flujos y Runbooks (n8n API)
            </h2>
          </div>
          <Badge variant="default" className="text-[10px] font-mono">
            {workflows.length} workflows detectados
          </Badge>
        </div>

        {workflows.length === 0 ? (
          <div className="py-8 text-center space-y-3">
            <Workflow className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="text-xs font-bold text-vepagos-navy uppercase tracking-wide">
              {wfError ? 'API de n8n no accesible para listar flujos' : 'No se encontraron workflows con la API Key actual'}
            </p>
            {wfError ? (
              <div className="max-w-xl mx-auto p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-left space-y-1.5 text-amber-900 text-[11px]">
                <div className="flex items-center font-bold text-amber-950 uppercase tracking-wide text-[10px]">
                  <AlertCircle className="w-4 h-4 mr-1.5 text-amber-600 flex-shrink-0" />
                  Ruta /api/* interceptada por Proxy Zero-Trust (Pangolin)
                </div>
                <p className="leading-relaxed">
                  Tus alertas por Webhook están operando con éxito. Sin embargo, para leer la lista de workflows en este catálogo, n8n requiere que la ruta <code className="font-mono font-bold bg-white px-1.5 py-0.5 border border-amber-300 rounded text-amber-950">/api/*</code> esté configurada como <b>Ruta Pública (Bypass / Whitelist)</b> en tu proxy <b>Pangolin (pholidota.vepagos.com)</b>.
                </p>
                <div className="pt-1 text-[10px] text-amber-700">
                  <b>Paso a seguir:</b> En Pangolin &gt; Recurso n8n, añade <code className="bg-white px-1 rounded font-bold">/api/*</code> y <code className="bg-white px-1 rounded font-bold">/healthz</code> a las excepciones públicas.
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-gray-400 max-w-md mx-auto">
                Para listar tus workflows en este panel, asegúrate de haber configurado una <b>API Key con permisos de lectura</b> en <i>Configuración &gt; Integraciones &gt; n8n</i>.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {workflows.map(wf => (
              <div 
                key={wf.id}
                className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex flex-col justify-between hover:border-gray-200 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono text-gray-400 truncate">ID: {wf.id}</span>
                    <Badge variant={wf.active ? "success" : "default"} className="text-[9px]">
                      {wf.active ? 'ACTIVO' : 'INACTIVO'}
                    </Badge>
                  </div>
                  <h3 className="text-xs font-bold text-vepagos-navy uppercase tracking-wide line-clamp-2">
                    {wf.name}
                  </h3>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-200/60 flex items-center justify-between">
                  <div className="flex gap-1 flex-wrap">
                    {wf.tags && wf.tags.length > 0 ? (
                      wf.tags.slice(0, 2).map((t, i) => (
                        <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-white text-gray-500 border border-gray-200">
                          {t}
                        </span>
                      ))
                    ) : (
                      <span className="text-[9px] text-gray-400 italic">Sin etiquetas</span>
                    )}
                  </div>

                  {status.url && (
                    <a
                      href={`${status.url}/workflow/${wf.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold text-[#EA4B71] hover:underline flex items-center"
                    >
                      Editar en n8n
                      <ExternalLink className="w-2.5 h-2.5 ml-1" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ========================================================================= */}
      {/* MODAL: GUÍA PASO A PASO PARA CREAR EL WEBHOOK EN N8N                     */}
      {/* ========================================================================= */}
      {isHelpModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-3xl bg-white shadow-2xl rounded-2xl border-0 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header del Modal */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#EA4B71] flex items-center justify-center border border-rose-100">
                  <Workflow className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-vepagos-navy uppercase tracking-wide">
                    Cómo Configurar el Webhook en n8n
                  </h3>
                  <p className="text-xs text-gray-500">
                    Guía de integración para recibir incidentes de NOC-NOC y activar notificaciones o runbooks.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsHelpModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido Scrollable */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-gray-600">
              {/* URL Destino Dinámica */}
              <div className="p-4 bg-gradient-to-r from-rose-50/70 to-indigo-50/70 border border-rose-100/80 rounded-xl">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    URL Objetivo para tu Nodo Webhook
                  </span>
                  <Badge variant="default" className="text-[9px] bg-[#EA4B71] text-white">
                    MÉTODO POST
                  </Badge>
                </div>
                <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-2 font-mono text-[11px] text-vepagos-navy">
                  <span className="truncate mr-2">
                    {status.url ? `${status.url.replace(/\/+$/, '')}/webhook/noc-noc-incident` : 'http://<tu-instancia-n8n>:5678/webhook/noc-noc-incident'}
                  </span>
                  <button
                    onClick={() => {
                      const urlToCopy = status.url ? `${status.url.replace(/\/+$/, '')}/webhook/noc-noc-incident` : 'http://localhost:5678/webhook/noc-noc-incident';
                      navigator.clipboard.writeText(urlToCopy);
                      setCopiedWebhookUrl(true);
                      setTimeout(() => setCopiedWebhookUrl(false), 2000);
                    }}
                    className="flex items-center text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded flex-shrink-0 transition-colors"
                  >
                    {copiedWebhookUrl ? <Check className="w-3 h-3 mr-1 text-vepagos-green" /> : <Copy className="w-3 h-3 mr-1" />}
                    {copiedWebhookUrl ? '¡Copiado!' : 'Copiar URL'}
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-1.5">
                  NOC-NOC envía automáticamente todas las alertas a la ruta <code className="text-gray-600">/webhook/noc-noc-incident</code> de tu servidor n8n.
                </p>
              </div>

              {/* 4 Pasos Clave */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-vepagos-navy uppercase tracking-wider flex items-center">
                  <BookOpen className="w-4 h-4 mr-1.5 text-vepagos-green" />
                  Pasos para Crear el Flujo en n8n
                </h4>

                {/* Paso 1 */}
                <div className="flex space-x-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="w-6 h-6 rounded-full bg-vepagos-navy text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                    1
                  </div>
                  <div>
                    <div className="font-bold text-vepagos-navy uppercase mb-0.5">Crear un Nuevo Workflow</div>
                    <p className="text-gray-500 leading-relaxed">
                      En la consola de tu n8n, haz clic en el botón superior derecho <b>"Add workflow"</b> (o el botón <span className="font-mono bg-white px-1 border rounded">+</span>).
                    </p>
                  </div>
                </div>

                {/* Paso 2 */}
                <div className="flex space-x-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="w-6 h-6 rounded-full bg-vepagos-navy text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                    2
                  </div>
                  <div>
                    <div className="font-bold text-vepagos-navy uppercase mb-0.5">Agregar el Trigger "Webhook"</div>
                    <p className="text-gray-500 leading-relaxed">
                      Presiona <b>"Add first step"</b> y busca el nodo <b>"Webhook"</b>. Configúralo con los siguientes parámetros exactos:
                    </p>
                    <ul className="mt-2 space-y-1 font-mono text-[11px] bg-white p-2.5 rounded-lg border border-gray-200">
                      <li>• <b>HTTP Method:</b> <span className="text-[#EA4B71] font-bold">POST</span></li>
                      <li>• <b>Path:</b> <span className="text-indigo-600 font-bold">noc-noc-incident</span></li>
                      <li>• <b>Authentication:</b> <span className="text-indigo-700 font-bold">Header Auth</span> (Recomendado) o <span className="text-gray-500">None</span></li>
                      <li>• <b>Header Name:</b> <span className="text-vepagos-navy font-bold">X-NOC-TOKEN</span> (o <code>X-N8N-API-KEY</code>)</li>
                      <li>• <b>Header Value:</b> <span className="text-emerald-700 font-bold">Tu API Key o secreto configurado en NOC-NOC</span></li>
                      <li>• <b>Respond:</b> <span className="text-emerald-600 font-bold">Immediately</span> (Response Code: 200)</li>
                    </ul>
                    <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded text-[10px] text-emerald-800 flex items-start space-x-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 mt-0.5 text-emerald-600 flex-shrink-0" />
                      <span><b>Blindaje de Seguridad (SEC-NET-02):</b> Configurar <i>Header Auth</i> con tu API Key garantiza que nadie desde Internet pueda inyectar mensajes en tu bot de Telegram a través del bypass público de Pangolin.</span>
                    </div>
                  </div>
                </div>

                {/* Paso 3 */}
                <div className="flex space-x-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="w-6 h-6 rounded-full bg-vepagos-navy text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                    3
                  </div>
                  <div className="w-full">
                    <div className="font-bold text-vepagos-navy uppercase mb-0.5">Conectar Nodos de Acción (Telegram / WhatsApp / Email)</div>
                    <p className="text-gray-500 leading-relaxed">
                      Conecta la salida del nodo Webhook hacia tu bot de Telegram. En n8n, los datos de un webhook POST se reciben dentro de <code className="text-indigo-600 font-bold font-mono">{"$json.body"}</code>:
                    </p>
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5 font-mono text-[10px]">
                      <div className="p-2 bg-white border border-gray-200 rounded">
                        <span className="text-gray-400 block font-sans">Activo / Host:</span>
                        <code className="text-vepagos-navy font-bold">{"{{ $json.body?.serviceName || $json.serviceName }}"}</code>
                      </div>
                      <div className="p-2 bg-white border border-gray-200 rounded">
                        <span className="text-gray-400 block font-sans">Severidad:</span>
                        <code className="text-rose-600 font-bold">{"{{ $json.body?.severity || $json.severity }}"}</code>
                      </div>
                      <div className="p-2 bg-white border border-gray-200 rounded">
                        <span className="text-gray-400 block font-sans">Métrica Disparadora:</span>
                        <code className="text-indigo-600 font-bold">{"{{ $json.body?.metricTrigger || $json.metricTrigger }}"}</code>
                      </div>
                      <div className="p-2 bg-white border border-gray-200 rounded">
                        <span className="text-gray-400 block font-sans">Estado del Incidente:</span>
                        <code className="text-emerald-600 font-bold">{"{{ $json.body?.eventType || $json.eventType }}"}</code>
                      </div>
                      <div className="p-2 bg-white border border-gray-200 rounded sm:col-span-2">
                        <span className="text-gray-400 block font-sans">Detalle Técnico:</span>
                        <code className="text-gray-700 font-bold">{"{{ $json.body?.technicalDetail || $json.technicalDetail }}"}</code>
                      </div>
                    </div>

                    {/* Plantilla Lista para Telegram */}
                    <div className="mt-3 p-3 bg-blue-50/60 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wide">
                          Plantilla Definitiva para Telegram (Campo "Text")
                        </span>
                        <button
                          onClick={() => {
                            const tpl = `🚨 *ALERTA NOC-NOC: {{ $json.body?.severity || $json.severity }}*\n📍 *Servicio:* {{ $json.body?.serviceName || $json.serviceName }}\n⚠️ *Métrica:* {{ $json.body?.metricTrigger || $json.metricTrigger }}\n📝 *Detalle:* {{ $json.body?.technicalDetail || $json.technicalDetail }}\n🕒 *Fecha:* {{ $json.body?.timestamp || $json.timestamp }}`;
                            navigator.clipboard.writeText(tpl);
                            setCopiedTelegramTpl(true);
                            setTimeout(() => setCopiedTelegramTpl(false), 2000);
                          }}
                          className="flex items-center text-[10px] font-bold text-blue-700 hover:text-blue-900 bg-white px-2 py-0.5 rounded border border-blue-200 transition-colors shadow-sm"
                        >
                          {copiedTelegramTpl ? <Check className="w-3 h-3 mr-1 text-vepagos-green" /> : <Copy className="w-3 h-3 mr-1" />}
                          {copiedTelegramTpl ? '¡Copiado!' : 'Copiar Plantilla'}
                        </button>
                      </div>
                      <pre className="text-[10px] font-mono bg-white p-2.5 rounded border border-blue-100 text-blue-950 whitespace-pre-wrap leading-relaxed">
{`🚨 *ALERTA NOC-NOC: {{ $json.body?.severity || $json.severity }}*
📍 *Servicio:* {{ $json.body?.serviceName || $json.serviceName }}
⚠️ *Métrica:* {{ $json.body?.metricTrigger || $json.metricTrigger }}
📝 *Detalle:* {{ $json.body?.technicalDetail || $json.technicalDetail }}
🕒 *Fecha:* {{ $json.body?.timestamp || $json.timestamp }}`}
                      </pre>
                      <p className="text-[10px] text-blue-700 mt-1.5 font-medium">
                        💡 <b>¿Por qué con <code className="bg-white px-1 border rounded">.body.</code>?</b> n8n coloca el contenido JSON del webhook dentro del contenedor <code className="font-bold">body</code>. Usar <code className="font-bold">.body?.campo || .campo</code> garantiza que siempre se extraiga el dato real.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Paso 4 */}
                <div className="flex space-x-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="w-6 h-6 rounded-full bg-vepagos-navy text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                    4
                  </div>
                  <div>
                    <div className="font-bold text-vepagos-navy uppercase mb-0.5">Activar el Workflow (Production)</div>
                    <p className="text-gray-500 leading-relaxed">
                      Asegúrate de cambiar el interruptor superior del workflow de <b>Inactive</b> a <b className="text-emerald-600">Active</b> en n8n para que escuche en modo de producción permanente con la ruta <code className="text-emerald-700 font-mono">/webhook/noc-noc-incident</code>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Advertencia Crítica de Infraestructura: Proxy Zero-Trust / Pangolin */}
              <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl space-y-1.5 text-amber-900">
                <div className="flex items-center space-x-2 font-bold text-xs text-amber-800 uppercase tracking-wide">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>Requisito de Infraestructura: Proxy Zero-Trust (Pangolin / Pholidota)</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  Tu servidor n8n está protegido por el proxy Zero-Trust <b>Pangolin (pholidota.vepagos.com)</b>. Para que NOC-NOC (o cualquier servicio externo) pueda entregar webhooks sin ser redirigido al login humano de SSO (HTTP 302), debes configurar en Pangolin una regla de <b>Rutas Públicas (Bypass / Whitelist)</b> para:
                </p>
                <div className="font-mono text-[10px] bg-white p-2 rounded border border-amber-200 space-y-0.5 text-amber-950 font-bold">
                  <div>• <code>/webhook/*</code> (Ruta de producción para workflows activos)</div>
                  <div>• <code>/webhook-test/*</code> (Ruta de pruebas para "Listen for test event")</div>
                </div>
              </div>

              {/* Ejemplo Payload JSON */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Ejemplo del JSON que envía NOC-NOC
                  </span>
                  <button
                    onClick={() => handleCopySample({
                      eventType: "firing",
                      incidentId: "prom-ServiceUnreachable-192.168.0.1",
                      serviceId: "prom-ServiceUnreachable-https://192.168.0.1:10443",
                      serviceName: "https://192.168.0.1:10443",
                      metricTrigger: "ServiceUnreachable",
                      severity: "CRITICAL",
                      technicalDetail: "Fallo en sondeo HTTP de administración de Firewall",
                      timestamp: new Date().toISOString()
                    })}
                    className="flex items-center text-[10px] text-gray-500 hover:text-vepagos-navy font-bold transition-colors"
                  >
                    {copiedPayload ? <Check className="w-3 h-3 mr-1 text-vepagos-green" /> : <Copy className="w-3 h-3 mr-1" />}
                    {copiedPayload ? '¡Copiado!' : 'Copiar JSON'}
                  </button>
                </div>
                <pre className="p-3 bg-gray-900 text-gray-100 rounded-lg text-[10px] font-mono overflow-x-auto border border-gray-800 leading-relaxed">
{`{
  "eventType": "firing",           // "firing" (alerta activa) o "resolved" (normalizado)
  "incidentId": "prom-ServiceUnreachable-192.168.0.1",
  "serviceId": "prom-ServiceUnreachable-https://192.168.0.1:10443",
  "serviceName": "https://192.168.0.1:10443",
  "metricTrigger": "ServiceUnreachable",
  "severity": "CRITICAL",          // "CRITICAL", "WARNING", "INFO"
  "technicalDetail": "Fallo en sondeo HTTP de administración de Firewall",
  "timestamp": "2026-09-09T15:20:00.000Z"
}`}
                </pre>
              </div>

              {/* Tip Pro de Infraestructura */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start space-x-2 text-emerald-800">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-600" />
                <p className="text-[11px] leading-relaxed">
                  <b>Tip Pro para Ingenieros:</b> Para capturar el esquema en n8n por primera vez, haz clic en <i>"Listen for test event"</i> en n8n, ven al Simulador de Incidentes de NOC-NOC, selecciona la pestaña <b>🧪 /webhook-test/... (Editor)</b> y presiona <i>"Disparar Evento"</i>.
                </p>
              </div>
            </div>

            {/* Footer del Modal */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsHelpModalOpen(false)}
                className="text-xs font-bold uppercase"
              >
                Cerrar
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setIsHelpModalOpen(false);
                  setTimeout(() => {
                    const simSection = document.querySelector('input[placeholder*="srv-prod-db-01"]');
                    if (simSection) simSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }, 150);
                }}
                className="bg-[#EA4B71] text-white hover:bg-[#d63d60] text-xs font-bold uppercase tracking-wide"
              >
                <Terminal className="w-3.5 h-3.5 mr-1.5" />
                Probar en el Simulador
              </Button>
            </div>
          </Card>
        </div>,
        document.body
      )}
    </div>
  );
}
