"use client";
import { signOut } from "next-auth/react";

interface Props { user?: { name?: string | null; email?: string | null } | null }

export function TopBar({ user }: Props) {
  const name = user?.name || user?.email || "User";
  const initial = name.charAt(0).toUpperCase();
  return (
    <header className="h-16 flex items-center justify-end gap-4 px-6 md:px-8 border-b border-white/[0.06] bg-white/[0.015] backdrop-blur-xl shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-sky-400 flex items-center justify-center text-white text-sm font-semibold shadow-md shadow-indigo-500/25">
          {initial}
        </div>
        <span className="text-sm text-gray-300 hidden sm:block">{name}</span>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="text-xs font-medium text-gray-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] px-3.5 py-1.5 rounded-lg"
      >
        Вийти
      </button>
    </header>
  );
}
