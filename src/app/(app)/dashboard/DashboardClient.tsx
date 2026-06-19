"use client";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface Agent {
  id: string; name: string; agencyId: string | null; status: string;
  healthScore: string; wauCurrent: number; wauPrev: number;
  regCurrent: number; regPrev: number;
  dauYesterday: number; dauPrev7d: number;
  regYesterday: number; regPrev7d: number;
}

const HEALTH_ORDER: Record<string, number> = { "🔴": 0, "🟡": 1, "🟢": 2, "⚪": 3 };
const HEALTH_BG: Record<string, string> = { "🟢": "bg-green-900/40", "🟡": "bg-yellow-900/40", "🔴": "bg-red-900/40", "⚪": "bg-gray-800/40" };

function delta(curr: number, prev: number) {
  if (prev === 0) return "—";
  const d = ((curr - prev) / prev * 100).toFixed(1);
  return (curr >= prev ? "+" : "") + d + "%";
}
function deltaColor(curr: number, prev: number) {
  if (prev === 0) return "text-gray-500";
  return curr >= prev ? "text-green-400" : "text-red-400";
}

export function DashboardClient({ agents: initial }: { agents: Agent[] }) {
  const [agents, setAgents] = useState(initial);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");

  const sorted = [...agents].sort((a, b) => (HEALTH_ORDER[a.healthScore] ?? 3) - (HEALTH_ORDER[b.healthScore] ?? 3));

  const totalWAU = agents.reduce((s, a) => s + a.wauCurrent, 0);
  const totalReg = agents.reduce((s, a) => s + a.regCurrent, 0);
  const critical = agents.filter(a => a.healthScore === "🔴").length;

  const syncAmplitude = async () => {
    setSyncing(true);
    setSyncMsg("");
    const res = await fetch("/api/integrations/amplitude/sync", { method: "POST" });
    const data = await res.json();
    if (data.agents) setAgents(data.agents);
    setSyncMsg(`Синхронізовано ${data.agents?.length ?? 0} агентств`);
    setSyncing(false);
  };

  const chartData = sorted.map(a => ({
    name: a.agencyId || a.name,
    WAU: a.wauCurrent,
    "WAU мин": a.wauPrev,
  }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">📊 Partner Dashboard</h1>
        <div className="flex items-center gap-3">
          {syncMsg && <span className="text-xs text-gray-400">{syncMsg}</span>}
          <button onClick={syncAmplitude} disabled={syncing}
            className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg disabled:opacity-50">
            {syncing ? "⏳ Синхронізую..." : "🔄 Sync Amplitude"}
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Агентств", value: agents.length },
          { label: "WAU (цей тиждень)", value: totalWAU },
          { label: "Реєстрацій (цей тиждень)", value: totalReg },
          { label: "🔴 Critical", value: critical, red: true },
        ].map(({ label, value, red }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className={`text-2xl font-bold ${red && value > 0 ? "text-red-400" : "text-white"}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* WAU chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-sm text-gray-400 mb-3">WAU по агентствах (цей тиждень vs минулий)</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} barCategoryGap="30%">
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6b7280" }} />
            <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} />
            <Tooltip contentStyle={{ background: "#111827", border: "1px solid #374151", fontSize: 12 }} />
            <Bar dataKey="WAU" fill="#3b82f6" radius={[3,3,0,0]}>
              {chartData.map((_, i) => <Cell key={i} fill="#3b82f6" />)}
            </Bar>
            <Bar dataKey="WAU мин" fill="#374151" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Agency table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left text-gray-500 px-4 py-3 font-medium">Агентство</th>
              <th className="text-center text-gray-500 px-3 py-3 font-medium">Health</th>
              <th className="text-right text-gray-500 px-3 py-3 font-medium">WAU</th>
              <th className="text-right text-gray-500 px-3 py-3 font-medium">Δ WAU</th>
              <th className="text-right text-gray-500 px-3 py-3 font-medium">Реєстрацій</th>
              <th className="text-right text-gray-500 px-3 py-3 font-medium">Δ Рег</th>
              <th className="text-right text-gray-500 px-3 py-3 font-medium">DAU вчора</th>
              <th className="text-right text-gray-500 px-3 py-3 font-medium">Δ DAU</th>
              <th className="text-right text-gray-500 px-3 py-3 font-medium">Рег вчора</th>
              <th className="text-right text-gray-500 px-3 py-3 font-medium">Δ Рег/д</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(a => (
              <tr key={a.id} className={`border-b border-gray-800/50 ${HEALTH_BG[a.healthScore] || ""}`}>
                <td className="px-4 py-3 text-white font-medium">{a.agencyId || a.name}</td>
                <td className="px-3 py-3 text-center text-base">{a.healthScore}</td>
                <td className="px-3 py-3 text-right text-white">{a.wauCurrent}</td>
                <td className={`px-3 py-3 text-right font-medium ${deltaColor(a.wauCurrent, a.wauPrev)}`}>{delta(a.wauCurrent, a.wauPrev)}</td>
                <td className="px-3 py-3 text-right text-white">{a.regCurrent}</td>
                <td className={`px-3 py-3 text-right font-medium ${deltaColor(a.regCurrent, a.regPrev)}`}>{delta(a.regCurrent, a.regPrev)}</td>
                <td className="px-3 py-3 text-right text-white">{a.dauYesterday}</td>
                <td className={`px-3 py-3 text-right font-medium ${deltaColor(a.dauYesterday, a.dauPrev7d)}`}>{delta(a.dauYesterday, a.dauPrev7d)}</td>
                <td className="px-3 py-3 text-right text-white">{a.regYesterday}</td>
                <td className={`px-3 py-3 text-right font-medium ${deltaColor(a.regYesterday, a.regPrev7d)}`}>{delta(a.regYesterday, a.regPrev7d)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
