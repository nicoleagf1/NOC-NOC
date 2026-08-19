"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, AlertCircle, CheckCircle2, Activity, Bell, BarChart3, Radar } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const id = searchParams.get("id");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (!token || !id) {
      setError("Enlace de recuperación inválido o incompleto.");
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, token, newPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "No se pudo actualizar la contraseña.");
        return;
      }

      setSuccessMessage("¡Contraseña actualizada con éxito! Redirigiendo al inicio de sesión...");
      setTimeout(() => {
        router.push("/login");
      }, 3000);
      
    } catch (err: any) {
      setError("Error de red. Intenta nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[440px]">
      <div className="mb-10">
        <h2 className="text-[40px] md:text-[48px] font-barlow-condensed font-bold text-[#001F60] uppercase leading-none">
          NUEVA CONTRASEÑA
        </h2>
        <div className="w-16 h-1 bg-[#00CE7C] mt-4 mb-4 rounded-full"></div>
        <p className="text-[16px] text-[#001F60] font-medium opacity-80">
          Crea una nueva contraseña segura para tu cuenta en la plataforma NOC-NOC.
        </p>
      </div>

      <div className="bg-white rounded-[14px] shadow-[0_10px_40px_rgba(0,31,96,0.08)] p-8 border border-[#E5E9F2]/50">
        {error && (
          <div className="mb-6 bg-red-50 text-red-600 border border-red-200 text-sm px-4 py-3 rounded-[10px] flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage ? (
          <div className="text-center py-6 animate-[fadeIn_0.4s_ease-out_forwards]">
            <CheckCircle2 className="w-16 h-16 text-[#00CE7C] mx-auto mb-4" />
            <p className="text-[#001F60] font-medium text-lg">{successMessage}</p>
          </div>
        ) : (
          <form className="space-y-5 animate-[fadeIn_0.4s_ease-out_forwards]" onSubmit={handleSubmit}>
            {/* Nueva Contraseña */}
            <div className="flex flex-col space-y-2">
              <label className="text-[14px] font-barlow-condensed font-bold text-[#001F60] uppercase tracking-wide">
                NUEVA CONTRASEÑA
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full h-[52px] pl-4 pr-12 bg-white border-[1.5px] border-[#E5E9F2] rounded-[10px] text-[16px] text-[#001F60] placeholder:text-[#6E7B99] focus:outline-none focus:border-[#00CE7C] focus:ring-[3px] focus:ring-[#00CE7C]/10 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#6E7B99] hover:text-[#00CE7C] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
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
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirma tu nueva contraseña"
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
                {isLoading ? "GUARDANDO..." : "GUARDAR CONTRASEÑA"}
                {!isLoading && <span className="ml-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200">→</span>}
              </button>
            </div>
            
            <div className="flex items-center justify-center pt-4">
              <a href="/login" className="text-[14px] font-barlow-condensed font-bold text-[#001F60] hover:text-[#00CE7C] transition-colors tracking-wide uppercase underline">
                VOLVER AL INICIO DE SESIÓN
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row font-barlow selection:bg-[#00CE7C] selection:text-[#001F60]">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Panel Izquierdo - Identidad Vepagos (IDÉNTICO A LOGIN) */}
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

      {/* Panel Derecho - Formulario de Reseteo */}
      <div className="w-full md:w-[50%] bg-[#FFFFFF] flex flex-col justify-center items-center p-6 md:p-12 lg:p-20 relative order-2 md:order-2 min-h-screen md:min-h-0">
        <Suspense fallback={
          <div className="w-full max-w-[440px] h-[400px] bg-white rounded-[14px] shadow-[0_10px_40px_rgba(0,31,96,0.08)] p-8 border border-[#E5E9F2]/50 animate-pulse flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-[#E5E9F2] border-t-[#00CE7C] rounded-full animate-spin"></div>
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>

        <div className="absolute bottom-8 text-center w-full">
          <p className="text-[13px] text-[#001F60]/60 font-barlow uppercase tracking-widest">
            © 2026 VEPAGOS • TODOS LOS DERECHOS RESERVADOS
          </p>
        </div>
      </div>
    </div>
  );
}
