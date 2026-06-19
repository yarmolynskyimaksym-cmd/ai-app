"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/dashboard", label: "📊 Дашборд", key: "AMPLITUDE" },
  { href: "/bugs", label: "🐛 Баги", key: "SLACK_MOCK" },
  { href: "/inbox", label: "📥 Інбокс", key: "TELEGRAM" },
  { href: "/assistant", label: "🤖 Помічник", key: null },
  { href: "/social", label: "📱 Соцмережі", key: "POSTBRIDGE" },
  { href: "/analytics", label: "📈 Аналітика", key: null },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col py-6 px-3 gap-1 shrink-0">
      <div className="px-3 mb-6">
        <h1 className="text-base font-bold text-white">Command Center</h1>
        <p className="text-xs text-gray-500">Business Dev Dashboard</p>
      </div>
      {nav.map(({ href, label }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              active ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </aside>
  );
}
