import { NextRequest, NextResponse } from "next/server";
import { 
  getServiceStatuses, 
  getHistoricalCpuUsage, 
  getGlobalKPIs 
} from "@/lib/services/metricsService";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type");

  try {
    switch (type) {
      case "services":
        const services = await getServiceStatuses();
        return NextResponse.json(services);
        
      case "cpu_history":
        const hours = parseInt(searchParams.get("hours") || "24");
        const history = await getHistoricalCpuUsage(hours);
        return NextResponse.json(history);
        
      case "global_kpis":
        const kpis = await getGlobalKPIs();
        return NextResponse.json(kpis);
        
      default:
        return NextResponse.json(
          { error: "Missing or invalid 'type' parameter. Valid options: 'services', 'cpu_history', 'global_kpis'" },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error("[API Route Error]", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
