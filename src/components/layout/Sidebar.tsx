"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/dashboard", icon: "📊", label: "Дашборд" },
  { href: "/bugs", icon: "🐛", label: "Баги" },
  { href: "/inbox", icon: "📥", label: "Інбокс" },
  { href: "/assistant", icon: "🤖", label: "Помічник" },
  { href: "/social", icon: "📱", label: "Соцмережі" },
  { href: "/analytics", icon: "📈", label: "Аналітика" },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-60 shrink-0 flex flex-col py-6 px-3 gap-1 border-r border-white/[0.06] bg-white/[0.02] backdrop-blur-xl">
      {/* Бренд */}
      <div className="px-3 mb-7 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-400 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <span className="text-white font-black text-lg leading-none">C</span>
        </div>
        <div>
          <h1 className="text-sm font-bold text-white leading-tight">Command Center</h1>
          <p className="text-[11px] text-gray-500 leading-tight">Business Dev</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {nav.map(({ href, icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "bg-gradient-to-r from-indigo-600/90 to-indigo-500/70 text-white shadow-lg shadow-indigo-600/20"
                  : "text-gray-400 hover:text-white hover:bg-white/[0.05]"
              }`}
            >
              {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-full bg-white/90" />}
              <span className="text-base leading-none">{icon}</span>
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-3 pt-4">
        <div className="flex items-center gap-2 text-[11px] text-gray-600">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Системи активні
        </div>
      </div>
    </aside>
  );
}
