export type DatabaseEngine = 'mssql' | 'mysql' | 'postgres';
export type DestinationType = 'nas' | 'local' | 's3';
export type BackupStatus = 'RUNNING' | 'SUCCESS' | 'FAILED';
export type BackupType = 'FULL' | 'DIFF';

export interface BackupJob {
  id: string;
  name: string;
  engine: DatabaseEngine;
  is_active: boolean;

  // Conexión DB
  host: string;
  port: number;
  database_name: string;
  db_username: string;
  db_password_encrypted?: string;

  // Túnel SSH
  use_ssh_tunnel: boolean;
  ssh_host?: string;
  ssh_port?: number;
  ssh_username?: string;
  ssh_password_encrypted?: string;

  // Destino
  destination_type: DestinationType;
  destination_path: string;
  nas_username?: string;
  nas_password_encrypted?: string;

  // Planificación
  cron_schedule: string;
  schedule_description?: string;
  retention_days: number;
  compression_format: 'zip' | '7z' | 'gzip' | 'none';

  // Alertas
  send_alert_on_failure: boolean;
  notification_email?: string;

  created_at: string;
  updated_at: string;

  // Métricas agregadas para visualización rápida
  last_backup_status?: BackupStatus | null;
  last_backup_date?: string | null;
  last_backup_size?: string | null;
  last_backup_duration?: number | null;
}

export interface BackupHistoryItem {
  id: string;
  job_id: string;
  started_at: string;
  finished_at?: string;
  duration_seconds?: number;
  status: BackupStatus;
  backup_type: BackupType;
  file_name?: string;
  file_size_bytes?: number;
  file_size_formatted?: string;
  destination_saved_path?: string;
  error_message?: string;
  log_output?: string;
  created_at: string;
}

export interface BackupStats {
  totalJobs: number;
  activeJobs: number;
  totalSuccess: number;
  totalFailed: number;
  currentlyRunning: number;
  totalBytesFormatted: string;
  avgDurationSeconds: number;
  successRate: number;
}
