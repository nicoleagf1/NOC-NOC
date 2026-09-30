import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as os from 'os';
import { execSync } from 'child_process';

const isWindows = os.platform() === 'win32';

/**
 * Normaliza una ruta UNC (\\server\share\sub) a partes separadas por '/'.
 * Retorna ['server', 'share', 'sub', ...]
 */
function parseUNCParts(uncPath: string): string[] {
  return uncPath.replace(/\\/g, '/').replace(/^\/+/, '').split('/').filter(Boolean);
}

/**
 * Monta un share de red SMB/CIFS según la plataforma.
 * - Windows: usa `net use`
 * - Linux:   usa `mount -t cifs`
 */
function mountNetworkShare(sharePath: string, username: string, password: string): void {
  const parts = parseUNCParts(sharePath);
  const server = parts[0];
  const share = parts[1] || '';

  if (isWindows) {
    const shareRoot = `\\\\${server}\\${share}`;
    try { execSync(`net use "${shareRoot}" /delete /y 2>nul`, { timeout: 10000, windowsHide: true }); } catch { /* ignorar */ }
    execSync(`net use "${shareRoot}" /user:"${username}" "${password}"`, { timeout: 15000, windowsHide: true });
  } else {
    // Linux: montar via mount.cifs (requiere cifs-utils)
    const shareRoot = `//${server}/${share}`;
    const mountPoint = `/mnt/nas_${server}_${share}`.replace(/[^a-zA-Z0-9_/]/g, '_');
    try { fs.mkdirSync(mountPoint, { recursive: true }); } catch { /* ignorar */ }

    // Desmontar si ya estaba montado
    try { execSync(`umount "${mountPoint}" 2>/dev/null`, { timeout: 5000 }); } catch { /* ignorar */ }

    // Separar dominio\usuario si aplica
    let userPart = username;
    let domainPart = '';
    if (username.includes('\\')) {
      const idx = username.lastIndexOf('\\');
      domainPart = username.substring(0, idx);
      userPart = username.substring(idx + 1);
    } else if (username.includes('/')) {
      const idx = username.lastIndexOf('/');
      domainPart = username.substring(0, idx);
      userPart = username.substring(idx + 1);
    } else if (username.startsWith('.\\') || username.startsWith('./')) {
      userPart = username.substring(2);
    }

    const domainOpt = domainPart ? `,domain=${domainPart}` : '';
    const cmd = `mount -t cifs "${shareRoot}" "${mountPoint}" -o username="${userPart}",password="${password}"${domainOpt},iocharset=utf8,file_mode=0777,dir_mode=0777`;
    execSync(cmd, { timeout: 15000 });
  }
}

/**
 * Resuelve la ruta real del filesystem según la plataforma.
 * En Linux, traduce rutas UNC (\\server\share\sub) a la ruta montada (/mnt/nas_server_share/sub).
 */
function resolveNasPath(targetPath: string): string {
  if (isWindows) return targetPath;

  if (targetPath.startsWith('\\')) {
    const parts = parseUNCParts(targetPath);
    const server = parts[0];
    const share = parts[1] || '';
    const subPath = parts.slice(2).join('/');
    const mountPoint = `/mnt/nas_${server}_${share}`.replace(/[^a-zA-Z0-9_/]/g, '_');
    return subPath ? `${mountPoint}/${subPath}` : mountPoint;
  }
  return targetPath;
}

/**
 * POST /api/backups/verify-path
 * Verifica si la ruta de destino es accesible.
 * Opcionalmente intenta montar la ruta de red con credenciales NAS.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { destination_path, nas_username, nas_password } = body;

    if (!destination_path || !destination_path.trim()) {
      return NextResponse.json(
        { success: false, error: 'La ruta de destino es obligatoria' },
        { status: 400 }
      );
    }

    const targetPath = destination_path.trim();
    const isUNC = targetPath.startsWith('\\');

    // En Linux, las rutas UNC requieren credenciales para montar CIFS
    if (isUNC && !isWindows && (!nas_username || !nas_password)) {
      return NextResponse.json({
        success: false,
        error: 'En Linux/Docker, se requieren credenciales de red (usuario y contraseña) para acceder a carpetas compartidas (NAS).',
        details: { path: targetPath, requiresCredentials: true },
      });
    }

    // Si es una ruta UNC y se proporcionaron credenciales, intentar montar
    if (isUNC && nas_username && nas_password) {
      try {
        mountNetworkShare(targetPath, nas_username, nas_password);
        console.log(`[Verify Path] Ruta de red montada con credenciales (${isWindows ? 'Windows' : 'Linux'})`);
      } catch (mountErr: any) {
        const errMsg = mountErr.stderr?.toString() || mountErr.message || 'Error desconocido';
        return NextResponse.json({
          success: false,
          error: `No se pudo autenticar en la ruta de red: ${errMsg.trim()}`,
          details: { path: targetPath, authenticated: false },
        });
      }
    }

    // Resolver la ruta según plataforma
    const resolvedPath = resolveNasPath(targetPath);

    // Verificar si la ruta existe y es accesible
    try {
      const exists = fs.existsSync(resolvedPath);

      if (exists) {
        const stat = fs.statSync(resolvedPath);

        if (!stat.isDirectory()) {
          return NextResponse.json({
            success: false,
            error: 'La ruta existe pero no es un directorio',
            details: { path: targetPath, isDirectory: false },
          });
        }

        // Intentar escribir un archivo de prueba para verificar permisos de escritura
        const testFile = `${resolvedPath}/.noc_noc_write_test_${Date.now()}.tmp`;
        try {
          fs.writeFileSync(testFile, 'NOC-NOC write test');
          fs.unlinkSync(testFile);
          return NextResponse.json({
            success: true,
            message: 'Ruta accesible con permisos de lectura y escritura',
            details: {
              path: targetPath,
              resolvedPath,
              readable: true,
              writable: true,
              isUNC,
              authenticated: !!(nas_username && nas_password),
            },
          });
        } catch {
          return NextResponse.json({
            success: false,
            error: 'La ruta es accesible pero NO tiene permisos de escritura',
            details: { path: targetPath, readable: true, writable: false, isUNC },
          });
        }
      } else {
        // Intentar crear la carpeta
        try {
          fs.mkdirSync(resolvedPath, { recursive: true });
          const testFile = `${resolvedPath}/.noc_noc_write_test_${Date.now()}.tmp`;
          fs.writeFileSync(testFile, 'NOC-NOC write test');
          fs.unlinkSync(testFile);
          return NextResponse.json({
            success: true,
            message: 'Carpeta creada exitosamente con permisos de lectura y escritura',
            details: {
              path: targetPath,
              resolvedPath,
              readable: true,
              writable: true,
              created: true,
              isUNC,
              authenticated: !!(nas_username && nas_password),
            },
          });
        } catch (mkdirErr: any) {
          return NextResponse.json({
            success: false,
            error: `La ruta no existe y no se pudo crear: ${mkdirErr.message}`,
            details: { path: targetPath, isUNC },
          });
        }
      }
    } catch (accessErr: any) {
      return NextResponse.json({
        success: false,
        error: `No se puede acceder a la ruta: ${accessErr.message}`,
        details: { path: targetPath, isUNC },
      });
    }
  } catch (error: any) {
    console.error('Error verificando ruta:', error);
    return NextResponse.json(
      { success: false, error: `Error interno: ${error.message}` },
      { status: 500 }
    );
  }
}
