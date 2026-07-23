"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        router.push("/");
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
        router.push("/");
      }
    } catch (err: any) {
      setError("Error de red. Intenta nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#001F60] to-[#0B2F7F] flex flex-col items-center justify-between font-barlow relative selection:bg-[#00CE7C] selection:text-[#001F60]">

      {/* Contenedor principal centrado */}
      <div className="flex-1 flex flex-col items-center justify-center w-full px-4 mt-16 mb-8">

        {/* Logo */}
        <div className="mb-6 flex flex-col items-center">
          <img
            src="/logo.png"
            alt="Vepagos Logo"
            className="w-auto h-auto max-w-[380px] max-h-[300px] mb-8 object-contain"
          />
          <h1 className="text-[48px] font-barlow-condensed tracking-[2px] font-bold text-white leading-none mb-1">
            NOC-NOC
          </h1>
          <p className="text-[20px] font-barlow text-[#E5E9F2]">
            Centro de Monitoreo
          </p>
        </div>

        {/* Login Card */}
        <div className="w-full max-w-[520px] bg-[#FFFFFF] rounded-[14px] p-10 shadow-sm relative">

          {error && (
            <div className="mb-6 bg-red-50 text-red-600 border border-red-200 text-sm px-4 py-3 rounded-[10px] flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!requiresPasswordChange ? (
            // PASO 1: LOGIN NORMAL
            <form className="space-y-6" onSubmit={handleLogin}>
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
                  className="w-full h-[52px] px-4 bg-white border-[1.5px] border-[#E5E9F2] rounded-[10px] text-[16px] text-[#001F60] placeholder:text-[#6E7B99] focus:outline-none focus:border-[#00CE7C] transition-colors duration-150"
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
                    className="w-full h-[52px] pl-4 pr-12 bg-white border-[1.5px] border-[#E5E9F2] rounded-[10px] text-[16px] text-[#001F60] placeholder:text-[#6E7B99] focus:outline-none focus:border-[#00CE7C] transition-colors duration-150"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center justify-center text-[#6E7B99] hover:text-[#001F60] transition-colors"
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
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center space-x-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded-[4px] border-[#E5E9F2] text-[#00CE7C] focus:ring-[#00CE7C] cursor-pointer"
                  />
                  <span className="text-[14px] text-[#6E7B99] group-hover:text-[#001F60] transition-colors">
                    Recordarme
                  </span>
                </label>
                <a href="#" className="text-[14px] text-[#001F60] hover:text-[#00CE7C] transition-colors font-medium">
                  ¿Olvidó su contraseña?
                </a>
              </div>

              {/* Botón Iniciar Sesión */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-[52px] bg-[#00CE7C] hover:bg-[#00B36C] text-[#001F60] rounded-[999px] font-barlow-condensed font-bold text-[18px] uppercase tracking-wider transition-colors duration-150 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Validando..." : "INICIAR SESIÓN"}
                </button>
              </div>
            </form>
          ) : (
            // PASO 2: CAMBIO DE CONTRASEÑA OBLIGATORIO
            <form className="space-y-6" onSubmit={handleChangePassword}>
              <div className="mb-6 text-center">
                <h2 className="text-[24px] font-barlow-condensed font-bold text-[#001F60] uppercase tracking-wide">
                  ACTUALIZAR CONTRASEÑA
                </h2>
                <p className="text-[15px] text-[#6E7B99] mt-2">
                  Por seguridad, debe cambiar su contraseña predeterminada antes de continuar.
                </p>
              </div>

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
                    className="w-full h-[52px] pl-4 pr-12 bg-white border-[1.5px] border-[#E5E9F2] rounded-[10px] text-[16px] text-[#001F60] placeholder:text-[#6E7B99] focus:outline-none focus:border-[#00CE7C] transition-colors duration-150"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#6E7B99] hover:text-[#001F60] transition-colors"
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
                    className="w-full h-[52px] pl-4 pr-12 bg-white border-[1.5px] border-[#E5E9F2] rounded-[10px] text-[16px] text-[#001F60] placeholder:text-[#6E7B99] focus:outline-none focus:border-[#00CE7C] transition-colors duration-150"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-[52px] bg-[#00CE7C] hover:bg-[#00B36C] text-[#001F60] rounded-[999px] font-barlow-condensed font-bold text-[18px] uppercase tracking-wider transition-colors duration-150 flex items-center justify-center disabled:opacity-70"
                >
                  {isLoading ? "Guardando..." : "GUARDAR Y ENTRAR"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full text-center pb-8 pt-4">
        <p className="text-[13px] text-[#E5E9F2] leading-relaxed opacity-90">
          © 2026 Vepagos<br />
          Plataforma NOC-NOC<br />
          Centro de Operaciones
        </p>
      </footer>

    </div>
  );
}
