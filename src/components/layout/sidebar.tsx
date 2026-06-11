import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  Server,
  Cpu,
  Network,
  Bell,
  Clock,
  LineChart,
  BarChart2,
  Users,
  Link2,
  Settings,
  ChevronLeft
} from "lucide-react";

const navItems = [
  {
    title: "",
    items: [
      { name: "DASHBOARD", href: "/", icon: LayoutDashboard, active: true },
    ],
  },
  {
    title: "MONITOREO",
    items: [
      { name: "SERVICIOS", href: "/servicios", icon: Server },
      { name: "INFRAESTRUCTURA", href: "/infraestructura", icon: Cpu },
      { name: "EVENTOS", href: "/eventos", icon: Clock },
    ],
  },
  {
    title: "ALERTAS",
    items: [
      { name: "ACTIVAS", href: "/alertas/activas", icon: Bell, badge: 12 },
    ],
  },
  {
    title: "CONFIGURACIÓN",
    items: [
      { name: "GENERAL", href: "/configuracion", icon: Settings },
    ],
  },
];

export function Sidebar({ isCollapsed, onToggle }: { isCollapsed: boolean, onToggle: () => void }) {
  return (
    <aside className={`bg-white border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0 z-20 transition-all duration-300 ${isCollapsed ? 'w-[80px]' : 'w-[280px]'}`}>
      {/* Logo */}
      <div className={`h-[72px] flex items-center justify-center border-b border-gray-100 ${isCollapsed ? 'px-2' : 'px-6'}`}>
        <img
          src="/logo3.png"
          alt="Vepagos Logo"
          className={`object-contain transition-all duration-300 ${isCollapsed ? 'w-40 h-40' : 'h-40 w-auto max-w-full'}`}
        />
      </div>

      {/* Nav Links */}
      <div className={`flex-1 overflow-y-auto py-6 space-y-6 ${isCollapsed ? 'px-2' : 'px-4'}`}>
        {navItems.map((group, idx) => (
          <div key={idx}>
            {group.title && !isCollapsed && (
              <h3 className="text-[11px] font-bold text-vepagos-navy mb-3 px-3 uppercase tracking-widest font-barlow-condensed">
                {group.title}
              </h3>
            )}
            <ul className="space-y-1">
              {group.items.map((item, itemIdx) => {
                const Icon = item.icon;
                return (
                  <li key={itemIdx}>
                    <Link
                      href={item.href}
                      title={item.name}
                      className={`flex items-center justify-between py-2.5 rounded-lg text-sm font-medium transition-colors uppercase font-barlow-condensed tracking-wide ${isCollapsed ? 'px-0 justify-center' : 'px-3'
                        } ${'active' in item && item.active
                          ? `bg-vepagos-green/10 text-vepagos-green-deep border-vepagos-green ${isCollapsed ? 'border-l-0' : 'border-l-4'}`
                          : "text-gray-500 hover:bg-gray-50 hover:text-vepagos-navy"
                        }`}
                    >
                      <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : ''}`}>
                        <Icon className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'} ${'active' in item && item.active ? "text-vepagos-green" : "text-gray-400"}`} />
                        {!isCollapsed && <span>{item.name}</span>}
                      </div>
                      {!isCollapsed && 'badge' in item && item.badge && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {item.badge as React.ReactNode}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Collapse Menu Button */}
      <div className="p-4 border-t border-gray-100 flex justify-center">
        <button
          onClick={onToggle}
          className="flex items-center text-sm font-bold text-gray-500 hover:text-vepagos-navy transition-colors uppercase font-barlow-condensed tracking-wide w-full justify-center py-2"
          title={isCollapsed ? "Expandir Menú" : "Colapsar Menú"}
        >
          <ChevronLeft className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : 'mr-2'}`} />
          {!isCollapsed && <span>Colapsar Menú</span>}
        </button>
      </div>
    </aside>
  );
}
