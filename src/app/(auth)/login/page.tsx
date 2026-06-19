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
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl p-8">
        <h1 className="text-xl font-bold text-white mb-6 text-center">Command Center</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
            required className="bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500"
          />
          <input
            type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)}
            required className="bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500"
          />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button type="submit" disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-50">
            {loading ? "Вхід..." : "Увійти"}
          </button>
        </form>
        <p className="text-center text-xs text-gray-500 mt-4">
          Немає акаунту? <Link href="/register" className="text-blue-400 hover:underline">Зареєструватися</Link>
        </p>
      </div>
    </div>
  );
}
