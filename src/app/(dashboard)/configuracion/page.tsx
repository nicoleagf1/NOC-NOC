"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Settings2, 
  Bell, 
  Users as UsersIcon, 
  ShieldCheck, 
  FileText,
  Activity,
  CheckCircle2,
  ExternalLink,
  Edit2,
  Trash2,
  MoreVertical,
  Link2,
  ChevronDown,
  X,
  AlertCircle
} from "lucide-react";
import { ConnectionDTO } from "@/lib/types/connection";
import { HostsTab } from "@/components/configuracion/HostsTab";
import { ServicesTab } from "@/components/configuracion/ServicesTab";
export default function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState("integraciones");
  
  // =====================
  // STATE: INTEGRACIONES
  // =====================
  const [connections, setConnections] = useState<ConnectionDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<Partial<ConnectionDTO> | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // =====================
  // STATE: USUARIOS
  // =====================
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  useEffect(() => {
    if (activeTab === "integraciones") fetchConnections();
    if (activeTab === "usuarios") {
      fetchUsers();
      fetchRoles();
    }
  }, [activeTab]);

  // --- MÉTODOS INTEGRACIONES ---
  const fetchConnections = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/connections");
      if (res.ok) {
        const data = await res.json();
        setConnections(data);
      }
    } catch (e) {
      console.error("Error fetching connections", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/connections/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive })
      });
      if (res.ok) fetchConnections();
    } catch (e) {
      console.error("Error toggling connection", e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta integración?")) return;
    try {
      const res = await fetch(`/api/connections/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchConnections();
        setIsModalOpen(false);
      }
    } catch (e) {
      console.error("Error deleting connection", e);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/connections/test", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingConnection)
      });
      const data = await res.json();
      setTestResult({ success: data.success, message: data.success ? data.message : data.error });
    } catch (e: any) {
      setTestResult({ success: false, message: e.message || "Error al probar la conexión" });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveConnection = async () => {
    try {
      const isNew = !editingConnection?.id;
      const url = isNew ? "/api/connections" : `/api/connections/${editingConnection.id}`;
      const method = isNew ? "POST" : "PUT";
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingConnection)
      });
      
      if (res.ok) {
        fetchConnections();
        setIsModalOpen(false);
      } else {
        const data = await res.json();
        alert(data.error || "Error al guardar");
      }
    } catch (e) {
      console.error("Error saving", e);
    }
  };

  const openNewModal = () => {
    setEditingConnection({ type: 'prometheus', authType: 'none', isActive: true });
    setTestResult(null);
    setIsModalOpen(true);
  };

  // --- MÉTODOS USUARIOS ---
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/users");
      if (res.ok) setUsers(await res.json());
    } catch (e) {
      console.error("Error fetching users", e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch("/api/roles");
      if (res.ok) setRoles(await res.json());
    } catch (e) {
      console.error("Error fetching roles", e);
    }
  };

  const handleToggleUserActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive })
      });
      if (res.ok) fetchUsers();
    } catch (e) {
      console.error("Error toggling user", e);
    }
  };

  const handleSaveUser = async () => {
    try {
      const isNew = !editingUser?.id;
      const url = isNew ? "/api/users" : `/api/users/${editingUser.id}`;
      const method = isNew ? "POST" : "PUT";
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingUser)
      });
      
      if (res.ok) {
        fetchUsers();
        setIsUserModalOpen(false);
      } else {
        const data = await res.json();
        alert(data.error || "Error al guardar usuario");
      }
    } catch (e) {
      console.error("Error saving user", e);
    }
  };

  const openNewUserModal = () => {
    setEditingUser({ roleId: roles[0]?.id, isActive: true });
    setIsUserModalOpen(true);
  };

  // UI HELPERS
  const TabButton = ({ id, label }: { id: string, label: string }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`px-6 py-3 text-sm font-bold border-b-2 uppercase tracking-wide whitespace-nowrap transition-colors
        ${activeTab === id 
          ? 'border-vepagos-green text-vepagos-green' 
          : 'border-transparent text-gray-500 hover:text-vepagos-navy hover:border-gray-300'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6 pb-12 relative">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-barlow-condensed text-vepagos-navy uppercase tracking-wide">
          Configuración
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Administra las integraciones, reglas de alerta, usuarios y ajustes generales del sistema.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto no-scrollbar">
        <TabButton id="integraciones" label="Integraciones" />
        <TabButton id="hosts" label="Hosts / Servidores" />
        <TabButton id="servicios" label="Servicios Web" />
        <TabButton id="usuarios" label="Usuarios" />
        <TabButton id="alertas" label="Reglas de Alerta" />
        <TabButton id="sistema" label="Sistema" />
      </div>

      {/* CONTENIDO INTEGRACIONES */}
      {activeTab === "integraciones" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {isLoading ? (
                <div className="col-span-2 text-center text-sm text-gray-500 py-10">Cargando integraciones...</div>
              ) : (
                connections.map(conn => (
                  <Card key={conn.id} className="p-5 flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={conn.isActive} 
                          onChange={() => handleToggleActive(conn.id, conn.isActive)} 
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-vepagos-green"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center mb-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mr-4 ${conn.type === 'prometheus' ? 'bg-orange-100' : 'bg-green-100'}`}>
                        {conn.type === 'prometheus' ? (
                          <Activity className="w-7 h-7 text-orange-500" />
                        ) : (
                          <ShieldCheck className="w-7 h-7 text-green-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-vepagos-navy uppercase">{conn.name}</h3>
                        <div className={`flex items-center text-xs font-bold ${conn.isActive ? 'text-vepagos-green' : 'text-gray-400'}`}>
                          {conn.isActive ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                          {conn.isActive ? 'ACTIVO' : 'INACTIVO'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3 mt-auto">
                      <div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">URL de Endpoint</div>
                        <div className="text-xs text-vepagos-navy flex items-center justify-between border border-gray-100 bg-gray-50 rounded px-2 py-1 mt-1">
                          <span className="truncate">{conn.url}</span>
                          <ExternalLink className="w-3 h-3 text-gray-400 ml-2 flex-shrink-0" />
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        className="w-full h-8 text-xs font-bold uppercase" 
                        size="sm"
                        onClick={() => { setEditingConnection(conn); setIsModalOpen(true); }}
                      >
                        Configurar
                      </Button>
                    </div>
                  </Card>
                ))
              )}

              <div 
                onClick={openNewModal}
                className="border-2 border-dashed border-gray-300 rounded-[var(--radius-card)] p-5 flex flex-col items-center justify-center cursor-pointer hover:border-vepagos-green hover:bg-vepagos-green/5 transition-colors group min-h-[180px]">
                <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-vepagos-green/10 flex items-center justify-center mb-3 transition-colors">
                  <Plus className="w-6 h-6 text-gray-400 group-hover:text-vepagos-green" />
                </div>
                <div className="text-sm font-bold text-gray-500 group-hover:text-vepagos-navy uppercase tracking-wide">Añadir Nueva Integración</div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <Card className="p-0 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-sm font-bold text-vepagos-navy uppercase tracking-wider">Ayuda Rápida</h3>
              </div>
              <div className="p-4 text-xs text-gray-500">
                <p className="mb-2">Asegúrate de que las credenciales de Prometheus tengan permisos de lectura para la API `/api/v1/query`.</p>
                <p>Si cambias el <b>Prometheus Activo</b>, el dashboard y todos sus gráficos se actualizarán instantáneamente para usar la nueva fuente de datos.</p>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* CONTENIDO USUARIOS */}
      {activeTab === "usuarios" && (
        <div className="pt-4">
          <Card className="p-0 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="text-sm font-bold text-vepagos-navy uppercase tracking-wider">Gestión de Usuarios</h3>
                <p className="text-xs text-gray-500">Administra los accesos y roles del sistema.</p>
              </div>
              <Button size="sm" className="bg-vepagos-navy text-white text-xs uppercase font-bold" onClick={openNewUserModal}>
                <Plus className="w-4 h-4 mr-1" /> Nuevo Usuario
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-white text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                    <th className="px-6 py-4">Usuario</th>
                    <th className="px-6 py-4">Rol</th>
                    <th className="px-6 py-4">Último Acceso</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 bg-white">
                  {isLoading ? (
                    <tr><td colSpan={5} className="p-6 text-center text-gray-500 text-xs">Cargando usuarios...</td></tr>
                  ) : users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs mr-3">
                            {user.firstName[0]}{user.lastName[0]}
                          </div>
                          <div>
                            <div className="font-bold text-vepagos-navy">{user.firstName} {user.lastName}</div>
                            <div className="text-xs text-gray-500">{user.email} • @{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={user.roleName === 'ADMIN' ? 'default' : 'secondary'} className="text-[10px] uppercase font-bold tracking-wider">
                          {user.roleName}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Nunca'}
                      </td>
                      <td className="px-6 py-4">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={user.isActive} 
                            onChange={() => handleToggleUserActive(user.id, user.isActive)} 
                          />
                          <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-vepagos-green"></div>
                        </label>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-vepagos-navy" onClick={() => { setEditingUser(user); setIsUserModalOpen(true); }}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* CONTENIDO HOSTS */}
      {activeTab === "hosts" && <HostsTab />}

      {/* CONTENIDO SERVICIOS */}
      {activeTab === "servicios" && <ServicesTab />}

      {/* MODAL INTEGRACIONES */}
      {isModalOpen && editingConnection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md bg-white overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold font-barlow-condensed text-vepagos-navy uppercase tracking-wide">
                {editingConnection.id ? 'Editar Integración' : 'Nueva Integración'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Tipo de Servicio</label>
                <select 
                  className="w-full text-sm border border-gray-200 rounded-md p-2 bg-gray-50"
                  value={editingConnection.type}
                  onChange={e => setEditingConnection({...editingConnection, type: e.target.value as any})}
                >
                  <option value="prometheus">Prometheus TSDB</option>
                  <option value="uptime-kuma">Uptime Kuma</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Nombre Descriptivo</label>
                <input 
                  type="text" 
                  className="w-full text-sm border border-gray-200 rounded-md p-2"
                  placeholder="ej. Prometheus Producción"
                  value={editingConnection.name || ''}
                  onChange={e => setEditingConnection({...editingConnection, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">URL Base (Endpoint)</label>
                <input 
                  type="url" 
                  className="w-full text-sm border border-gray-200 rounded-md p-2"
                  placeholder="https://prometheus.tudominio.com"
                  value={editingConnection.url || ''}
                  onChange={e => setEditingConnection({...editingConnection, url: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Autenticación</label>
                <select 
                  className="w-full text-sm border border-gray-200 rounded-md p-2 bg-gray-50"
                  value={editingConnection.authType || 'none'}
                  onChange={e => setEditingConnection({...editingConnection, authType: e.target.value as any})}
                >
                  <option value="none">Sin Autenticación (Abierto)</option>
                  <option value="basic">Basic Auth (User:Password)</option>
                  <option value="bearer">Bearer Token</option>
                </select>
              </div>

              {editingConnection.authType !== 'none' && (
                <div>
                  {editingConnection.authType === 'basic' ? (
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Usuario</label>
                        <input 
                          type="text" 
                          className="w-full text-sm border border-gray-200 rounded-md p-2 font-mono"
                          placeholder="ej. admin"
                          value={editingConnection.authCredentials ? editingConnection.authCredentials.split(':')[0] : ''}
                          onChange={e => {
                            const currentPass = (editingConnection.authCredentials || '').split(':')[1] || '';
                            setEditingConnection({...editingConnection, authCredentials: `${e.target.value}:${currentPass}`});
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Contraseña</label>
                        <input 
                          type="password" 
                          className="w-full text-sm border border-gray-200 rounded-md p-2 font-mono"
                          placeholder="••••••••"
                          value={editingConnection.authCredentials && editingConnection.authCredentials.includes(':') ? editingConnection.authCredentials.split(':')[1] : editingConnection.authCredentials || ''}
                          onChange={e => {
                            const currentUser = (editingConnection.authCredentials || '').split(':')[0] || '';
                            setEditingConnection({...editingConnection, authCredentials: `${currentUser}:${e.target.value}`});
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                        Token / API Key
                      </label>
                      <input 
                        type="text" 
                        className="w-full text-sm border border-gray-200 rounded-md p-2 font-mono"
                        placeholder="ej. eyJhbGciOiJIUzI1NiIs..."
                        value={editingConnection.authCredentials || ''}
                        onChange={e => setEditingConnection({...editingConnection, authCredentials: e.target.value})}
                      />
                    </div>
                  )}
                  <p className="text-[10px] text-gray-400 mt-1">Dejar en blanco o con •••••••• para no cambiar la credencial actual.</p>
                </div>
              )}

              {testResult && (
                <div className={`p-3 text-xs rounded-md border ${testResult.success ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                  <b>{testResult.success ? 'Conectado:' : 'Error:'}</b> {testResult.message}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex flex-col space-y-2">
              <Button 
                variant="outline" 
                className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
                onClick={handleTestConnection}
                disabled={isTesting || !editingConnection.url}
              >
                {isTesting ? 'Probando...' : 'Probar Conexión'}
              </Button>
              
              <div className="flex gap-2 w-full pt-2">
                {editingConnection.id && (
                  <Button variant="destructive" className="flex-1" onClick={() => handleDelete(editingConnection.id!)}>
                    Eliminar
                  </Button>
                )}
                <Button 
                  className={`flex-[2] bg-vepagos-green text-vepagos-navy hover:bg-[#00b36b]`}
                  onClick={handleSaveConnection}
                  disabled={!editingConnection.name || !editingConnection.url}
                >
                  Guardar Integración
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* MODAL USUARIOS */}
      {isUserModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md bg-white overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold font-barlow-condensed text-vepagos-navy uppercase tracking-wide">
                {editingUser.id ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h2>
              <button onClick={() => setIsUserModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Nombre</label>
                  <input 
                    type="text" 
                    className="w-full text-sm border border-gray-200 rounded-md p-2"
                    value={editingUser.firstName || ''}
                    onChange={e => setEditingUser({...editingUser, firstName: e.target.value})}
                    disabled={!!editingUser.id}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Apellido</label>
                  <input 
                    type="text" 
                    className="w-full text-sm border border-gray-200 rounded-md p-2"
                    value={editingUser.lastName || ''}
                    onChange={e => setEditingUser({...editingUser, lastName: e.target.value})}
                    disabled={!!editingUser.id}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Username (Login)</label>
                <input 
                  type="text" 
                  className="w-full text-sm border border-gray-200 rounded-md p-2"
                  value={editingUser.username || ''}
                  onChange={e => setEditingUser({...editingUser, username: e.target.value})}
                  disabled={!!editingUser.id}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Correo Electrónico</label>
                <input 
                  type="email" 
                  className="w-full text-sm border border-gray-200 rounded-md p-2"
                  value={editingUser.email || ''}
                  onChange={e => setEditingUser({...editingUser, email: e.target.value})}
                  disabled={!!editingUser.id}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Rol del Sistema</label>
                <select 
                  className="w-full text-sm border border-gray-200 rounded-md p-2 bg-gray-50"
                  value={editingUser.roleId || ''}
                  onChange={e => setEditingUser({...editingUser, roleId: Number(e.target.value)})}
                >
                  {roles.map(r => <option key={r.id} value={r.id}>{r.name} - {r.description}</option>)}
                </select>
              </div>

              {!editingUser.id && (
                <div className="p-3 bg-orange-50 border border-orange-100 rounded-md text-xs text-orange-800 flex items-start">
                  <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                  <span>
                    La contraseña temporal será igual al <b>Username</b>. El usuario estará obligado a cambiarla en su primer inicio de sesión.
                  </span>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-2">
              <Button 
                className={`flex-1 bg-vepagos-green text-vepagos-navy hover:bg-[#00b36b]`}
                onClick={handleSaveUser}
                disabled={!editingUser.firstName || !editingUser.username || !editingUser.roleId}
              >
                Guardar Usuario
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
