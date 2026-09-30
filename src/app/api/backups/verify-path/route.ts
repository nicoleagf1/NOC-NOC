import { NextResponse } from 'next/server';
import * as fs from 'fs';
import { execSync } from 'child_process';

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
    const isUNC = targetPath.startsWith('\\\\');

    // Si es una ruta UNC y se proporcionaron credenciales, intentar montar con net use
    if (isUNC && nas_username && nas_password) {
      // Extraer el share raíz (\\server\share) del path completo
      const shareParts = targetPath.replace(/\\\\/g, '/').replace(/^\/\//, '').split('/');
      const shareRoot = `\\\\${shareParts[0]}\\${shareParts[1] || ''}`;

      try {
        // Primero desconectar si ya existía una conexión previa
        try {
          execSync(`net use "${shareRoot}" /delete /y 2>nul`, { timeout: 10000, windowsHide: true });
        } catch {
          // Ignorar si no existía conexión previa
        }

        // Conectar con credenciales
        const cmd = `net use "${shareRoot}" /user:"${nas_username}" "${nas_password}"`;
        execSync(cmd, { timeout: 15000, windowsHide: true });
        console.log(`[Verify Path] Ruta de red montada con credenciales: ${shareRoot}`);
      } catch (mountErr: any) {
        const errMsg = mountErr.stderr?.toString() || mountErr.message || 'Error desconocido';
        return NextResponse.json({
          success: false,
          error: `No se pudo autenticar en la ruta de red: ${errMsg.trim()}`,
          details: {
            path: targetPath,
            authenticated: false,
          },
        });
      }
    }

    // Verificar si la ruta existe y es accesible
    try {
      const exists = fs.existsSync(targetPath);

      if (exists) {
        const stat = fs.statSync(targetPath);

        if (!stat.isDirectory()) {
          return NextResponse.json({
            success: false,
            error: 'La ruta existe pero no es un directorio',
            details: { path: targetPath, isDirectory: false },
          });
        }

        // Intentar escribir un archivo de prueba para verificar permisos de escritura
        const testFile = `${targetPath}\\.noc_noc_write_test_${Date.now()}.tmp`;
        try {
          fs.writeFileSync(testFile, 'NOC-NOC write test');
          fs.unlinkSync(testFile);
          return NextResponse.json({
            success: true,
            message: 'Ruta accesible con permisos de lectura y escritura',
            details: {
              path: targetPath,
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
            details: {
              path: targetPath,
              readable: true,
              writable: false,
              isUNC,
            },
          });
        }
      } else {
        // Intentar crear la carpeta
        try {
          fs.mkdirSync(targetPath, { recursive: true });
          // Verificar que se creó y tiene permisos de escritura
          const testFile = `${targetPath}\\.noc_noc_write_test_${Date.now()}.tmp`;
          fs.writeFileSync(testFile, 'NOC-NOC write test');
          fs.unlinkSync(testFile);
          return NextResponse.json({
            success: true,
            message: 'Carpeta creada exitosamente con permisos de lectura y escritura',
            details: {
              path: targetPath,
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
