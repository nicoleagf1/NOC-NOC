import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Actualizar los servicios vinculados a un host
export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id } = params;
    const { serviceIds } = await req.json();

    if (!Array.isArray(serviceIds)) {
      return NextResponse.json({ error: 'serviceIds debe ser un array' }, { status: 400 });
    }

    // Iniciar transacción manualmente
    await query('BEGIN');

    // 1. Eliminar relaciones existentes para este host
    await query('DELETE FROM host_services WHERE host_id = $1', [id]);

    // 2. Insertar nuevas relaciones
    if (serviceIds.length > 0) {
      // Construir consulta dinámica de inserción
      const values: string[] = [];
      const flatParams: any[] = [];
      let paramIndex = 1;

      serviceIds.forEach((serviceId) => {
        values.push(`($${paramIndex++}, $${paramIndex++})`);
        flatParams.push(id, serviceId);
      });

      const sql = `INSERT INTO host_services (host_id, service_id) VALUES ${values.join(', ')}`;
      await query(sql, flatParams);
    }

    await query('COMMIT');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    await query('ROLLBACK');
    console.error('Error updating host services:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
