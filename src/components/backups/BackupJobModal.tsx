"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Card } from "@/components/ui/card";
import {
  X,
  XCircle,
  Database,
  Server,
  Shield,
  FolderOpen,
  Calendar,
  Bell,
  Save,
  Loader2,
  Eye,
  EyeOff,
  Search,
  CheckSquare,
  Square,
  Edit2,
  Plus,
} from "lucide-react";

interface JobFormData {
  name: string;
  engine: string;
  is_active: boolean;
  host: string;
  port: number;
  database_name: string;
  db_username: string;
  db_password: string;
  use_ssh_tunnel: boolean;
  ssh_host: string;
  ssh_port: number;
  ssh_username: string;
  ssh_password: string;
  destination_type: string;
  destination_path: string;
  // Schedule fields
  schedule_hour: number;
  schedule_minute: number;
  schedule_days: boolean[];  // [dom, lun, mar, mié, jue, vie, sáb]
  schedule_description: string;
  retention_days: number;
  compression_format: string;
  send_alert_on_failure: boolean;
  notification_email: string;
}

const DEFAULT_FORM: JobFormData = {
  name: "",
  engine: "postgres",
  is_active: true,
  host: "",
  port: 5432,
  database_name: "",
  db_username: "",
  db_password: "",
  use_ssh_tunnel: false,
  ssh_host: "",
  ssh_port: 22,
  ssh_username: "",
  ssh_password: "",
  destination_type: "nas",
  destination_path: "",
  schedule_hour: 1,
  schedule_minute: 0,
  schedule_days: [true, true, true, true, true, true, true], // todos los días
  schedule_description: "",
  retention_days: 30,
  compression_format: "gzip",
  send_alert_on_failure: true,
  notification_email: "",
};

const ENGINE_OPTIONS = [
  { value: "mssql", label: "Microsoft SQL Server", defaultPort: 1433 },
  { value: "mysql", label: "MySQL Server", defaultPort: 3306 },
  { value: "postgres", label: "PostgreSQL Server", defaultPort: 5432 },
];

const DAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DAY_CRON_MAP = [0, 1, 2, 3, 4, 5, 6]; // domingo=0 ... sábado=6

function buildCronExpression(hour: number, minute: number, days: boolean[]): string {
  const allSelected = days.every(d => d);
  if (allSelected) {
    return `${minute} ${hour} * * *`;
  }
  const selectedDays = days
    .map((selected, idx) => selected ? DAY_CRON_MAP[idx] : null)
    .filter(d => d !== null);
  if (selectedDays.length === 0) {
    return `${minute} ${hour} * * *`; // fallback a todos los días
  }
  return `${minute} ${hour} * * ${selectedDays.join(",")}`;
}

function parseCronExpression(cron: string): { hour: number; minute: number; days: boolean[] } {
  const parts = cron.trim().split(/\s+/);
  const minute = parseInt(parts[0]) || 0;
  const hour = parseInt(parts[1]) || 0;
  let days = [true, true, true, true, true, true, true];

  if (parts.length >= 5 && parts[4] !== "*") {
    days = [false, false, false, false, false, false, false];
    const dayParts = parts[4].split(",");
    for (const d of dayParts) {
      const num = parseInt(d);
      if (num >= 0 && num <= 6) {
        days[num] = true;
      }
    }
  }

  return { hour, minute, days };
}

function buildScheduleDescription(hour: number, minute: number, days: boolean[]): string {
  const timeStr = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  const allSelected = days.every(d => d);
  if (allSelected) {
    return `Diario a las ${timeStr}`;
  }
  const weekdaysOnly = !days[0] && days[1] && days[2] && days[3] && days[4] && days[5] && !days[6];
  if (weekdaysOnly) {
    return `Lun-Vie a las ${timeStr}`;
  }
  const selectedNames = days.map((sel, i) => sel ? DAY_LABELS[i] : null).filter(Boolean);
  return `${selectedNames.join(", ")} a las ${timeStr}`;
}

interface BackupJobModalProps {
  isOpen: boolean;
  editingJob: any | null; // null = crear nuevo
  onClose: () => void;
  onSaved: () => void;
}

export default function BackupJobModal({ isOpen, editingJob, onClose, onSaved }: BackupJobModalProps) {
  const [form, setForm] = useState<JobFormData>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDbPassword, setShowDbPassword] = useState(false);
  const [showSshPassword, setShowSshPassword] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [discoveredDatabases, setDiscoveredDatabases] = useState<string[]>([]);
  const [showDiscoverPanel, setShowDiscoverPanel] = useState(false);
  const [showSystemDbs, setShowSystemDbs] = useState(false);

  const isEditing = !!editingJob;

  // Cargar datos del job al editar
  useEffect(() => {
    if (editingJob) {
      const { hour, minute, days } = parseCronExpression(editingJob.cron_schedule || "0 1 * * *");
      setForm({
        name: editingJob.name || "",
        engine: editingJob.engine || "postgres",
        is_active: editingJob.is_active ?? true,
        host: editingJob.host || "",
        port: editingJob.port || 5432,
        database_name: editingJob.database_name || "",
        db_username: editingJob.db_username || "",
        db_password: "", // nunca se recibe la contraseña real
        use_ssh_tunnel: editingJob.use_ssh_tunnel || false,
        ssh_host: editingJob.ssh_host || "",
        ssh_port: editingJob.ssh_port || 22,
        ssh_username: editingJob.ssh_username || "",
        ssh_password: "",
        destination_type: editingJob.destination_type || "nas",
        destination_path: editingJob.destination_path || "",
        schedule_hour: hour,
        schedule_minute: minute,
        schedule_days: days,
        schedule_description: editingJob.schedule_description || "",
        retention_days: editingJob.retention_days || 30,
        compression_format: editingJob.compression_format || "gzip",
        send_alert_on_failure: editingJob.send_alert_on_failure ?? true,
        notification_email: editingJob.notification_email || "",
      });
    } else {
      setForm(DEFAULT_FORM);
    }
    setError(null);
    setShowDbPassword(false);
    setShowSshPassword(false);
    setDiscoveredDatabases([]);
    setShowDiscoverPanel(false);
    setShowSystemDbs(false);
  }, [editingJob, isOpen]);

  const updateField = (field: keyof JobFormData, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // ── Descubrir bases de datos del servidor ──
  const handleDiscoverDatabases = async () => {
    if (!form.host.trim() || !form.db_username.trim()) {
      setError("Ingresa el servidor y el usuario antes de descubrir bases de datos");
      return;
    }
    // Para nuevo job, la contraseña es obligatoria; para edición, la API lee de la BD
    const passwordToUse = form.db_password.trim();
    if (!passwordToUse && !isEditing) {
      setError("Ingresa la contraseña de la BD para descubrir");
      return;
    }

    setDiscovering(true);
    setError(null);

    try {
      const payload: any = {
        engine: form.engine,
        host: form.host.trim(),
        port: form.port,
        db_username: form.db_username.trim(),
        db_password: passwordToUse,
        show_system_databases: showSystemDbs,
        use_ssh_tunnel: form.use_ssh_tunnel,
      };
      // En modo edición, enviar el job_id para que la API lea contraseñas de la BD
      if (isEditing && editingJob?.id) {
        payload.job_id = editingJob.id;
      }
      if (form.use_ssh_tunnel) {
        payload.ssh_host = form.ssh_host.trim();
        payload.ssh_port = form.ssh_port;
        payload.ssh_username = form.ssh_username.trim();
        payload.ssh_password = form.ssh_password.trim();
      }

      const res = await fetch("/api/backups/discover-databases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setDiscoveredDatabases(data.databases);
        setShowDiscoverPanel(true);
      } else {
        setError(`Error al descubrir: ${data.error}`);
      }
    } catch (err: any) {
      setError(`Error de conexión: ${err.message}`);
    } finally {
      setDiscovering(false);
    }
  };

  const toggleDay = (idx: number) => {
    const newDays = [...form.schedule_days];
    newDays[idx] = !newDays[idx];
    // No permitir que todos estén deseleccionados
    if (newDays.every(d => !d)) return;
    updateField("schedule_days", newDays);
  };

  const selectWeekdays = () => {
    updateField("schedule_days", [false, true, true, true, true, true, false]);
  };

  const selectAllDays = () => {
    updateField("schedule_days", [true, true, true, true, true, true, true]);
  };

  const handleEngineChange = (engine: string) => {
    const opt = ENGINE_OPTIONS.find(e => e.value === engine);
    setForm(prev => ({
      ...prev,
      engine,
      port: opt?.defaultPort || prev.port,
    }));
  };

  const handleSubmit = async () => {
    // Validación básica
    if (!form.name.trim()) { setError("El nombre del trabajo es obligatorio"); return; }
    if (!form.host.trim()) { setError("El servidor (host) es obligatorio"); return; }
    if (!form.database_name.trim()) { setError("El nombre de la base de datos es obligatorio"); return; }
    if (!form.db_username.trim()) { setError("El usuario de la BD es obligatorio"); return; }
    if (!isEditing && !form.db_password.trim()) { setError("La contraseña de la BD es obligatoria"); return; }
    if (!form.destination_path.trim()) { setError("La ruta de destino es obligatoria"); return; }
    if (form.use_ssh_tunnel) {
      if (!form.ssh_host.trim()) { setError("El host SSH es obligatorio"); return; }
      if (!form.ssh_username.trim()) { setError("El usuario SSH es obligatorio"); return; }
      if (!isEditing && !form.ssh_password.trim()) { setError("La contraseña SSH es obligatoria"); return; }
    }

    setSaving(true);
    setError(null);

    const cronExpression = buildCronExpression(form.schedule_hour, form.schedule_minute, form.schedule_days);
    const scheduleDesc = buildScheduleDescription(form.schedule_hour, form.schedule_minute, form.schedule_days);

    const payload: any = {
      name: form.name.trim(),
      engine: form.engine,
      is_active: form.is_active,
      host: form.host.trim(),
      port: form.port,
      database_name: form.database_name.trim(),
      db_username: form.db_username.trim(),
      destination_type: form.destination_type,
      destination_path: form.destination_path.trim(),
      cron_schedule: cronExpression,
      schedule_description: scheduleDesc,
      retention_days: form.retention_days,
      compression_format: form.compression_format,
      send_alert_on_failure: form.send_alert_on_failure,
      notification_email: form.notification_email.trim() || null,
      use_ssh_tunnel: form.use_ssh_tunnel,
    };

    // Solo enviar contraseñas si se proporcionaron (edición: vacío = mantener la existente)
    if (form.db_password.trim()) {
      payload.db_password = form.db_password;
    } else if (isEditing) {
      payload.db_password = "••••••••"; // enviar máscara = backend conserva la original
    }

    if (form.use_ssh_tunnel) {
      payload.ssh_host = form.ssh_host.trim();
      payload.ssh_port = form.ssh_port;
      payload.ssh_username = form.ssh_username.trim();
      if (form.ssh_password.trim()) {
        payload.ssh_password = form.ssh_password;
      } else if (isEditing) {
        payload.ssh_password = "••••••••";
      }
    }

    try {
      const url = isEditing
        ? `/api/backups/jobs/${editingJob.id}`
        : "/api/backups/jobs";

      const res = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Error HTTP ${res.status}`);
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || typeof document === 'undefined') return null;

  const cronPreview = buildCronExpression(form.schedule_hour, form.schedule_minute, form.schedule_days);
  const schedulePreview = buildScheduleDescription(form.schedule_hour, form.schedule_minute, form.schedule_days);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-vepagos-navy/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-xl bg-white overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] rounded-2xl border border-gray-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h2 className="text-lg font-bold font-barlow-condensed text-vepagos-navy uppercase tracking-wide flex items-center">
              {isEditing ? <Edit2 className="w-5 h-5 mr-2 text-vepagos-green" /> : <Plus className="w-5 h-5 mr-2 text-vepagos-green" />}
              {isEditing ? "Editar Trabajo de Respaldo" : "Nuevo Trabajo de Respaldo"}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {isEditing ? `Editando: ${editingJob.name}` : "Configura los parámetros del backup"}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* ── Nombre y Motor ── */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                Nombre del Trabajo *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={e => updateField("name", e.target.value)}
                placeholder='Ej: "3.1 NOC-NOC (PostgreSQL)"'
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-vepagos-green/50 focus:border-vepagos-green outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                Motor de BD *
              </label>
              <select
                value={form.engine}
                onChange={e => handleEngineChange(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-vepagos-green/50 focus:border-vepagos-green outline-none bg-white"
              >
                {ENGINE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ── Conexión Origen ── */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Database className="w-4 h-4 text-vepagos-green" />
              <h3 className="text-xs font-bold text-vepagos-navy uppercase tracking-wide">Conexión Origen</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Servidor (Host) *</label>
                <input
                  type="text"
                  value={form.host}
                  onChange={e => updateField("host", e.target.value)}
                  placeholder="192.168.0.110"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-vepagos-green/50 focus:border-vepagos-green outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Puerto *</label>
                <input
                  type="number"
                  value={form.port}
                  onChange={e => updateField("port", parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-vepagos-green/50 focus:border-vepagos-green outline-none font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Usuario *</label>
                <input
                  type="text"
                  value={form.db_username}
                  onChange={e => updateField("db_username", e.target.value)}
                  placeholder="administrador"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-vepagos-green/50 focus:border-vepagos-green outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Contraseña {isEditing ? "(dejar vacío = mantener)" : "*"}
                </label>
                <div className="relative">
                  <input
                    type={showDbPassword ? "text" : "password"}
                    value={form.db_password}
                    onChange={e => updateField("db_password", e.target.value)}
                    placeholder={isEditing ? "••••••••" : "Contraseña"}
                    className="w-full px-3 py-2 pr-9 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-vepagos-green/50 focus:border-vepagos-green outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDbPassword(!showDbPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showDbPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Túnel SSH */}
            <div className="mt-4 pt-3 border-t border-dashed border-gray-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.use_ssh_tunnel}
                  onChange={e => updateField("use_ssh_tunnel", e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-vepagos-green focus:ring-vepagos-green"
                />
                <Shield className="w-4 h-4 text-green-600" />
                <span className="text-xs font-bold text-gray-700 uppercase">Usar Túnel SSH</span>
                <span className="text-[10px] text-gray-400">(para MySQL/PostgreSQL remotos)</span>
              </label>

              {form.use_ssh_tunnel && (
                <div className="grid grid-cols-4 gap-3 mt-3">
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">Host SSH *</label>
                    <input
                      type="text"
                      value={form.ssh_host}
                      onChange={e => updateField("ssh_host", e.target.value)}
                      placeholder="5.189.130.39"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-vepagos-green/50 focus:border-vepagos-green outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Puerto SSH</label>
                    <input
                      type="number"
                      value={form.ssh_port}
                      onChange={e => updateField("ssh_port", parseInt(e.target.value) || 22)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-vepagos-green/50 focus:border-vepagos-green outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Usuario SSH *</label>
                    <input
                      type="text"
                      value={form.ssh_username}
                      onChange={e => updateField("ssh_username", e.target.value)}
                      placeholder="administrador"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-vepagos-green/50 focus:border-vepagos-green outline-none"
                    />
                  </div>
                  <div className="col-span-4">
                    <label className="block text-xs text-gray-500 mb-1">
                      Contraseña SSH {isEditing ? "(dejar vacío = mantener)" : "*"}
                    </label>
                    <div className="relative w-1/2">
                      <input
                        type={showSshPassword ? "text" : "password"}
                        value={form.ssh_password}
                        onChange={e => updateField("ssh_password", e.target.value)}
                        placeholder={isEditing ? "••••••••" : "Contraseña SSH"}
                        className="w-full px-3 py-2 pr-9 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-vepagos-green/50 focus:border-vepagos-green outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSshPassword(!showSshPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showSshPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Seleccionar Base de Datos ── */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-vepagos-green" />
                <h3 className="text-xs font-bold text-vepagos-navy uppercase tracking-wide">Seleccionar Base de Datos</h3>
              </div>
              <button
                type="button"
                onClick={handleDiscoverDatabases}
                disabled={discovering}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {discovering ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Search className="w-3.5 h-3.5" />
                )}
                {discovering ? "Buscando..." : "Descubrir BDs"}
              </button>
            </div>

            {/* Base de datos seleccionada actualmente */}
            <div className="mb-3">
              <label className="block text-xs text-gray-500 mb-1">Base de datos seleccionada *</label>
              <input
                type="text"
                value={form.database_name}
                onChange={e => updateField("database_name", e.target.value)}
                placeholder="Escribe el nombre o usa 'Descubrir BDs' →"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-vepagos-green/50 focus:border-vepagos-green outline-none"
              />
            </div>

            {/* Panel de descubrimiento */}
            {showDiscoverPanel && (
              <div className="border border-blue-200 rounded-lg bg-blue-50/50 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-blue-800 uppercase">
                    {discoveredDatabases.length} base{discoveredDatabases.length !== 1 ? "s" : ""} encontrada{discoveredDatabases.length !== 1 ? "s" : ""}
                  </span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showSystemDbs}
                      onChange={e => {
                        setShowSystemDbs(e.target.checked);
                        // Re-descubrir con/sin system DBs
                        setTimeout(() => handleDiscoverDatabases(), 100);
                      }}
                      className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-[10px] text-gray-500">Mostrar BDs del sistema</span>
                  </label>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-0.5">
                  {discoveredDatabases.map(db => (
                    <button
                      key={db}
                      type="button"
                      onClick={() => {
                        updateField("database_name", db);
                      }}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-left transition-colors ${
                        form.database_name === db
                          ? "bg-vepagos-green/10 text-vepagos-green font-medium"
                          : "hover:bg-gray-100 text-gray-700"
                      }`}
                    >
                      {form.database_name === db ? (
                        <CheckSquare className="w-4 h-4 text-vepagos-green flex-shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-300 flex-shrink-0" />
                      )}
                      <span className="text-sm">{db}</span>
                    </button>
                  ))}
                  {discoveredDatabases.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-3">No se encontraron bases de datos</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowDiscoverPanel(false)}
                  className="mt-2 text-[10px] text-blue-600 hover:underline"
                >
                  Cerrar lista
                </button>
              </div>
            )}
          </div>

          {/* ── Destino de Almacenamiento ── */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <FolderOpen className="w-4 h-4 text-vepagos-green" />
              <h3 className="text-xs font-bold text-vepagos-navy uppercase tracking-wide">Destino de Almacenamiento</h3>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Tipo</label>
                <select
                  value={form.destination_type}
                  onChange={e => updateField("destination_type", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-vepagos-green/50 focus:border-vepagos-green outline-none bg-white"
                >
                  <option value="nas">NAS (Carpeta de red)</option>
                  <option value="local">Local</option>
                </select>
              </div>
              <div className="col-span-3">
                <label className="block text-xs text-gray-500 mb-1">Ruta de Destino *</label>
                <input
                  type="text"
                  value={form.destination_path}
                  onChange={e => updateField("destination_path", e.target.value)}
                  placeholder="\\\\192.168.0.27\\SqlResBackupAllDB\\MiBackup"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-vepagos-green/50 focus:border-vepagos-green outline-none font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Retención</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={form.retention_days}
                    onChange={e => updateField("retention_days", parseInt(e.target.value) || 30)}
                    className="w-20 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-vepagos-green/50 focus:border-vepagos-green outline-none"
                  />
                  <span className="text-sm text-gray-500">días</span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Compresión</label>
                <select
                  value={form.compression_format}
                  onChange={e => updateField("compression_format", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-vepagos-green/50 focus:border-vepagos-green outline-none bg-white"
                >
                  <option value="gzip">GZIP (.sql.gz)</option>
                  <option value="zip">ZIP (.zip)</option>
                  <option value="none">Sin compresión (.sql / .bak)</option>
                </select>
              </div>
            </div>
          </div>

          {/* ── Programación de Horario ── */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-vepagos-green" />
              <h3 className="text-xs font-bold text-vepagos-navy uppercase tracking-wide">Programación de Horario</h3>
            </div>

            {/* Hora de ejecución */}
            <div className="flex items-center gap-4 mb-4">
              <span className="text-sm text-gray-600">Ejecutar a las:</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={form.schedule_hour}
                  onChange={e => updateField("schedule_hour", Math.min(23, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-16 px-2 py-2 text-center text-sm font-mono font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-vepagos-green/50 focus:border-vepagos-green outline-none"
                />
                <span className="text-lg font-bold text-gray-400">:</span>
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={form.schedule_minute}
                  onChange={e => updateField("schedule_minute", Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-16 px-2 py-2 text-center text-sm font-mono font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-vepagos-green/50 focus:border-vepagos-green outline-none"
                />
              </div>
              <span className="text-xs text-gray-400">(Hora de Venezuela / Caracas)</span>
            </div>

            {/* Selector de días */}
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-gray-600">Ejecutar los días:</span>
                <button
                  type="button"
                  onClick={selectAllDays}
                  className="text-[10px] text-vepagos-green hover:underline font-medium"
                >
                  Todos
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={selectWeekdays}
                  className="text-[10px] text-vepagos-green hover:underline font-medium"
                >
                  Lun-Vie
                </button>
              </div>
              <div className="flex gap-2">
                {DAY_LABELS.map((day, idx) => {
                  const isWeekend = idx === 0 || idx === 6;
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(idx)}
                      className={`w-12 h-10 rounded-lg text-xs font-bold border-2 transition-all ${
                        form.schedule_days[idx]
                          ? isWeekend
                            ? "bg-orange-500 border-orange-500 text-white"
                            : "bg-vepagos-green border-vepagos-green text-white"
                          : "bg-white border-gray-200 text-gray-400 hover:border-gray-300"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preview del cron y estado */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-dashed border-gray-200">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase">Cron:</span>
                  <span className="ml-1 font-mono text-xs text-gray-700 bg-gray-100 px-2 py-0.5 rounded">{cronPreview}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase">Descripción:</span>
                  <span className="ml-1 text-xs text-gray-700 font-medium">{schedulePreview}</span>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={e => updateField("is_active", e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-vepagos-green focus:ring-vepagos-green"
                />
                <span className={`text-xs font-bold uppercase ${form.is_active ? "text-green-600" : "text-red-500"}`}>
                  {form.is_active ? "Activo" : "Inactivo"}
                </span>
              </label>
            </div>
          </div>

          {/* ── Notificaciones ── */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-4 h-4 text-vepagos-green" />
              <h3 className="text-xs font-bold text-vepagos-navy uppercase tracking-wide">Notificaciones</h3>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.send_alert_on_failure}
                  onChange={e => updateField("send_alert_on_failure", e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-vepagos-green focus:ring-vepagos-green"
                />
                <span className="text-sm text-gray-700">Crear alerta en NOC si el respaldo falla</span>
              </label>
            </div>
            <div className="mt-3">
              <label className="block text-xs text-gray-500 mb-1">Email de notificación (opcional)</label>
              <input
                type="email"
                value={form.notification_email}
                onChange={e => updateField("notification_email", e.target.value)}
                placeholder="admin@vepagos.com"
                className="w-1/2 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-vepagos-green/50 focus:border-vepagos-green outline-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-200 rounded text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 bg-vepagos-green text-vepagos-navy rounded text-xs font-bold hover:bg-[#00b36b] transition-colors flex items-center disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isEditing ? "Actualizar Trabajo" : "Guardar Trabajo"}
          </button>
        </div>
      </Card>
    </div>,
    document.body
  );
}
