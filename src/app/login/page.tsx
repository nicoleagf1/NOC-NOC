"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, AlertCircle, Activity, Bell, BarChart3, ShieldCheck, Radar } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const errorParam = searchParams.get('error');
      if (errorParam === 'no_cookie') {
        setError('Error de sesión: La cookie de autenticación no se pudo guardar. Verifica SSL o IP.');
      } else if (errorParam?.startsWith('token_failed')) {
        setError(`Error de sesión: Token inválido (${errorParam}). Verifica la configuración de APP_SECRET en el servidor.`);
      }
    }
  }, []);

  // States para Formulario de Login
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // States para Cambio Obligatorio de Clave
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  // States para Recuperar Contraseña
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotUsername, setForgotUsername] = useState("");
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setForgotMessage(null);

    try {
      const res = await fetch("/api/auth/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernameOrEmail: forgotUsername }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Ocurrió un error al procesar la solicitud");
        return;
      }

      setForgotMessage(data.message || "Si el usuario existe, se enviarán las instrucciones a su correo.");
      setForgotUsername("");
    } catch (err: any) {
      setError("Error de red. Intenta nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Credenciales inválidas");
        return;
      }

      if (data.mustChangePassword) {
        setRequiresPasswordChange(true);
        setUserId(data.userId);
      } else if (data.success) {
        window.location.href = "/";
      }
    } catch (err: any) {
      setError("Error de red. Intenta nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, newPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "No se pudo cambiar la contraseña");
        return;
      }

      if (data.success) {
        window.location.href = "/";
      }
    } catch (err: any) {
      setError("Error de red. Intenta nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-barlow selection:bg-[#00CE7C] selection:text-[#001F60]">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
      {/* Panel Izquierdo - Identidad Vepagos */}
      <div className="w-full md:w-[50%] bg-gradient-to-b from-[#001F60] to-[#0A1635] flex flex-col justify-between p-10 lg:p-16 xl:p-24 relative overflow-hidden order-1 md:order-1">

        {/* Radar / HUD Decorativo */}
        <div className="absolute -bottom-[20%] -left-[10%] opacity-20 pointer-events-none select-none">
          <Radar className="w-[400px] h-[400px] text-[#00CE7C] stroke-[0.5]" />
          <div className="absolute inset-0 rounded-full border border-[#00CE7C]/30 animate-[ping_4s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
          <div className="absolute inset-8 rounded-full border border-[#00CE7C]/20"></div>
          <div className="absolute inset-16 rounded-full border border-[#00CE7C]/10"></div>
        </div>

        {/* Decorativo: Grilla sutil en el fondo */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03] select-none"
          style={{ backgroundImage: "linear-gradient(#00CE7C 1px, transparent 1px), linear-gradient(90deg, #00CE7C 1px, transparent 1px)", backgroundSize: "40px 40px" }}
        ></div>

        <div className="relative z-10 flex flex-col h-full justify-center -mt-8 md:-mt-16 lg:-mt-24 xl:-mt-32 w-fit mx-auto">
          {/* Logo y Encabezado */}
          <div className="mb-12">
            <img
              src="/logo.png"
              alt="Vepagos Logo"
              className="w-auto h-auto max-w-[340px] max-h-[340px] object-contain mb-2 lg:mb-3"
            />

            <h1 className="text-[48px] lg:text-[60px] font-barlow-condensed font-bold text-white tracking-[2px] leading-none mb-2">
              NOC-NOC
            </h1>
            <p className="text-[20px] lg:text-[24px] font-barlow font-medium text-[#00CE7C] tracking-[4px] uppercase">
              Centro de Monitoreo
            </p>
          </div>

          {/* Bloques de Valor */}
          <div className="flex flex-col space-y-8 lg:space-y-10">
            <div className="flex items-start space-x-4">
              <div className="mt-1 flex-shrink-0">
                <Activity className="w-6 h-6 text-[#00CE7C] stroke-[1.5]" />
              </div>
              <div>
                <h3 className="text-[16px] lg:text-[18px] font-barlow-condensed font-bold text-white uppercase tracking-wider mb-1">
                  Monitoreo en Tiempo Real
                </h3>
                <p className="text-[14px] lg:text-[15px] font-barlow text-[#E5E9F2]/80">
                  Visibilidad total de tu infraestructura
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="mt-1 flex-shrink-0">
                <Bell className="w-6 h-6 text-[#00CE7C] stroke-[1.5]" />
              </div>
              <div>
                <h3 className="text-[16px] lg:text-[18px] font-barlow-condensed font-bold text-white uppercase tracking-wider mb-1">
                  Alertas Inteligentes
                </h3>
                <p className="text-[14px] lg:text-[15px] font-barlow text-[#E5E9F2]/80">
                  Notificaciones proactivas y oportunas
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="mt-1 flex-shrink-0">
                <BarChart3 className="w-6 h-6 text-[#00CE7C] stroke-[1.5]" />
              </div>
              <div>
                <h3 className="text-[16px] lg:text-[18px] font-barlow-condensed font-bold text-white uppercase tracking-wider mb-1">
                  Observabilidad Avanzada
                </h3>
                <p className="text-[14px] lg:text-[15px] font-barlow text-[#E5E9F2]/80">
                  Métricas, eventos y estado centralizados
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Panel Derecho - Autenticación */}
      <div className="w-full md:w-[50%] bg-[#FFFFFF] flex flex-col justify-center items-center p-6 md:p-12 lg:p-20 relative order-2 md:order-2 min-h-screen md:min-h-0">

        <div className="w-full max-w-[440px]">

          <div className="mb-10">
            <h2 className="text-[40px] md:text-[48px] font-barlow-condensed font-bold text-[#001F60] uppercase leading-none">
              {isForgotPassword 
                ? "RECUPERAR CONTRASEÑA" 
                : !requiresPasswordChange 
                  ? "INICIAR SESIÓN" 
                  : "ACTUALIZAR CONTRASEÑA"}
            </h2>
            <div className="w-16 h-1 bg-[#00CE7C] mt-4 mb-4 rounded-full"></div>
            <p className="text-[16px] text-[#001F60] font-medium opacity-80">
              {isForgotPassword
                ? "Ingresa tu usuario o correo para recibir las instrucciones."
                : !requiresPasswordChange 
                  ? "Ingresa tus credenciales para acceder a la plataforma NOC-NOC."
                  : "Por seguridad, debe cambiar su contraseña predeterminada antes de continuar."}
            </p>
          </div>

          <div className="bg-white rounded-[14px] shadow-[0_10px_40px_rgba(0,31,96,0.08)] p-8 border border-[#E5E9F2]/50">
            {error && (
              <div className="mb-6 bg-red-50 text-red-600 border border-red-200 text-sm px-4 py-3 rounded-[10px] flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {!isForgotPassword && !requiresPasswordChange ? (
              // PASO 1: LOGIN NORMAL
              <form className="space-y-5 animate-fade-in" onSubmit={handleLogin}>
                {/* Campo Usuario */}
                <div className="flex flex-col space-y-2">
                  <label className="text-[14px] font-barlow-condensed font-bold text-[#001F60] uppercase tracking-wide">
                    USUARIO
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ingrese su usuario"
                    className="w-full h-[52px] px-4 bg-white border-[1.5px] border-[#E5E9F2] rounded-[10px] text-[16px] text-[#001F60] placeholder:text-[#6E7B99] focus:outline-none focus:border-[#00CE7C] focus:ring-[3px] focus:ring-[#00CE7C]/10 transition-all duration-200"
                  />
                </div>

                {/* Campo Contraseña */}
                <div className="flex flex-col space-y-2">
                  <label className="text-[14px] font-barlow-condensed font-bold text-[#001F60] uppercase tracking-wide">
                    CONTRASEÑA
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Ingrese su contraseña"
                      className="w-full h-[52px] pl-4 pr-12 bg-white border-[1.5px] border-[#E5E9F2] rounded-[10px] text-[16px] text-[#001F60] placeholder:text-[#6E7B99] focus:outline-none focus:border-[#00CE7C] focus:ring-[3px] focus:ring-[#00CE7C]/10 transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center justify-center text-[#6E7B99] hover:text-[#00CE7C] transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Extras (Recordarme & Olvidó Contraseña) */}
                <div className="flex items-center justify-between pt-1 pb-2">
                  <label className="flex items-center space-x-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded-[4px] border-[#E5E9F2] text-[#00CE7C] focus:ring-[#00CE7C] cursor-pointer"
                    />
                    <span className="text-[14px] font-barlow-condensed font-bold text-[#6E7B99] group-hover:text-[#00CE7C] transition-colors tracking-wide uppercase">
                      RECORDARME
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={(e) => { 
                      e.preventDefault();
                      setTimeout(() => {
                        setIsForgotPassword(true); 
                        setError(null); 
                        setIsLoading(false);
                      }, 50);
                    }}
                    className="text-[14px] text-[#001F60] hover:text-[#00CE7C] transition-colors font-medium"
                  >
                    ¿OLVIDÓ SU CONTRASEÑA?
                  </button>
                </div>

                {/* Botón Iniciar Sesión */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-[56px] bg-[#00CE7C] hover:bg-[#00B36C] text-[#001F60] rounded-[999px] font-barlow-condensed font-bold text-[18px] uppercase tracking-wider transition-colors duration-200 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed group"
                  >
                    {isLoading ? "VALIDANDO..." : "INICIAR SESIÓN"}
                    {!isLoading && <span className="ml-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200">→</span>}
                  </button>
                </div>

                {/* Indicador de Acceso Seguro */}
                <div className="flex items-center justify-center pt-6 space-x-2">
                  <ShieldCheck className="w-4 h-4 text-[#00CE7C]" />
                  <span className="text-[13px] font-barlow-condensed font-bold text-[#001F60] uppercase tracking-wider">
                    ACCESO SEGURO
                  </span>
                </div>
              </form>
            ) : isForgotPassword ? (
              // PASO: RECUPERAR CONTRASEÑA
              <form className="space-y-5 animate-fade-in" onSubmit={handleForgotPassword}>
                {forgotMessage && (
                  <div className="mb-6 bg-green-50 text-green-700 border border-green-200 text-sm px-4 py-3 rounded-[10px]">
                    {forgotMessage}
                  </div>
                )}
                
                <div className="flex flex-col space-y-2">
                  <label className="text-[14px] font-barlow-condensed font-bold text-[#001F60] uppercase tracking-wide">
                    USUARIO O CORREO
                  </label>
                  <input
                    type="text"
                    required
                    value={forgotUsername}
                    onChange={(e) => setForgotUsername(e.target.value)}
                    placeholder="Ingrese su usuario o correo"
                    className="w-full h-[52px] px-4 bg-white border-[1.5px] border-[#E5E9F2] rounded-[10px] text-[16px] text-[#001F60] placeholder:text-[#6E7B99] focus:outline-none focus:border-[#00CE7C] focus:ring-[3px] focus:ring-[#00CE7C]/10 transition-all duration-200"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-[56px] bg-[#00CE7C] hover:bg-[#00B36C] text-[#001F60] rounded-[999px] font-barlow-condensed font-bold text-[18px] uppercase tracking-wider transition-colors duration-200 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed group"
                  >
                    {isLoading ? "ENVIANDO..." : "RECUPERAR CONTRASEÑA"}
                    {!isLoading && <span className="ml-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200">→</span>}
                  </button>
                </div>
                
                <div className="flex items-center justify-center pt-4">
                  <button 
                    type="button" 
                    onClick={(e) => { 
                      e.preventDefault();
                      setTimeout(() => {
                        setIsForgotPassword(false); 
                        setForgotMessage(null); 
                        setError(null);
                        setIsLoading(false);
                      }, 50);
                    }}
                    className="text-[14px] font-barlow-condensed font-bold text-[#001F60] hover:text-[#00CE7C] transition-colors tracking-wide uppercase underline"
                  >
                    VOLVER A INICIAR SESIÓN
                  </button>
                </div>
              </form>
            ) : (
              // PASO 2: CAMBIO DE CONTRASEÑA OBLIGATORIO
              <form className="space-y-5 animate-fade-in" onSubmit={handleChangePassword}>
                {/* Nueva Contraseña */}
                <div className="flex flex-col space-y-2">
                  <label className="text-[14px] font-barlow-condensed font-bold text-[#001F60] uppercase tracking-wide">
                    NUEVA CONTRASEÑA
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full h-[52px] pl-4 pr-12 bg-white border-[1.5px] border-[#E5E9F2] rounded-[10px] text-[16px] text-[#001F60] placeholder:text-[#6E7B99] focus:outline-none focus:border-[#00CE7C] focus:ring-[3px] focus:ring-[#00CE7C]/10 transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#6E7B99] hover:text-[#00CE7C] transition-colors"
                    >
                      {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Confirmar Contraseña */}
                <div className="flex flex-col space-y-2">
                  <label className="text-[14px] font-barlow-condensed font-bold text-[#001F60] uppercase tracking-wide">
                    CONFIRMAR CONTRASEÑA
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirma la nueva contraseña"
                      className="w-full h-[52px] pl-4 pr-12 bg-white border-[1.5px] border-[#E5E9F2] rounded-[10px] text-[16px] text-[#001F60] placeholder:text-[#6E7B99] focus:outline-none focus:border-[#00CE7C] focus:ring-[3px] focus:ring-[#00CE7C]/10 transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-[56px] bg-[#00CE7C] hover:bg-[#00B36C] text-[#001F60] rounded-[999px] font-barlow-condensed font-bold text-[18px] uppercase tracking-wider transition-colors duration-200 flex items-center justify-center disabled:opacity-70 group"
                  >
                    {isLoading ? "GUARDANDO..." : "GUARDAR Y ENTRAR"}
                    {!isLoading && <span className="ml-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200">→</span>}
                  </button>
                </div>

                {/* Indicador de Acceso Seguro */}
                <div className="flex items-center justify-center pt-6 space-x-2">
                  <ShieldCheck className="w-4 h-4 text-[#00CE7C]" />
                  <span className="text-[13px] font-barlow-condensed font-bold text-[#001F60] uppercase tracking-wider">
                    ACCESO SEGURO
                  </span>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Footer Panel Derecho */}
        <div className="absolute bottom-6 md:bottom-10 w-full text-center">
          <p className="text-[13px] text-[#001F60]/60 font-barlow uppercase tracking-widest">
            © 2026 VEPAGOS • TODOS LOS DERECHOS RESERVADOS
          </p>
        </div>
      </div>
    </div>
  );
}

