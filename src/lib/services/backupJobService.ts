import { query } from '@/lib/db';
import { BackupJob, BackupHistoryItem } from '@/types/backup';

export const backupJobService = {
  /**
   * Obtiene todos los trabajos de respaldo con la información de su última ejecución
   */
  async getAllJobs(): Promise<BackupJob[]> {
    const sql = `
      SELECT 
        j.*,
        h.status AS last_backup_status,
        h.started_at AS last_backup_date,
        h.file_size_formatted AS last_backup_size,
        h.duration_seconds AS last_backup_duration
      FROM backup_jobs j
      LEFT JOIN LATERAL (
        SELECT status, started_at, file_size_formatted, duration_seconds
        FROM backup_history
        WHERE job_id = j.id
        ORDER BY started_at DESC
        LIMIT 1
      ) h ON TRUE
      ORDER BY j.name ASC;
    `;
    const res = await query(sql);
    return res.rows;
  },

  /**
   * Obtiene un trabajo específico por su ID
   */
  async getJobById(id: string): Promise<BackupJob | null> {
    const sql = 'SELECT * FROM backup_jobs WHERE id = $1';
    const res = await query(sql, [id]);
    return res.rows[0] || null;
  },

  /**
   * Obtiene el historial completo de ejecuciones de un trabajo
   */
  async getHistoryByJobId(jobId: string, limit = 30): Promise<BackupHistoryItem[]> {
    const sql = `
      SELECT *
      FROM backup_history
      WHERE job_id = $1
      ORDER BY started_at DESC
      LIMIT $2;
    `;
    const res = await query(sql, [jobId, limit]);
    return res.rows;
  },

  /**
   * Registra el inicio de una ejecución de respaldo
   */
  async createHistoryRecord(jobId: string, backupType: 'FULL' | 'DIFF' = 'FULL'): Promise<string> {
    const sql = `
      INSERT INTO backup_history (job_id, status, backup_type)
      VALUES ($1, 'RUNNING', $2)
      RETURNING id;
    `;
    const res = await query(sql, [jobId, backupType]);
    return res.rows[0].id;
  },

  /**
   * Actualiza el registro con el resultado final (SUCCESS o FAILED)
   */
  async updateHistoryRecord(
    historyId: string,
    params: {
      status: 'SUCCESS' | 'FAILED';
      durationSeconds: number;
      fileName?: string;
      fileSizeBytes?: number;
      fileSizeFormatted?: string;
      destinationSavedPath?: string;
      errorMessage?: string;
      logOutput?: string;
    }
  ): Promise<void> {
    const sql = `
      UPDATE backup_history
      SET 
        finished_at = CURRENT_TIMESTAMP,
        status = $1,
        duration_seconds = $2,
        file_name = $3,
        file_size_bytes = $4,
        file_size_formatted = $5,
        destination_saved_path = $6,
        error_message = $7,
        log_output = $8
      WHERE id = $9;
    `;
    await query(sql, [
      params.status,
      params.durationSeconds,
      params.fileName || null,
      params.fileSizeBytes || null,
      params.fileSizeFormatted || null,
      params.destinationSavedPath || null,
      params.errorMessage || null,
      params.logOutput || null,
      historyId
    ]);
  }
};
