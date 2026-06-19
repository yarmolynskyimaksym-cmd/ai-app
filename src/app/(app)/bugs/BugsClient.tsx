"use client";
import { useState } from "react";

interface Bug { id: string; title: string; body: string; author: string; priority: string; status: string; caseCount: number; tag: string }
interface SyncReport { newBugs: number; addedCases: number; skipped: number; statusUpdated: number; tagsUpdated: number }

const STATUSES = ["new", "in_progress", "fixed", "closed"];
const PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-red-900 text-red-300",
  high: "bg-orange-900 text-orange-300",
  medium: "bg-yellow-900 text-yellow-300",
  low: "bg-gray-700 text-gray-300",
};
const STATUS_LABELS: Record<string, string> = { new: "Новий", in_progress: "В роботі", fixed: "Виправлено", closed: "Закрито" };

export function BugsClient({ bugs: initial }: { bugs: Bug[] }) {
  const [bugs, setBugs] = useState(initial);
  const [syncing, setSyncing] = useState(false);
  const [report, setReport] = useState<SyncReport | null>(null);

  const updateStatus = async (id: string, status: string) => {
    setBugs(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    await fetch("/api/bugs/update", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
  };

  const syncSlack = async () => {
    setSyncing(true);
    setReport(null);
    const res = await fetch("/api/ai/parse-bugs", { method: "POST" });
    const data = await res.json();
    setBugs(data.bugs || []);
    setReport(data.report || null);
    setSyncing(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">🐛 Баги зі Slack</h1>
        <button onClick={syncSlack} disabled={syncing}
          className="text-xs bg-purple-900 hover:bg-purple-800 text-purple-300 px-3 py-1.5 rounded-lg disabled:opacity-50">
          {syncing ? "⏳ Синхронізую..." : "🔄 Sync Slack #bugs"}
        </button>
      </div>

      {report && (
        <div className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-xs text-gray-400 flex gap-5">
          <span>🆕 Нових: <b className="text-white">{report.newBugs}</b></span>
          <span>➕ Кейсів: <b className="text-white">{report.addedCases}</b></span>
          <span>⏭️ Пропущено: <b className="text-white">{report.skipped}</b></span>
          <span>📊 Статусів: <b className="text-white">{report.statusUpdated}</b></span>
          <span>🏷️ Тегів: <b className="text-white">{report.tagsUpdated}</b></span>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        {STATUSES.map(status => (
          <div key={status} className="cc-card rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-400 mb-3 uppercase">{STATUS_LABELS[status]}</p>
            <div className="space-y-2">
              {bugs.filter(b => b.status === status).map(bug => (
                <div key={bug.id} className="bg-gray-800 rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-xs font-medium text-white leading-snug">{bug.title}</p>
                    {bug.tag === "Old" && <span className="text-xs bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded shrink-0">Old</span>}
                  </div>
                  <p className="text-xs text-gray-500">{bug.author}{bug.caseCount > 1 ? ` · ${bug.caseCount}x` : ""}</p>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_COLORS[bug.priority] || PRIORITY_COLORS.low}`}>{bug.priority}</span>
                    <select value={bug.status} onChange={e => updateStatus(bug.id, e.target.value)}
                      className="text-xs bg-gray-700 text-gray-300 rounded px-1 py-0.5 border-0 outline-none">
                      {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                    </select>
                  </div>
                </div>
              ))}
              {bugs.filter(b => b.status === status).length === 0 && <p className="text-xs text-gray-600">Порожньо</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
