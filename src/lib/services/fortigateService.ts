import { query } from '@/lib/db';
import { decrypt } from '@/lib/security';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const fortigateService = {
  /**
   * Sincroniza la configuración de Fortigate desde la BD hacia fortigate.yaml
   * y reinicia el exportador de Docker.
   */
  async syncFortigateYaml(): Promise<void> {
    try {
      // 1. Obtener todas las conexiones fortigate activas
      const res = await query(`
        SELECT url, auth_credentials 
        FROM monitoring_connections 
        WHERE type = 'fortigate' AND is_active = TRUE
      `);

      // 2. Construir el contenido del archivo YAML
      let yamlContent = `---
# Archivo autogenerado por NOC-NOC

targets:
`;

      for (const row of res.rows) {
        if (row.url && row.auth_credentials) {
          const token = decrypt(row.auth_credentials);
          yamlContent += `  "${row.url}":\n    token: "${token}"\n    insecure: true\n`;
        }
      }

      // 3. Escribir al archivo
      const filePath = path.join(process.cwd(), 'fortigate', 'fortigate.yaml');
      await fs.writeFile(filePath, yamlContent, 'utf8');
      
      console.log(`[Fortigate Sync] Escrito ${res.rows.length} targets en ${filePath}`);

      // 4. Reiniciar el exportador para que tome la nueva configuración
      const { stdout, stderr } = await execAsync('docker compose restart fortigate-exporter', { 
        cwd: process.cwd() 
      });
      
      console.log(`[Fortigate Sync] Exportador reiniciado: ${stdout}`);
      if (stderr) {
        console.error(`[Fortigate Sync] Error stderr: ${stderr}`);
      }
      
    } catch (error) {
      console.error('[Fortigate Sync] Error fatal sincronizando yaml:', error);
      throw error;
    }
  }
};
