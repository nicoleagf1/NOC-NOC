import Image from "next/image";
import Link from "next/link";
import { User, Lock, Eye, HeadphonesIcon, Mail } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#001235] text-white flex flex-col items-center justify-center relative overflow-hidden font-barlow">
      {/* Background decoration elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#00CE7C] opacity-20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#008F6B] opacity-20 blur-[120px] rounded-full"></div>
      </div>

      <div className="z-10 flex flex-col items-center w-full max-w-md px-4">
        {/* Logo and Titles */}
        <div className="mb-8 flex flex-col items-center">
          <img
            src="/logo2.png"
            alt="Vepagos Logo"
            className="w-auto h-auto max-w-[280px] max-h-[90px] mb-6 object-contain"
          />
          <h1 className="text-3xl font-barlow-condensed tracking-widest font-semibold text-white">
            NOC-NOC
          </h1>
          <p className="text-sm tracking-[0.2em] text-gray-300">
            CENTRO DE MONITOREO
          </p>
        </div>

        {/* Login Card */}
        <Card className="w-full p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-6">
            <h2 className="text-2xl font-barlow-condensed font-bold text-vepagos-navy mb-2 tracking-wide uppercase">
              Iniciar Sesión
            </h2>
            <div className="h-1 w-8 bg-vepagos-green rounded-full mb-4"></div>
            <p className="text-sm text-gray-500 text-center">
              Ingresa tus credenciales para acceder<br />al sistema de monitoreo NOC-NOC.
            </p>
          </div>

          <form className="space-y-5">
            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-vepagos-navy uppercase">
                Usuario
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Ingresa tu usuario"
                  className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-200 rounded-[var(--radius-input)] text-sm focus:outline-none focus:ring-2 focus:ring-vepagos-green focus:border-transparent transition-all text-vepagos-navy"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-vepagos-navy uppercase">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  placeholder="Ingresa tu contraseña"
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-[var(--radius-input)] text-sm focus:outline-none focus:ring-2 focus:ring-vepagos-green focus:border-transparent transition-all text-vepagos-navy"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <Eye className="h-5 w-5 text-gray-400 hover:text-vepagos-navy transition-colors" />
                </button>
              </div>
            </div>

            {/* Options */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-vepagos-green focus:ring-vepagos-green"
                />
                <span className="text-xs font-semibold text-vepagos-navy uppercase">
                  Recordar Sesión
                </span>
              </label>
              <Link
                href="#"
                className="text-xs font-bold text-vepagos-green hover:text-vepagos-green-deep transition-colors uppercase"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button className="w-full font-bold uppercase tracking-wider" size="lg">
                Ingresar
              </Button>
            </div>
          </form>

          {/* Footer Card */}
          <div className="mt-8 pt-6 border-t border-gray-100 relative">
            <div className="absolute top-[-10px] left-1/2 transform -translate-x-1/2 bg-white px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Soporte Técnico
            </div>
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-6 text-xs text-gray-500">
              <div className="flex items-center">
                <HeadphonesIcon className="h-4 w-4 text-vepagos-green mr-2" />
                <span>Mesa de ayuda: +57 (601) 743 1313</span>
              </div>
              <div className="hidden sm:block h-4 w-px bg-gray-200"></div>
              <div className="flex items-center">
                <Mail className="h-4 w-4 text-vepagos-green mr-2" />
                <span>soporte@vepagos.co</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Footer App */}
        <div className="mt-12 text-xs text-gray-400 tracking-widest uppercase">
          © 2024 Vepagos. Todos los derechos reservados.
        </div>
      </div>
    </div>
  );
}
