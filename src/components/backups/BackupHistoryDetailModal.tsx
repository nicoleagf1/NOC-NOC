"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  CheckCircle2,
  XCircle,
  Loader2,
  Database,
  Server,
  FolderOpen,
  Clock,
  Calendar,
  FileArchive,
  Copy,
  Check,
  AlertTriangle,
  FileText,
  HardDrive
} from "lucide-react";
import { BackupHistoryItem, BackupJob } from "@/types/backup";

interface BackupHistoryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: BackupHistoryItem | null;
  job?: BackupJob | null;
}

export default function BackupHistoryDetailModal({
  isOpen,
  onClose,
  item,
  job,
}: BackupHistoryDetailModalProps) {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Timer de tiempo transcurrido para backups en ejecución
  useEffect(() => {
    if (!item || item.status !== "RUNNING") {
      setElapsed("");
      return;
    }
    const startTime = new Date(item.started_at).getTime();
    const updateElapsed = () => {
      const diff = Math.floor((Date.now() - startTime) / 1000);
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      setElapsed(
        h > 0
          ? `${h}h ${m.toString().padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`
          : m > 0
          ? `${m}m ${s.toString().padStart(2, "0")}s`
          : `${s}s`
      );
    };
    updateElapsed();
    const timer = setInterval(updateElapsed, 1000);
    return () => clearInterval(timer);
  }, [item]);

  if (!isOpen || !item || !mounted) return null;

  const isSuccess = item.status === "SUCCESS";
  const isFailed = item.status === "FAILED";
  const isRunning = item.status === "RUNNING";

  const handleCopyDiagnostic = () => {
    const diagnosticText = [
      `=== REPORTE DE EJECUCIÓN NOC-NOC ===`,
      `ID de Ejecución: ${item.id}`,
      `Trabajo: ${job?.name || "N/A"}`,
      `Motor: ${job?.engine?.toUpperCase() || "N/A"}`,
      `Base de Datos: ${job?.database_name || "N/A"}`,
      `Estado: ${item.status}`,
      `Tipo: ${item.backup_type}`,
      `Inicio: ${new Date(item.started_at).toLocaleString()}`,
      item.finished_at ? `Fin: ${new Date(item.finished_at).toLocaleString()}` : "",
      item.duration_seconds !== undefined ? `Duración: ${item.duration_seconds}s` : "",
      item.file_name ? `Archivo: ${item.file_name}` : "",
      item.file_size_formatted ? `Tamaño: ${item.file_size_formatted}` : "",
      item.destination_saved_path ? `Destino: ${item.destination_saved_path}` : "",
      item.error_message ? `\n--- ERROR REGISTRADO ---\n${item.error_message}` : "",
      item.log_output ? `\n--- LOG DE AUDITORÍA / DETALLES ---\n${item.log_output}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    navigator.clipboard.writeText(diagnosticText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return d.toLocaleString("es-ES", {
      dateStyle: "medium",
      timeStyle: "medium",
    });
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-xl shadow-2xl max-w-xl w-full border border-gray-100 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Cabecera del Modal ── */}
        <div className="bg-gray-50/70 p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg flex items-center justify-center ${
                isSuccess
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                  : isFailed
                  ? "bg-red-50 text-red-600 border border-red-200"
                  : "bg-amber-50 text-amber-600 border border-amber-200"
              }`}
            >
              {isSuccess ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : isFailed ? (
                <XCircle className="w-5 h-5" />
              ) : (
                <Loader2 className="w-5 h-5 animate-spin" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-vepagos-navy font-barlow-condensed tracking-wide uppercase">
                Detalle del Reporte de Respaldo
              </h2>
              <p className="text-xs text-gray-500">
                {job?.name || "Trabajo de Respaldo"} —{" "}
                <span className="font-mono text-gray-700">
                  {job?.engine?.toUpperCase() || "DATABASE"}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Cuerpo del Modal con Scroll ── */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm">
          {/* Banner de Estado */}
          <div
            className={`p-3.5 rounded-lg border flex items-center justify-between ${
              isSuccess
                ? "bg-emerald-50/60 border-emerald-200 text-emerald-800"
                : isFailed
                ? "bg-red-50/60 border-red-200 text-red-800"
                : "bg-amber-50/60 border-amber-200 text-amber-800"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="font-bold text-xs uppercase tracking-wider">
                {isSuccess
                  ? "EJECUCIÓN EXITOSA"
                  : isFailed
                  ? "EJECUCIÓN FALLIDA"
                  : "EN PROCESO"}
              </span>
              <span className="text-xs opacity-75">•</span>
              <span className="text-xs font-medium">
                {item.backup_type} BACKUP
              </span>
            </div>
            {item.duration_seconds !== undefined && item.duration_seconds !== null && (
              <span className="text-xs font-mono font-bold">
                {item.duration_seconds}s de duración
              </span>
            )}
          </div>

          {/* Timer de tiempo transcurrido (solo para backups en ejecución) */}
          {isRunning && elapsed && (
            <div className="p-3 rounded-lg border bg-blue-50/60 border-blue-200 text-blue-800 flex items-center gap-2.5">
              <Clock className="w-4 h-4 animate-pulse" />
              <span className="text-xs font-medium">Tiempo transcurrido:</span>
              <span className="text-sm font-mono font-bold">{elapsed}</span>
            </div>
          )}

          {/* Grilla de Datos Clave */}
          <div className="grid grid-cols-2 gap-3 bg-gray-50/80 p-3.5 rounded-lg border border-gray-100">
            <div>
              <span className="text-[11px] text-gray-400 uppercase tracking-wide font-barlow-condensed block">
                Base de Datos
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Database className="w-3.5 h-3.5 text-gray-500" />
                <span className="font-bold text-xs text-vepagos-navy">
                  {job?.database_name || "N/A"}
                </span>
              </div>
            </div>

            <div>
              <span className="text-[11px] text-gray-400 uppercase tracking-wide font-barlow-condensed block">
                Servidor Host
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Server className="w-3.5 h-3.5 text-gray-500" />
                <span className="font-mono text-xs text-gray-700 truncate">
                  {job ? `${job.host}:${job.port}` : "N/A"}
                </span>
              </div>
            </div>

            <div>
              <span className="text-[11px] text-gray-400 uppercase tracking-wide font-barlow-condensed block">
                Fecha de Inicio
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-xs text-gray-700">
                  {formatDate(item.started_at)}
                </span>
              </div>
            </div>

            <div>
              <span className="text-[11px] text-gray-400 uppercase tracking-wide font-barlow-condensed block">
                Tamaño del Archivo
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <HardDrive className="w-3.5 h-3.5 text-gray-500" />
                <span className="font-mono font-bold text-xs text-gray-800">
                  {item.file_size_formatted || "0 B"}
                </span>
              </div>
            </div>
          </div>

          {/* Archivo y Ruta de Destino */}
          <div className="border border-gray-200 rounded-lg p-3 space-y-2">
            <div>
              <span className="text-[11px] text-gray-500 uppercase font-barlow-condensed font-bold block mb-1">
                Archivo Generado
              </span>
              <div className="flex items-center justify-between bg-gray-50 px-2.5 py-1.5 rounded border border-gray-200 font-mono text-xs text-gray-700">
                <div className="flex items-center gap-2 truncate">
                  <FileArchive className="w-3.5 h-3.5 text-vepagos-green flex-shrink-0" />
                  <span className="truncate">{item.file_name || "No generado"}</span>
                </div>
              </div>
            </div>

            <div>
              <span className="text-[11px] text-gray-500 uppercase font-barlow-condensed font-bold block mb-1">
                Ruta de Destino (Almacenamiento)
              </span>
              <div className="flex items-center justify-between bg-gray-50 px-2.5 py-1.5 rounded border border-gray-200 font-mono text-xs text-gray-700">
                <div className="flex items-center gap-2 truncate">
                  <FolderOpen className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                  <span className="truncate" title={item.destination_saved_path || job?.destination_path}>
                    {item.destination_saved_path || job?.destination_path || "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Sección de ERROR (En caso de fallo) ── */}
          {isFailed && (
            <div className="border border-red-200 bg-red-50/40 rounded-lg p-3.5 space-y-2">
              <div className="flex items-center gap-1.5 text-red-700 font-bold font-barlow-condensed text-xs uppercase tracking-wide">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>Causa Detallada del Fallo</span>
              </div>
              <p className="text-xs text-red-800 font-medium whitespace-pre-wrap leading-relaxed">
                {item.error_message || "Error no especificado durante la ejecución."}
              </p>
            </div>
          )}

          {/* ── Sección de Logs / Salida de Auditoría / Retención ── */}
          {item.log_output && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-gray-500 uppercase font-barlow-condensed font-bold flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-gray-400" />
                  Registro de Auditoría & Diagnóstico
                </span>
                <button
                  type="button"
                  onClick={handleCopyDiagnostic}
                  className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-vepagos-green transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-600 font-medium">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copiar Registro</span>
                    </>
                  )}
                </button>
              </div>
              <div className="bg-gray-900 text-gray-200 font-mono text-[11px] p-3 rounded-lg overflow-x-auto max-h-48 whitespace-pre-wrap leading-normal border border-gray-800">
                {item.log_output}
              </div>
            </div>
          )}
        </div>

        {/* ── Pie del Modal ── */}
        <div className="bg-gray-50/70 p-3.5 border-t border-gray-100 flex items-center justify-between">
          <button
            type="button"
            onClick={handleCopyDiagnostic}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600 font-medium">Diagnóstico copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar reporte completo</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-white bg-vepagos-navy hover:bg-vepagos-navy/90 rounded-lg transition-colors uppercase tracking-wide"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
