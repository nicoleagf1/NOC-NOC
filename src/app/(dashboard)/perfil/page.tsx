"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { User, Mail, Shield, Briefcase, Loader2, Edit2, Save, X } from "lucide-react";

export default function PerfilPage() {
  const [user, setUser] = useState<{ id?: string, firstName?: string, lastName?: string, roleName?: string, username?: string, email?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: ""
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = () => {
    fetch("/api/auth/me")
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
          setEditForm({
            firstName: data.user.firstName || "",
            lastName: data.user.lastName || "",
            username: data.user.username || "",
            email: data.user.email || ""
          });
        }
        setIsLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setIsLoading(false);
      });
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      
      if (res.ok) {
        setIsEditing(false);
        fetchProfile(); // Refrescar los datos
      } else {
        const data = await res.json();
        alert(data.error || "Error al actualizar perfil");
      }
    } catch (e) {
      console.error(e);
      alert("Error de conexión");
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = () => {
    if (!user?.firstName || !user?.lastName) return "U";
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-vepagos-green" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold font-barlow-condensed text-vepagos-navy uppercase tracking-wide">
            Mi Perfil
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Información personal y detalles de tu cuenta en NOC-NOC.
          </p>
        </div>
        
        {!isEditing ? (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center px-4 py-2 bg-vepagos-navy text-white text-sm font-bold rounded-lg hover:bg-vepagos-navy/90 transition-colors"
          >
            <Edit2 className="w-4 h-4 mr-2" /> Editar
          </button>
        ) : (
          <div className="flex gap-2">
            <button 
              onClick={() => setIsEditing(false)}
              className="flex items-center px-4 py-2 bg-gray-100 text-gray-600 text-sm font-bold rounded-lg hover:bg-gray-200 transition-colors"
              disabled={isSaving}
            >
              <X className="w-4 h-4 mr-1" /> Cancelar
            </button>
            <button 
              onClick={handleSave}
              className="flex items-center px-4 py-2 bg-vepagos-green text-vepagos-navy text-sm font-bold rounded-lg hover:brightness-110 transition-colors disabled:opacity-50"
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Guardar
            </button>
          </div>
        )}
      </div>

      <Card className="p-8 border-t-4 border-t-vepagos-green shadow-sm">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Avatar Area */}
          <div className="flex flex-col items-center space-y-4">
            <div className="w-32 h-32 rounded-full bg-vepagos-navy text-white flex items-center justify-center text-5xl font-bold shadow-lg border-4 border-white ring-2 ring-gray-100">
              {getInitials()}
            </div>
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-50 text-vepagos-green text-xs font-bold uppercase tracking-wider">
              Activo
            </div>
          </div>

          {/* User Details Area */}
          <div className="flex-1 space-y-6 w-full">
            <div>
              <h2 className="text-2xl font-bold text-vepagos-navy">
                {user?.firstName} {user?.lastName}
              </h2>
              {isEditing ? (
                <div className="mt-2 relative max-w-xs">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                  <input 
                    type="text" 
                    value={editForm.username}
                    onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                    className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-vepagos-green focus:border-transparent outline-none"
                    placeholder="Username"
                  />
                </div>
              ) : (
                <p className="text-gray-500 font-medium text-sm flex items-center mt-1">
                  <User className="w-4 h-4 mr-1.5" />
                  @{user?.username}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
              <div className="space-y-1">
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider flex items-center">
                  <Briefcase className="w-3.5 h-3.5 mr-1" /> Nombre
                </span>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-vepagos-green focus:border-transparent outline-none"
                  />
                ) : (
                  <p className="font-semibold text-gray-800">{user?.firstName}</p>
                )}
              </div>
              <div className="space-y-1">
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider flex items-center">
                  <Briefcase className="w-3.5 h-3.5 mr-1" /> Apellido
                </span>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-vepagos-green focus:border-transparent outline-none"
                  />
                ) : (
                  <p className="font-semibold text-gray-800">{user?.lastName}</p>
                )}
              </div>
              <div className="space-y-1">
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider flex items-center">
                  <Mail className="w-3.5 h-3.5 mr-1" /> Email
                </span>
                {isEditing ? (
                  <input 
                    type="email" 
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-vepagos-green focus:border-transparent outline-none"
                  />
                ) : (
                  <p className="font-semibold text-gray-800">{user?.email || "No registrado"}</p>
                )}
              </div>
              <div className="space-y-1">
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider flex items-center">
                  <Shield className="w-3.5 h-3.5 mr-1" /> Rol de Sistema
                </span>
                <p className="font-semibold text-gray-800 capitalize bg-gray-50 px-2 py-1 rounded inline-block">{user?.roleName}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
