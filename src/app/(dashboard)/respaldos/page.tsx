"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  HardDriveDownload,
  Play,
  Plus,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Database,
  Server,
  Settings,
  Trash2,
  Plug,
  FolderOpen,
  Calendar,
  Shield,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  Pencil,
  ChevronLeft,
} from "lucide-react";
import BackupJobModal from "@/components/backups/BackupJobModal";
import BackupHistoryDetailModal from "@/components/backups/BackupHistoryDetailModal";

import { BackupJob, BackupHistoryItem, BackupStats } from "@/types/backup";

const ENGINE_LABELS: Record<string, string> = {
  mssql: "Microsoft SQL Server",
  mysql: "MySQL Server",
  postgres: "PostgreSQL Server",
};

const ENGINE_COLORS: Record<string, string> = {
  mssql: "text-blue-600 bg-blue-50",
  mysql: "text-orange-600 bg-orange-50",
  postgres: "text-indigo-600 bg-indigo-50",
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return `${months[d.getMonth()]} ${d.getDate()}, ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr);
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return `${months[d.getMonth()]} ${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const DAY_LETTERS = ["D", "L", "M", "M", "J", "V", "S"];

function parseCronSchedule(cron?: string) {
  if (!cron) return { time: "--:--", days: [true, true, true, true, true, true, true] };
  const parts = cron.trim().split(/\s+/);
  const minute = parseInt(parts[0], 10) || 0;
  const hour = parseInt(parts[1], 10) || 0;
  const time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

  let days = [true, true, true, true, true, true, true];
  if (parts.length >= 5 && parts[4] !== "*") {
    days = [false, false, false, false, false, false, false];
    const dayTokens = parts[4].split(",");
    for (const token of dayTokens) {
      if (token.includes("-")) {
        const [start, end] = token.split("-").map((n) => parseInt(n, 10));
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = start; i <= end; i++) {
            if (i >= 0 && i <= 6) days[i] = true;
            if (i === 7) days[0] = true;
          }
        }
      } else {
        const num = parseInt(token, 10);
        if (num >= 0 && num <= 6) days[num] = true;
        if (num === 7) days[0] = true;
      }
    }
  }

  return { time, days };
}

export default function RespaldosPage() {
  const [jobs, setJobs] = useState<BackupJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [history, setHistory] = useState<BackupHistoryItem[]>([]);
  const [stats, setStats] = useState<BackupStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningJobs, setRunningJobs] = useState<Set<string>>(new Set());
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<BackupJob | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<BackupHistoryItem | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const HISTORY_PER_PAGE = 10;

  const selectedJobIdRef = useRef(selectedJobId);
  useEffect(() => {
    selectedJobIdRef.current = selectedJobId;
  }, [selectedJobId]);

  const selectedJob = jobs.find((j) => j.id === selectedJobId) || null;

  // ── Cargar Jobs ──
  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/backups/jobs");
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
        if (!selectedJobIdRef.current && data.length > 0) {
          setSelectedJobId(data[0].id);
        }
      }
    } catch (err) {
      console.error("Error cargando jobs:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Cargar historial del job seleccionado ──
  const fetchHistory = useCallback(async (jobId: string) => {
    try {
      const res = await fetch(`/api/backups/jobs/${jobId}/history?limit=30`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error("Error cargando historial:", err);
    }
  }, []);

  // ── Cargar estadísticas globales ──
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/backups/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Error cargando stats:", err);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    fetchStats();
  }, [fetchJobs, fetchStats]);

  useEffect(() => {
    if (selectedJobId) {
      fetchHistory(selectedJobId);
    }
  }, [selectedJobId, fetchHistory]);

  // ── Auto-refresco continuo e inteligente en tiempo real ──
  // - Cada 3 segundos si hay algún job ejecutándose (en runningJobs o con status RUNNING)
  // - Cada 8 segundos en reposo para detectar ejecuciones programadas (cron) sin recargar página
  useEffect(() => {
    const isAnyJobRunning =
      runningJobs.size > 0 ||
      jobs.some((j) => j.last_backup_status === "RUNNING");
    const intervalMs = isAnyJobRunning ? 3000 : 8000;

    const timer = setInterval(() => {
      const currentJobId = selectedJobIdRef.current;
      fetchJobs();
      fetchStats();
      if (currentJobId) {
        fetchHistory(currentJobId);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [runningJobs.size, jobs, fetchJobs, fetchStats, fetchHistory]);

  // ── Ejecutar backup (Run Now) ──
  const handleRunNow = async (jobId: string) => {
    setRunningJobs((prev) => new Set(prev).add(jobId));

    // Refrescar casi de inmediato para mostrar el badge RUNNING y spinner en el historial sin esperar el fin del dump
    setTimeout(() => {
      fetchJobs();
      if (selectedJobIdRef.current) fetchHistory(selectedJobIdRef.current);
    }, 400);

    try {
      const res = await fetch(`/api/backups/jobs/${jobId}/run`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        alert(`Error: ${data.error || "Fallo en la ejecución"}`);
      }
    } catch (err: any) {
      alert(`Error de red: ${err.message}`);
    } finally {
      setRunningJobs((prev) => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
      await Promise.all([
        fetchJobs(),
        fetchStats(),
        selectedJobIdRef.current ? fetchHistory(selectedJobIdRef.current) : Promise.resolve(),
      ]);
    }
  };

  // ── Test Connection ──
  const handleTestConnection = async (jobId: string) => {
    setTestingConnection(jobId);
    setTestResult(null);
    try {
      const res = await fetch(`/api/backups/jobs/${jobId}/test-connection`, { method: "POST" });
      const data = await res.json();
      setTestResult({
        success: data.success,
        message: data.success
          ? `${data.message} (${data.latencyMs}ms) - ${data.serverVersion || ""}`
          : data.error,
      });
    } catch (err: any) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setTestingConnection(null);
    }
  };

  // ── Eliminar Job ──
  const handleDeleteJob = async (jobId: string, jobName: string) => {
    if (!confirm(`¿Eliminar el trabajo "${jobName}" y todo su historial?`)) return;
    try {
      const res = await fetch(`/api/backups/jobs/${jobId}`, { method: "DELETE" });
      if (res.ok) {
        setSelectedJobId(null);
        setHistory([]);
        await Promise.all([fetchJobs(), fetchStats()]);
      }
    } catch (err: any) {
      alert(`Error eliminando: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="w-8 h-8 animate-spin text-vepagos-green" />
        <span className="ml-3 text-gray-500 font-barlow-condensed uppercase tracking-wide">
          Cargando módulo de respaldos...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <HardDriveDownload className="w-7 h-7 text-vepagos-green" />
          <div>
            <h1 className="text-2xl font-bold text-vepagos-navy font-barlow-condensed uppercase tracking-wide">
              Respaldos de Bases de Datos
            </h1>
            <p className="text-sm text-gray-500">
              Gestión centralizada de backups — Motor Agentless NOC-NOC
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Actualización en tiempo real</span>
          </div>
          <button
            onClick={async () => {
              setIsRefreshing(true);
              await Promise.all([
                fetchJobs(),
                fetchStats(),
                selectedJobId ? fetchHistory(selectedJobId) : Promise.resolve(),
              ]);
              setIsRefreshing(false);
            }}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-vepagos-green" : ""}`} />
            Actualizar
          </button>
          <button
            onClick={() => { setEditingJob(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-vepagos-green rounded-lg hover:bg-vepagos-green-deep transition-colors uppercase tracking-wide"
          >
            <Plus className="w-4 h-4" />
            Nuevo Job
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-barlow-condensed">Trabajos Activos</p>
            <p className="text-2xl font-bold text-vepagos-navy mt-1">{stats.activeJobs}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-barlow-condensed">Tasa de Éxito</p>
            <p className={`text-2xl font-bold mt-1 ${stats.successRate >= 95 ? "text-green-600" : stats.successRate >= 80 ? "text-yellow-600" : "text-red-600"}`}>
              {stats.successRate}%
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-barlow-condensed">Espacio Total</p>
            <p className="text-2xl font-bold text-vepagos-navy mt-1">{stats.totalBytesFormatted}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-barlow-condensed">Duración Promedio</p>
            <p className="text-2xl font-bold text-vepagos-navy mt-1">{stats.avgDurationSeconds}s</p>
          </div>
        </div>
      )}

      {/* ── Layout de 3 columnas ── */}
      <div className="grid grid-cols-12 gap-4 items-start">
        {/* ══ Columna 1: Lista de Jobs ══ */}
        <div className="col-span-3 bg-white rounded-xl border border-gray-200 overflow-hidden h-fit">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-bold text-vepagos-navy uppercase tracking-wide font-barlow-condensed">
              Trabajos ({jobs.length})
            </h2>
          </div>
          <div>
            {jobs.map((job) => {
              const isSelected = selectedJobId === job.id;
              const isRunning = runningJobs.has(job.id);
              return (
                <button
                  key={job.id}
                  onClick={() => { setSelectedJobId(job.id); setHistoryPage(1); }}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 transition-colors ${
                    isSelected ? "bg-vepagos-green/5 border-l-4 border-l-vepagos-green" : "hover:bg-gray-50 border-l-4 border-l-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isRunning ? (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-500 flex-shrink-0" />
                    ) : job.last_backup_status === "SUCCESS" ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    ) : job.last_backup_status === "FAILED" ? (
                      <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    )}
                    <span className={`text-sm font-semibold truncate ${isSelected ? "text-vepagos-navy" : "text-gray-700"}`}>
                      {job.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 ml-6 flex-wrap">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${ENGINE_COLORS[job.engine] || "text-gray-500 bg-gray-100"}`}>
                      {job.engine.toUpperCase()}
                    </span>
                    {(() => {
                      const { time, days } = parseCronSchedule(job.cron_schedule);
                      return (
                        <div
                          className="flex items-center gap-1.5 text-xs"
                          title={job.schedule_description || `Programado a las ${time}`}
                        >
                          <span className="font-mono text-[11px] font-semibold text-gray-700">
                            {time}
                          </span>
                          <span className="inline-flex items-center gap-0.5 font-mono text-[10px]">
                            {DAY_LETTERS.map((letter, idx) => (
                              <span
                                key={idx}
                                className={`px-0.5 rounded ${
                                  days[idx]
                                    ? "font-extrabold text-emerald-700 bg-emerald-50"
                                    : "text-gray-300 font-normal"
                                }`}
                              >
                                {letter}
                              </span>
                            ))}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                  {!job.is_active && (
                    <span className="text-[10px] text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded mt-1 ml-6 inline-block">
                      INACTIVO
                    </span>
                  )}
                </button>
              );
            })}
            {jobs.length === 0 && (
              <div className="p-6 text-center text-gray-400 text-sm">
                No hay trabajos configurados
              </div>
            )}
          </div>
        </div>

        {/* ══ Columna 2: Detalle del Job ══ */}
        <div className="col-span-5 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
          {selectedJob ? (
            <>
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <h2 className="text-sm font-bold text-vepagos-navy uppercase tracking-wide font-barlow-condensed">
                  {selectedJob.name}
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTestConnection(selectedJob.id)}
                    disabled={testingConnection === selectedJob.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                  >
                    {testingConnection === selectedJob.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plug className="w-3.5 h-3.5" />
                    )}
                    Test
                  </button>
                  <button
                    onClick={() => handleRunNow(selectedJob.id)}
                    disabled={runningJobs.has(selectedJob.id) || !selectedJob.is_active}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-vepagos-green rounded-lg hover:bg-vepagos-green-deep transition-colors disabled:opacity-50"
                  >
                    {runningJobs.has(selectedJob.id) ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5" />
                    )}
                    Ejecutar Ahora
                  </button>
                  <button
                    onClick={() => { setEditingJob(selectedJob); setIsModalOpen(true); }}
                    className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors"
                    title="Editar trabajo"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteJob(selectedJob.id, selectedJob.name)}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    title="Eliminar trabajo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Test Connection Result */}
              {testResult && (
                <div className={`mx-5 mt-3 p-3 rounded-lg text-xs ${testResult.success ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                  <div className="flex items-center gap-2">
                    {testResult.success ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    <span className="font-medium">{testResult.message}</span>
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* Conexión Origen */}
                <div className="border border-gray-100 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Database className="w-4 h-4 text-gray-500" />
                    <h3 className="text-xs font-bold text-vepagos-navy uppercase tracking-wide font-barlow-condensed">
                      Conexión Origen
                    </h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Motor:</span>
                      <span className={`font-medium px-2 py-0.5 rounded ${ENGINE_COLORS[selectedJob.engine]}`}>
                        {ENGINE_LABELS[selectedJob.engine]}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Servidor:</span>
                      <span className="text-gray-800 font-mono text-xs">{selectedJob.host}:{selectedJob.port}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Base de datos:</span>
                      <span className="text-gray-800 font-semibold">{selectedJob.database_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Usuario:</span>
                      <span className="text-gray-800 font-mono text-xs">{selectedJob.db_username}</span>
                    </div>
                    {selectedJob.use_ssh_tunnel && (
                      <>
                        <div className="border-t border-dashed border-gray-200 pt-2 mt-2">
                          <div className="flex items-center gap-1 mb-1">
                            <Shield className="w-3.5 h-3.5 text-green-600" />
                            <span className="text-xs font-bold text-green-700 uppercase">Túnel SSH Activo</span>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Host SSH:</span>
                          <span className="text-gray-800 font-mono text-xs">{selectedJob.ssh_host}:{selectedJob.ssh_port}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Usuario SSH:</span>
                          <span className="text-gray-800 font-mono text-xs">{selectedJob.ssh_username}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Destino de Almacenamiento */}
                <div className="border border-gray-100 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FolderOpen className="w-4 h-4 text-gray-500" />
                    <h3 className="text-xs font-bold text-vepagos-navy uppercase tracking-wide font-barlow-condensed">
                      Destino de Almacenamiento
                    </h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tipo:</span>
                      <span className="text-gray-800 uppercase font-medium">{selectedJob.destination_type}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-gray-500">Ruta:</span>
                      <span className="text-gray-800 font-mono text-xs bg-gray-50 px-2 py-1 rounded break-all">
                        {selectedJob.destination_path}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Retención:</span>
                      <span className="text-gray-800 font-medium">Últimos {selectedJob.retention_days} días</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Compresión:</span>
                      <span className="text-gray-800 uppercase font-medium">{selectedJob.compression_format}</span>
                    </div>
                  </div>
                </div>

                {/* Programación */}
                <div className="border border-gray-100 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <h3 className="text-xs font-bold text-vepagos-navy uppercase tracking-wide font-barlow-condensed">
                      Programación
                    </h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Estado:</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${selectedJob.is_active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                        {selectedJob.is_active ? "ACTIVO" : "INACTIVO"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Horario:</span>
                      <span className="text-gray-800 font-medium">{selectedJob.schedule_description || selectedJob.cron_schedule}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Cron:</span>
                      <span className="text-gray-800 font-mono text-xs bg-gray-50 px-2 py-0.5 rounded">{selectedJob.cron_schedule}</span>
                    </div>
                  </div>
                </div>

                {/* Notificaciones */}
                <div className="border border-gray-100 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-gray-500" />
                    <h3 className="text-xs font-bold text-vepagos-navy uppercase tracking-wide font-barlow-condensed">
                      Notificaciones
                    </h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Alertar NOC en falla:</span>
                      <span className={`font-medium ${selectedJob.send_alert_on_failure ? "text-green-600" : "text-gray-400"}`}>
                        {selectedJob.send_alert_on_failure ? "Sí" : "No"}
                      </span>
                    </div>
                    {selectedJob.notification_email && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Email:</span>
                        <span className="text-gray-800 text-xs">{selectedJob.notification_email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Database className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">Selecciona un trabajo para ver los detalles</p>
              </div>
            </div>
          )}
        </div>

        {/* ══ Columna 3: Historial de Ejecuciones ══ */}
        <div className="col-span-4 bg-white rounded-xl border border-gray-200 overflow-hidden h-fit">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div>
              <h2 className="text-sm font-bold text-vepagos-navy uppercase tracking-wide font-barlow-condensed">
                Historial & Restauración
              </h2>
              <p className="text-[10px] text-gray-400">Clic en un registro para ver detalle</p>
            </div>
            {selectedJob && (
              <span className="text-[11px] text-gray-400 font-mono">{history.length} registros</span>
            )}
          </div>
          <div>
            {selectedJob ? (
              history.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {history.slice((historyPage - 1) * HISTORY_PER_PAGE, historyPage * HISTORY_PER_PAGE).map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedHistoryItem(item)}
                      title="Haz clic para ver el detalle y diagnóstico completo"
                      className="px-4 py-2.5 flex items-center justify-between hover:bg-emerald-50/40 active:bg-emerald-100/40 cursor-pointer transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {item.status === "SUCCESS" ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : item.status === "FAILED" ? (
                          <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        ) : (
                          <Loader2 className="w-4 h-4 animate-spin text-amber-500 flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-xs text-gray-700 font-medium group-hover:text-vepagos-navy transition-colors">
                            {formatDate(item.started_at)}
                          </p>
                          {item.file_name && (
                            <p className="text-[10px] text-gray-500 font-mono truncate max-w-[170px]" title={item.file_name}>
                              {item.file_name}
                            </p>
                          )}
                          {item.error_message && (
                            <p className="text-[10px] text-red-500 truncate max-w-[200px]" title={item.error_message}>
                              {item.error_message}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-right flex-shrink-0">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          item.status === "SUCCESS"
                            ? "text-green-700 bg-green-50"
                            : item.status === "FAILED"
                            ? "text-red-700 bg-red-50"
                            : "text-amber-700 bg-amber-50 animate-pulse"
                        }`}>
                          {item.status === "RUNNING" ? "EN EJECUCIÓN" : item.backup_type}
                        </span>
                        {item.file_size_formatted && (
                          <span className="text-xs text-gray-500 font-mono min-w-[65px] text-right">
                            {item.file_size_formatted}
                          </span>
                        )}
                        {item.duration_seconds !== undefined && item.duration_seconds !== null && (
                          <span className="text-[10px] text-gray-400 min-w-[30px] text-right">
                            {item.duration_seconds}s
                          </span>
                        )}
                        <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-vepagos-green group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center p-8 text-gray-400">
                  <div className="text-center">
                    <Clock className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">Sin historial de ejecuciones</p>
                    <p className="text-xs mt-1">Ejecuta el trabajo para generar el primer registro</p>
                  </div>
                </div>
              )
            ) : (
              <div className="flex-1 flex items-center justify-center p-8 text-gray-400">
                <div className="text-center">
                  <Clock className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">Selecciona un trabajo</p>
                </div>
              </div>
            )}
          </div>
          {/* Paginación del historial */}
          {selectedJob && history.length > HISTORY_PER_PAGE && (() => {
            const totalPages = Math.ceil(history.length / HISTORY_PER_PAGE);
            return (
              <div className="border-t border-gray-100 px-4 py-2 flex items-center justify-between bg-gray-50/50">
                <button
                  onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                  disabled={historyPage === 1}
                  className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                <span className="text-[11px] text-gray-500">
                  Página {historyPage} de {totalPages}
                </span>
                <button
                  onClick={() => setHistoryPage(p => Math.min(totalPages, p + 1))}
                  disabled={historyPage === totalPages}
                  className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            );
          })()}
          {/* Resumen del job seleccionado */}
          {selectedJob && history.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase">Total</p>
                  <p className="text-sm font-bold text-vepagos-navy">{history.length}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase">Exitosos</p>
                  <p className="text-sm font-bold text-green-600">{history.filter((h) => h.status === "SUCCESS").length}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase">Fallidos</p>
                  <p className="text-sm font-bold text-red-600">{history.filter((h) => h.status === "FAILED").length}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal Crear / Editar Job ── */}
      <BackupJobModal
        isOpen={isModalOpen}
        editingJob={editingJob}
        onClose={() => { setIsModalOpen(false); setEditingJob(null); }}
        onSaved={async () => {
          await Promise.all([fetchJobs(), fetchStats()]);
          if (selectedJobId) fetchHistory(selectedJobId);
          // Recargar scheduler para que aplique los cambios de cron
          try { await fetch("/api/backups/scheduler", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "reload" }) }); } catch {}
        }}
      />

      {/* ── Modal Detalle de Reporte / Diagnóstico de Fallo ── */}
      <BackupHistoryDetailModal
        isOpen={!!selectedHistoryItem}
        item={selectedHistoryItem}
        job={selectedJob}
        onClose={() => setSelectedHistoryItem(null)}
      />
    </div>
  );
}
