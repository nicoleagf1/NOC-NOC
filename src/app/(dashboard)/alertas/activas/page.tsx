"use client";

import { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle,
  BellRing,
  XCircle,
  Info,
  CheckCircle2,
  Settings,
  Check,
  Search,
  Filter,
  Eye,
  MoreVertical,
  ArrowDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

// initialAlertsList is replaced by dynamic fetch

export default function AlertasActivasPage() {
  const [alertsList, setAlertsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSev, setFilterSev] = useState("TODAS");
  const [filterStatus, setFilterStatus] = useState("ACTIVAS");
  const [filterSource, setFilterSource] = useState("TODAS");

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);



  const fetchAlerts = async () => {
    try {
      const res = await fetch("/api/metrics/alerts");
      const json = await res.json();
      if (json.success) {
        setAlertsList(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const int = setInterval(fetchAlerts, 30000);
    return () => clearInterval(int);
  }, []);

  // Filtrado lógico
  const filteredAlerts = useMemo(() => {
    return alertsList.filter((alert) => {
      // Búsqueda por texto libre (host, desc, subdesc, etc)
      const matchesSearch = 
        (alert.host || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (alert.desc || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (alert.hostSub || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filtro por Severidad
      const matchesSev = filterSev === "TODAS" || alert.sev === filterSev;
      
      // Filtro por Estado
      const matchesStatus = filterStatus === "TODAS" || alert.status === filterStatus;
      
      // Filtro por Fuente
      const matchesSource = filterSource === "TODAS" || alert.source === filterSource;

      return matchesSearch && matchesSev && matchesStatus && matchesSource;
    });
  }, [searchTerm, filterSev, filterStatus, filterSource, alertsList]);

  // Paginación lógica
  const totalItems = filteredAlerts.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage) || 1;
  
  // Seguridad si currentPage excede el nuevo total de páginas al filtrar
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const startIndex = (safeCurrentPage - 1) * rowsPerPage;
  const currentItems = filteredAlerts.slice(startIndex, startIndex + rowsPerPage);

  // Funciones de navegación
  const handlePrevPage = () => {
    if (safeCurrentPage > 1) setCurrentPage(safeCurrentPage - 1);
  };

  const handleNextPage = () => {
    if (safeCurrentPage < totalPages) setCurrentPage(safeCurrentPage + 1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setFilterSev("TODAS");
    setFilterStatus("ACTIVAS");
    setFilterSource("TODAS");
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Header and Actions */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-barlow-condensed text-vepagos-navy uppercase tracking-wide">
            Centro de Alertas
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Visualiza y gestiona todas las alertas activas en la plataforma.
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline" className="font-bold uppercase tracking-wider text-xs h-[38px] px-4 rounded-[var(--radius-pill)]">
            <Settings className="w-4 h-4 mr-2" />
            Configurar Reglas
          </Button>
          <Button variant="primary" className="font-bold uppercase tracking-wider text-xs h-[38px] px-4 rounded-[var(--radius-pill)]">
            <Check className="w-4 h-4 mr-2" />
            Marcar todas como leídas
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Alertas Activas */}
        <Card className="p-4 flex flex-col justify-between border-b-4 border-b-vepagos-navy">
          <div className="text-[10px] font-bold text-vepagos-navy uppercase tracking-widest text-center mb-2">Total Registros</div>
          <div className="flex items-center justify-center space-x-4 flex-1">
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
              <BellRing className="w-5 h-5 text-indigo-500" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-vepagos-navy leading-none">{alertsList.length}</div>
            </div>
          </div>
        </Card>

        {/* Criticas */}
        <Card className="p-4 flex flex-col justify-between border-b-4 border-b-red-500">
          <div className="text-[10px] font-bold text-vepagos-navy uppercase tracking-widest text-center mb-2">Críticas (Histórico)</div>
          <div className="flex items-center justify-center space-x-4 flex-1">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-500 leading-none">
                {alertsList.filter(a => a.sev === "CRÍTICO").length}
              </div>
            </div>
          </div>
        </Card>

        {/* Advertencias */}
        <Card className="p-4 flex flex-col justify-between border-b-4 border-b-amber-500">
          <div className="text-[10px] font-bold text-vepagos-navy uppercase tracking-widest text-center mb-2">Advertencias</div>
          <div className="flex items-center justify-center space-x-4 flex-1">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-500 leading-none">
                {alertsList.filter(a => a.sev === "ADVERTENCIA").length}
              </div>
            </div>
          </div>
        </Card>

        {/* Informativas */}
        <Card className="p-4 flex flex-col justify-between border-b-4 border-b-blue-500">
          <div className="text-[10px] font-bold text-vepagos-navy uppercase tracking-widest text-center mb-2">Informativas</div>
          <div className="flex items-center justify-center space-x-4 flex-1">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <Info className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-500 leading-none">
                {alertsList.filter(a => a.sev === "INFORMATIVO").length}
              </div>
            </div>
          </div>
        </Card>

        {/* Resueltas */}
        <Card className="p-4 flex flex-col justify-between border-b-4 border-b-vepagos-green">
          <div className="text-[10px] font-bold text-vepagos-navy uppercase tracking-widest text-center mb-2">Resueltas Hoy</div>
          <div className="flex items-center justify-center space-x-4 flex-1">
            <div className="w-10 h-10 rounded-full bg-vepagos-green/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-vepagos-green" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-vepagos-green leading-none">
                {alertsList.filter(a => a.status === "RESUELTA").length}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Alerts Table Section */}
      <div className="bg-white rounded-[var(--radius-card)] border border-gray-100 shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
          <div className="relative w-full md:w-[350px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por host, servicio o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-[var(--radius-input)] text-xs focus:outline-none focus:ring-1 focus:ring-vepagos-green focus:border-vepagos-green transition-all"
            />
          </div>
          
          <div className="flex items-center space-x-3 flex-wrap">
            <div className="flex flex-col relative">
              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest absolute -top-2 left-2 bg-white px-1 z-10 pointer-events-none">Severidad</label>
              <select 
                value={filterSev}
                onChange={(e) => { setFilterSev(e.target.value); setCurrentPage(1); }}
                className="appearance-none border border-gray-200 rounded px-3 py-2 w-32 cursor-pointer mt-1 text-xs font-bold text-vepagos-navy bg-white focus:outline-none focus:border-vepagos-green"
              >
                <option value="TODAS">TODAS</option>
                <option value="CRÍTICO">CRÍTICAS</option>
                <option value="ADVERTENCIA">ADVERTENCIAS</option>
                <option value="INFORMATIVO">INFORMATIVAS</option>
              </select>
            </div>
            
            <div className="flex flex-col relative">
              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest absolute -top-2 left-2 bg-white px-1 z-10 pointer-events-none">Estado</label>
              <select 
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                className="appearance-none border border-gray-200 rounded px-3 py-2 w-32 cursor-pointer mt-1 text-xs font-bold text-vepagos-navy bg-white focus:outline-none focus:border-vepagos-green"
              >
                <option value="TODAS">TODOS</option>
                <option value="ACTIVA">ACTIVAS</option>
                <option value="RESUELTA">RESUELTAS</option>
              </select>
            </div>
            
            <div className="flex flex-col relative">
              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest absolute -top-2 left-2 bg-white px-1 z-10 pointer-events-none">Fuente</label>
              <select 
                value={filterSource}
                onChange={(e) => { setFilterSource(e.target.value); setCurrentPage(1); }}
                className="appearance-none border border-gray-200 rounded px-3 py-2 w-32 cursor-pointer mt-1 text-xs font-bold text-vepagos-navy bg-white focus:outline-none focus:border-vepagos-green"
              >
                <option value="TODAS">TODAS</option>
                <option value="PROMETHEUS">PROMETHEUS</option>
                <option value="UPTIME KUMA">UPTIME KUMA</option>
                <option value="N8N">N8N</option>
              </select>
            </div>
            
            <button 
              onClick={handleResetFilters}
              className="flex items-center text-gray-500 hover:text-vepagos-navy text-xs font-bold transition-colors ml-2 mt-1"
            >
              <Filter className="w-3 h-3 mr-1" />
              LIMPIAR FILTROS
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-bold text-vepagos-navy uppercase tracking-widest">Severidad</th>
                <th className="px-4 py-4 text-[10px] font-bold text-vepagos-navy uppercase tracking-widest flex items-center">
                  Fecha / Hora <ArrowDown className="w-3 h-3 ml-1" />
                </th>
                <th className="px-4 py-4 text-[10px] font-bold text-vepagos-navy uppercase tracking-widest">Fuente</th>
                <th className="px-4 py-4 text-[10px] font-bold text-vepagos-navy uppercase tracking-widest">Host / Servicio</th>
                <th className="px-4 py-4 text-[10px] font-bold text-vepagos-navy uppercase tracking-widest">Descripción</th>
                <th className="px-4 py-4 text-[10px] font-bold text-vepagos-navy uppercase tracking-widest">Estado</th>
                <th className="px-4 py-4 text-[10px] font-bold text-vepagos-navy uppercase tracking-widest">Duración</th>
                <th className="px-6 py-4 text-[10px] font-bold text-vepagos-navy uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {currentItems.length > 0 ? (
                currentItems.map((alert) => (
                  <tr key={alert.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-3">
                      <Badge variant={alert.sevVar as any}>{alert.sev}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-bold text-vepagos-navy uppercase">{alert.date}</div>
                      <div className="text-[10px] text-gray-400">{alert.time}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[9px] font-bold px-2 py-1 rounded uppercase ${alert.sourceCol}`}>{alert.source}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-bold text-vepagos-navy uppercase">{alert.host}</div>
                      <div className="text-[10px] text-gray-400 truncate w-40" title={alert.hostSub}>{alert.hostSub}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-bold text-vepagos-navy">{alert.desc}</div>
                      <div className="text-[10px] text-gray-500">{alert.descSub}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold uppercase ${alert.status === 'ACTIVA' ? 'text-red-500' : 'text-vepagos-green'}`}>
                        {alert.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold text-vepagos-navy">{alert.duration}</span>
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
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm font-bold text-gray-400">
                    No se encontraron alertas con los filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-widest gap-4">
          <div>
            Mostrando {totalItems === 0 ? 0 : startIndex + 1} a {Math.min(startIndex + rowsPerPage, totalItems)} de {totalItems} Alertas
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={handlePrevPage}
              disabled={safeCurrentPage === 1}
              className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent rounded text-gray-400"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button 
                key={page}
                onClick={() => handlePageChange(page)}
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
              onClick={handleNextPage}
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
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <ChevronDown className="w-3 h-3 text-gray-400 absolute right-1.5 top-1.5 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
