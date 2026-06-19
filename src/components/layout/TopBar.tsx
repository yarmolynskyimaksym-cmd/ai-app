"use client";
import { signOut } from "next-auth/react";

interface Props { user?: { name?: string | null; email?: string | null } | null }

export function TopBar({ user }: Props) {
  return (
    <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 shrink-0">
      <div />
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-400">{user?.name || user?.email}</span>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg transition-colors"
        >
          Вийти
        </button>
      </div>
    </header>
  );
}
