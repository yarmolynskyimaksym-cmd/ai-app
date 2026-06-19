"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/chat", label: "AI Чат" },
  { href: "/settings", label: "Налаштування" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 border-r bg-gray-50 flex flex-col p-4 gap-1">
      <p className="text-xs font-semibold text-gray-400 uppercase mb-3 px-2">
        Меню
      </p>
      {nav.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            pathname === href
              ? "bg-blue-600 text-white"
              : "text-gray-700 hover:bg-gray-200"
          }`}
        >
          {label}
        </Link>
      ))}
    </aside>
  );
}
