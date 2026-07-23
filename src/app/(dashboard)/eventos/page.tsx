"use client";

import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle,
  BellRing,
  XCircle,
  Info,
  CheckCircle2,
  Search,
  Filter,
  Eye,
  MoreVertical,
  ArrowDown,
  ListTodo,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

export default function EventosPage() {
  const [eventosList, setEventosList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados de los filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("TODOS");
  const [filterSource, setFilterSource] = useState("TODAS");
  const [filterSev, setFilterSev] = useState("TODAS");

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // KPIs State
  const [kpis, setKpis] = useState({
    totales: 0,
    criticos: 0,
    advertencias: 0,
    informativos: 0,
    resueltos: 0,
  });

  useEffect(() => {
    fetchEvents();
    // Podríamos poner un polling aquí para que se actualice solo
    const interval = setInterval(fetchEvents, 30000); // 30 segundos
    return () => clearInterval(interval);
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/events");
      if (res.ok) {
        const data = await res.json();
        setEventosList(data);
        calculateKPIs(data);
      }
    } catch (e) {
      console.error("Error fetching events:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateKPIs = (events: any[]) => {
    let crit = 0, adv = 0, info = 0, resueltos = 0;
    events.forEach(evt => {
      if (evt.sev === 'CRÍTICO') crit++;
      else if (evt.sev === 'ADVERTENCIA') adv++;
      else if (evt.sev === 'RESUELTO') resueltos++;
      else info++;
    });

    setKpis({
      totales: events.length,
      criticos: crit,
      advertencias: adv,
      informativos: info,
      resueltos: resueltos
    });
  };

  const calcPercentage = (val: number) => {
    if (kpis.totales === 0) return "0.00%";
    return ((val / kpis.totales) * 100).toFixed(2) + "%";
  };

  // Filtrado lógico en el cliente
  const filteredEvents = useMemo(() => {
    return eventosList.filter(evt => {
      const matchesSearch = 
        (evt.host && evt.host.toLowerCase().includes(searchTerm.toLowerCase())) || 
        (evt.desc && evt.desc.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesType = filterType === "TODOS" || evt.type === filterType;
      const matchesSource = filterSource === "TODAS" || evt.source === filterSource;
      const matchesSev = filterSev === "TODAS" || evt.sev === filterSev;

      return matchesSearch && matchesType && matchesSource && matchesSev;
    });
  }, [eventosList, searchTerm, filterType, filterSource, filterSev]);

  // Paginación lógica
  const totalItems = filteredEvents.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  
  const startIndex = (safeCurrentPage - 1) * rowsPerPage;
  const currentItems = filteredEvents.slice(startIndex, startIndex + rowsPerPage);

  const handleResetFilters = () => {
    setSearchTerm("");
    setFilterType("TODOS");
    setFilterSource("TODAS");
    setFilterSev("TODAS");
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Header and Filters */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-barlow-condensed text-vepagos-navy uppercase tracking-wide">
            Histórico de Eventos
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Registro detallado de todas las alertas, incidentes y resoluciones del sistema.
          </p>
        </div>
        
        <div className="flex items-center space-x-3 flex-wrap gap-y-2 justify-end max-w-2xl">
          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar evento..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-[var(--radius-input)] text-xs focus:outline-none focus:ring-1 focus:ring-vepagos-green transition-all"
            />
          </div>
          
          <div className="relative">
            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest absolute -top-2 left-2 bg-white px-1 z-10 pointer-events-none">Tipo</label>
            <select 
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
              className="appearance-none border border-gray-200 bg-white rounded-[var(--radius-input)] px-3 py-2 w-36 cursor-pointer text-xs font-bold text-vepagos-navy focus:outline-none focus:border-vepagos-green"
            >
              <option value="TODOS">TODOS</option>
              <option value="ALERTA">ALERTA</option>
              <option value="SISTEMA">SISTEMA</option>
              <option value="BACKUP">BACKUP</option>
            </select>
          </div>
          
          <div className="relative">
            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest absolute -top-2 left-2 bg-white px-1 z-10 pointer-events-none">Fuente</label>
            <select 
              value={filterSource}
              onChange={(e) => { setFilterSource(e.target.value); setCurrentPage(1); }}
              className="appearance-none border border-gray-200 bg-white rounded-[var(--radius-input)] px-3 py-2 w-36 cursor-pointer text-xs font-bold text-vepagos-navy focus:outline-none focus:border-vepagos-green"
            >
              <option value="TODAS">TODAS</option>
              <option value="PROMETHEUS">PROMETHEUS</option>
              <option value="UPTIME KUMA">UPTIME KUMA</option>
              <option value="SISTEMA">SISTEMA</option>
            </select>
          </div>

          <div className="relative">
            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest absolute -top-2 left-2 bg-white px-1 z-10 pointer-events-none">Severidad</label>
            <select 
              value={filterSev}
              onChange={(e) => { setFilterSev(e.target.value); setCurrentPage(1); }}
              className="appearance-none border border-gray-200 bg-white rounded-[var(--radius-input)] px-3 py-2 w-36 cursor-pointer text-xs font-bold text-vepagos-navy focus:outline-none focus:border-vepagos-green"
            >
              <option value="TODAS">TODAS</option>
              <option value="CRÍTICO">CRÍTICO</option>
              <option value="ADVERTENCIA">ADVERTENCIA</option>
              <option value="INFORMATIVO">INFORMATIVO</option>
              <option value="RESUELTO">RESUELTO</option>
            </select>
          </div>

          <button 
            onClick={handleResetFilters}
            className="flex items-center border border-vepagos-navy text-vepagos-navy hover:bg-vepagos-navy hover:text-white px-4 py-2 h-[34px] rounded-[var(--radius-pill)] text-xs font-bold transition-colors uppercase"
          >
            <Filter className="w-3 h-3 mr-2" />
            Limpiar
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Eventos Totales */}
        <Card className="p-4 flex flex-col justify-between">
          <div className="text-[10px] font-bold text-vepagos-navy uppercase tracking-widest text-center mb-2">Eventos Totales</div>
          <div className="flex items-center justify-center space-x-4 flex-1">
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
              <ListTodo className="w-5 h-5 text-indigo-500" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-vepagos-navy leading-none">{kpis.totales}</div>
            </div>
          </div>
          <div className="text-[10px] font-bold text-gray-400 text-center uppercase tracking-widest mt-2">Últimos 30 días</div>
        </Card>

        {/* Criticas */}
        <Card className="p-4 flex flex-col justify-between border-b-4 border-b-red-500">
          <div className="text-[10px] font-bold text-vepagos-navy uppercase tracking-widest text-center mb-2">Críticos</div>
          <div className="flex items-center justify-center space-x-4 flex-1">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-500 leading-none">{kpis.criticos}</div>
            </div>
          </div>
          <div className="text-[10px] font-bold text-gray-400 text-center uppercase tracking-widest mt-2">{calcPercentage(kpis.criticos)} Del Total</div>
        </Card>

        {/* Advertencias */}
        <Card className="p-4 flex flex-col justify-between border-b-4 border-b-amber-500">
          <div className="text-[10px] font-bold text-vepagos-navy uppercase tracking-widest text-center mb-2">Advertencias</div>
          <div className="flex items-center justify-center space-x-4 flex-1">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
              <BellRing className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-500 leading-none">{kpis.advertencias}</div>
            </div>
          </div>
          <div className="text-[10px] font-bold text-gray-400 text-center uppercase tracking-widest mt-2">{calcPercentage(kpis.advertencias)} Del Total</div>
        </Card>

        {/* Informativos */}
        <Card className="p-4 flex flex-col justify-between border-b-4 border-b-blue-500">
          <div className="text-[10px] font-bold text-vepagos-navy uppercase tracking-widest text-center mb-2">Informativos</div>
          <div className="flex items-center justify-center space-x-4 flex-1">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <Info className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-500 leading-none">{kpis.informativos}</div>
            </div>
          </div>
          <div className="text-[10px] font-bold text-gray-400 text-center uppercase tracking-widest mt-2">{calcPercentage(kpis.informativos)} Del Total</div>
        </Card>

        {/* Resueltos */}
        <Card className="p-4 flex flex-col justify-between border-b-4 border-b-vepagos-green">
          <div className="text-[10px] font-bold text-vepagos-navy uppercase tracking-widest text-center mb-2">Resueltos</div>
          <div className="flex items-center justify-center space-x-4 flex-1">
            <div className="w-10 h-10 rounded-full bg-vepagos-green/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-vepagos-green" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-vepagos-green leading-none">{kpis.resueltos}</div>
            </div>
          </div>
          <div className="text-[10px] font-bold text-gray-400 text-center uppercase tracking-widest mt-2">{calcPercentage(kpis.resueltos)} Del Total</div>
        </Card>
      </div>

      {/* Events Table Section */}
      <div className="bg-white rounded-[var(--radius-card)] border border-gray-100 shadow-sm overflow-hidden mt-6">
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-bold text-vepagos-navy uppercase tracking-widest flex items-center">
                  Fecha / Hora <ArrowDown className="w-3 h-3 ml-1" />
                </th>
                <th className="px-4 py-4 text-[10px] font-bold text-vepagos-navy uppercase tracking-widest">Tipo</th>
                <th className="px-4 py-4 text-[10px] font-bold text-vepagos-navy uppercase tracking-widest">Fuente</th>
                <th className="px-4 py-4 text-[10px] font-bold text-vepagos-navy uppercase tracking-widest">Host / Servicio</th>
                <th className="px-4 py-4 text-[10px] font-bold text-vepagos-navy uppercase tracking-widest">Descripción</th>
                <th className="px-4 py-4 text-[10px] font-bold text-vepagos-navy uppercase tracking-widest">Severidad</th>
                <th className="px-6 py-4 text-[10px] font-bold text-vepagos-navy uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr><td colSpan={7} className="p-8 text-center text-gray-500 text-sm">Cargando eventos...</td></tr>
              ) : currentItems.length === 0 ? (
                <tr><td colSpan={7} className="p-12 text-center text-sm font-bold text-gray-400">No hay eventos que coincidan con los filtros aplicados.</td></tr>
              ) : currentItems.map((evt) => (
                <tr key={evt.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-3">
                    <div className="text-xs font-bold text-vepagos-navy uppercase">{evt.date}</div>
                    <div className="text-[10px] text-gray-400">{evt.time}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] font-bold text-gray-500">{evt.type}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[9px] font-bold px-2 py-1 rounded uppercase ${evt.sourceCol || 'bg-gray-100'}`}>{evt.source}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-bold text-vepagos-navy uppercase">{evt.host}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-500">{evt.desc}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={evt.sevVar as any}>{evt.sev}</Badge>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-vepagos-navy border border-gray-200">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-vepagos-navy border border-gray-200">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && (
          <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-widest gap-4">
            <div>
              Mostrando {totalItems === 0 ? 0 : startIndex + 1} a {Math.min(startIndex + rowsPerPage, totalItems)} de {totalItems} Eventos
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setCurrentPage(Math.max(1, safeCurrentPage - 1))}
                disabled={safeCurrentPage === 1}
                className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent rounded text-gray-400"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button 
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
                    safeCurrentPage === page 
                      ? "border border-vepagos-green bg-vepagos-green/10 text-vepagos-green" 
                      : "hover:bg-gray-100"
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button 
                onClick={() => setCurrentPage(Math.min(totalPages, safeCurrentPage + 1))}
                disabled={safeCurrentPage === totalPages || totalPages === 0}
                className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent rounded text-gray-400"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center">
              <span className="mr-2">Filas por página</span>
              <div className="relative">
                <select 
                  value={rowsPerPage}
                  onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="appearance-none border border-gray-200 rounded px-2 py-1 pr-6 cursor-pointer font-bold text-vepagos-navy bg-white focus:outline-none focus:border-vepagos-green"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <ChevronDown className="w-3 h-3 text-gray-400 absolute right-1.5 top-1.5 pointer-events-none" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
