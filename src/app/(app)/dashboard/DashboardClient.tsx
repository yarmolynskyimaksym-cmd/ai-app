"use client";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface Agent { id: string; name: string; status: string; metricCurrent: number; metricPrev: number; aiSummary?: string | null }

export function DashboardClient({ agents: initial }: { agents: Agent[] }) {
  const [agents, setAgents] = useState(initial);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const total = agents.length;
  const active = agents.filter(a => a.status === "active").length;
  const totalMetric = agents.reduce((s, a) => s + a.metricCurrent, 0);

  const getAiSummary = async (id: string) => {
    setLoadingId(id);
    const res = await fetch("/api/ai/agent-summary", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ agentId: id }) });
    const data = await res.json();
    setAgents(prev => prev.map(a => a.id === id ? { ...a, aiSummary: data.summary } : a));
    setLoadingId(null);
  };

  const syncAmplitude = async () => {
    setSyncing(true);
    await fetch("/api/integrations/amplitude/sync", { method: "POST" });
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Дашборд агентів</h1>
        <button onClick={syncAmplitude} disabled={syncing}
          className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg disabled:opacity-50">
          {syncing ? "Синхронізація..." : "🔄 Синхронізувати Amplitude"}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Всього агентів", value: total },
          { label: "Активних", value: active },
          { label: "Сумарна метрика", value: totalMetric },
        ].map(({ label, value }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-sm text-gray-400 mb-3">Динаміка (поточний vs попередній)</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={agents}>
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9ca3af" }} />
            <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} />
            <Tooltip contentStyle={{ background: "#111827", border: "none", fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="metricCurrent" name="Поточний" fill="#3b82f6" />
            <Bar dataKey="metricPrev" name="Минулий" fill="#6b7280" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              {["Агент", "Статус", "Поточний", "Минулий", "Зміна", "AI-огляд", ""].map(h => (
                <th key={h} className="text-left text-xs text-gray-500 px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {agents.map(a => {
              const delta = a.metricPrev > 0 ? ((a.metricCurrent - a.metricPrev) / a.metricPrev * 100).toFixed(1) : "—";
              const up = a.metricCurrent >= a.metricPrev;
              return (
                <tr key={a.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-4 py-3 text-white font-medium">{a.name}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${a.status === "active" ? "bg-green-900 text-green-300" : "bg-gray-700 text-gray-400"}`}>
                      {a.status === "active" ? "Активний" : "Пауза"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white">{a.metricCurrent}</td>
                  <td className="px-4 py-3 text-gray-400">{a.metricPrev}</td>
                  <td className={`px-4 py-3 font-medium ${up ? "text-green-400" : "text-red-400"}`}>
                    {up ? "↑" : "↓"} {delta}%
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 max-w-xs truncate">{a.aiSummary || "—"}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => getAiSummary(a.id)} disabled={loadingId === a.id}
                      className="text-xs bg-blue-900 hover:bg-blue-800 text-blue-300 px-2 py-1 rounded disabled:opacity-50">
                      {loadingId === a.id ? "..." : "AI"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
