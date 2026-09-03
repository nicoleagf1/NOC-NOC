"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Card } from "@/components/ui/card";
import { User, Mail, Shield, Briefcase, Loader2, Edit2, Save, X, Lock, Key, AlertTriangle } from "lucide-react";

export default function PerfilPage() {
  const [user, setUser] = useState<{ id?: string, firstName?: string, lastName?: string, roleName?: string, username?: string, email?: string, isTwoFactorEnabled?: boolean } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: ""
  });

  // 2FA States
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [twoFactorSecret, setTwoFactorSecret] = useState<string | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [isProcessing2FA, setIsProcessing2FA] = useState(false);
  
  // 2FA Disable States
  const [showDisable2FAModal, setShowDisable2FAModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");

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

  const handleGenerate2FA = async () => {
    setIsProcessing2FA(true);
    try {
      const res = await fetch("/api/auth/2fa/generate");
      const data = await res.json();
      if (res.ok) {
        setQrCode(data.qrDataUrl);
        setTwoFactorSecret(data.secret);
        setShow2FAModal(true);
      } else {
        alert(data.error || "Error al generar 2FA");
      }
    } catch (e) {
      alert("Error de conexión");
    } finally {
      setIsProcessing2FA(false);
    }
  };

  const handleEnable2FA = async () => {
    if (twoFactorCode.length !== 6) return;
    setIsProcessing2FA(true);
    try {
      const res = await fetch("/api/auth/2fa/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: twoFactorSecret, code: twoFactorCode })
      });
      const data = await res.json();
      if (res.ok) {
        alert("Autenticación de Dos Factores habilitada correctamente.");
        setShow2FAModal(false);
        setTwoFactorCode("");
        fetchProfile();
      } else {
        alert(data.error || "Código inválido");
      }
    } catch (e) {
      alert("Error de conexión");
    } finally {
      setIsProcessing2FA(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!currentPassword) return;
    setIsProcessing2FA(true);
    try {
      const res = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: currentPassword })
      });
      const data = await res.json();
      if (res.ok) {
        alert("Autenticación de Dos Factores deshabilitada.");
        setShowDisable2FAModal(false);
        setCurrentPassword("");
        fetchProfile();
      } else {
        alert(data.error || "Error al deshabilitar. Verifica tu contraseña.");
      }
    } catch (e) {
      alert("Error de conexión");
    } finally {
      setIsProcessing2FA(false);
    }
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
              {/* Rest of user details */}
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

            {/* SECCIÓN 2FA */}
            {!isEditing && (
              <div className="pt-6 border-t border-gray-100 mt-6">
                <h3 className="text-lg font-bold font-barlow-condensed text-vepagos-navy flex items-center mb-4 uppercase">
                  <Lock className="w-5 h-5 mr-2 text-vepagos-green" /> Seguridad de Cuenta (2FA)
                </h3>
                
                <div className={`p-5 rounded-xl border ${user?.isTwoFactorEnabled ? 'bg-green-50/50 border-green-200' : 'bg-gray-50 border-gray-200'} flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
                  <div>
                    <h4 className="font-bold text-gray-800 flex items-center">
                      Autenticación de Dos Factores 
                      {user?.isTwoFactorEnabled && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Activado
                        </span>
                      )}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1 max-w-md">
                      Añade una capa adicional de seguridad requerida para iniciar sesión, protegiendo tu cuenta de accesos no autorizados.
                    </p>
                  </div>
                  
                  <div>
                    {user?.isTwoFactorEnabled ? (
                      <button 
                        onClick={() => setShowDisable2FAModal(true)}
                        className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 text-sm font-bold rounded-lg transition-colors whitespace-nowrap"
                      >
                        Desactivar 2FA
                      </button>
                    ) : (
                      <button 
                        onClick={handleGenerate2FA}
                        disabled={isProcessing2FA}
                        className="flex items-center justify-center px-4 py-2 bg-vepagos-green text-vepagos-navy hover:brightness-110 text-sm font-bold rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
                      >
                        {isProcessing2FA ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
                        Configurar 2FA
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
            
          </div>
        </div>
      </Card>

      {/* MODAL CONFIGURAR 2FA */}
      {show2FAModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-vepagos-navy/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-gray-100 max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold font-barlow-condensed text-vepagos-navy uppercase flex items-center">
                <Key className="w-5 h-5 mr-2 text-vepagos-green" /> Configurar Autenticador
              </h3>
              <button onClick={() => setShow2FAModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                1. Instala una aplicación como <strong>Google Authenticator</strong> o <strong>Authy</strong> en tu teléfono.
              </p>
              <p className="text-sm text-gray-600">
                2. Escanea este código QR con la aplicación:
              </p>
              
              {qrCode ? (
                <div className="flex justify-center bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <img src={qrCode} alt="QR Code 2FA" className="w-48 h-48" />
                </div>
              ) : (
                <div className="w-48 h-48 mx-auto bg-gray-100 animate-pulse rounded-lg" />
              )}
              
              <div className="pt-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">
                  3. Ingresa el código de 6 dígitos
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full text-center text-2xl tracking-[0.5em] py-3 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vepagos-green focus:border-transparent outline-none"
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <button 
                onClick={() => setShow2FAModal(false)}
                className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button 
                onClick={handleEnable2FA}
                disabled={twoFactorCode.length !== 6 || isProcessing2FA}
                className="flex items-center px-6 py-2 bg-vepagos-green text-vepagos-navy text-sm font-bold rounded-lg hover:brightness-110 disabled:opacity-50"
              >
                {isProcessing2FA ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Verificar y Activar
              </button>
            </div>
          </div>
        </div>, document.body
      )}

      {/* MODAL DESACTIVAR 2FA */}
      {showDisable2FAModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-vepagos-navy/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-gray-100 max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center text-red-600 mb-4">
              <AlertTriangle className="w-6 h-6 mr-2" />
              <h3 className="text-xl font-bold font-barlow-condensed uppercase">
                Desactivar 2FA
              </h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Estás a punto de reducir la seguridad de tu cuenta. Por favor, ingresa tu contraseña actual para confirmar.
            </p>
            
            <div className="mb-6">
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Contraseña actual"
                className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowDisable2FAModal(false)}
                className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDisable2FA}
                disabled={!currentPassword || isProcessing2FA}
                className="flex items-center px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isProcessing2FA ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Sí, desactivar
              </button>
            </div>
          </div>
        </div>, document.body
      )}
    </div>
  );
}
