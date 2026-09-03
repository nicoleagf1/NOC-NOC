import { NextResponse } from 'next/server';
import { getRules, updateRule, triggerPrometheusReload } from '@/lib/services/alertConfigService';

export async function GET(req: Request) {
  try {
    const rules = getRules();
    return NextResponse.json({ success: true, rules });
  } catch (error: any) {
    console.error("Error fetching rules:", error);
    return NextResponse.json({ error: "Error al obtener reglas", details: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, updates } = body;

    if (!id || !updates) {
      return NextResponse.json({ error: "Faltan datos obligatorios (id, updates)" }, { status: 400 });
    }

    const newRules = updateRule(id, updates);
    
    // Disparar recarga en Prometheus para aplicar cambios en caliente
    const reloaded = await triggerPrometheusReload();

    return NextResponse.json({ 
      success: true, 
      rules: newRules, 
      reloaded 
    });
  } catch (error: any) {
    console.error("Error updating rule:", error);
    return NextResponse.json({ error: "Error al actualizar regla", details: error.message }, { status: 500 });
  }
}
