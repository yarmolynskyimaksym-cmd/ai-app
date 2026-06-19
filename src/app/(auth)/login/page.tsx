"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.error) {
      setError("Невірний email або пароль");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm cc-card p-8 cc-fade-in">
        <div className="flex flex-col items-center mb-7">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-400 flex items-center justify-center shadow-xl shadow-indigo-500/30 mb-4">
            <span className="text-white font-black text-2xl leading-none">C</span>
          </div>
          <h1 className="text-lg font-bold text-white">Command Center</h1>
          <p className="text-xs text-gray-500 mt-1">Увійдіть до панелі керування</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <input
            type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
            required className="bg-white/[0.04] border border-white/[0.08] text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500/70 focus:ring-2 focus:ring-indigo-500/20 placeholder:text-gray-600"
          />
          <input
            type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)}
            required className="bg-white/[0.04] border border-white/[0.08] text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500/70 focus:ring-2 focus:ring-indigo-500/20 placeholder:text-gray-600"
          />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button type="submit" disabled={loading}
            className="mt-1 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl py-3 text-sm font-semibold shadow-lg shadow-indigo-600/25 disabled:opacity-50">
            {loading ? "Вхід..." : "Увійти"}
          </button>
        </form>
        <p className="text-center text-xs text-gray-500 mt-5">
          Немає акаунту? <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">Зареєструватися</Link>
        </p>
      </div>
    </div>
  );
}
