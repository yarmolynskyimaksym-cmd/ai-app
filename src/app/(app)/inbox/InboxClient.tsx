"use client";
import { useState } from "react";

interface Message { id: string; channel: string; author: string; text: string; severity?: string | null; category?: string | null; isQuestion: boolean }
const SEV_COLORS: Record<string, string> = { critical: "bg-red-900 text-red-300 border-red-800", high: "bg-orange-900 text-orange-300 border-orange-800", normal: "bg-gray-800 text-gray-300 border-gray-700", low: "bg-gray-800 text-gray-500 border-gray-700" };
const CH_ICONS: Record<string, string> = { telegram: "✈️", whatsapp: "💬", instagram: "📷", facebook: "👥" };

export function InboxClient({ messages: initial }: { messages: Message[] }) {
  const [messages, setMessages] = useState(initial);
  const [summary, setSummary] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [filter, setFilter] = useState("all");

  const analyze = async () => {
    setAnalyzing(true);
    const res = await fetch("/api/ai/analyze-messages", { method: "POST" });
    const data = await res.json();
    setMessages(data.messages);
    setSummary(data.summary);
    setQuestions(data.questions || []);
    setAnalyzing(false);
  };

  const syncTelegram = async () => {
    setSyncing(true);
    const res = await fetch("/api/integrations/telegram/sync", { method: "POST" });
    const data = await res.json();
    setMessages(prev => {
      const existingIds = new Set(prev.map(m => m.id));
      return [...data.messages.filter((m: Message) => !existingIds.has(m.id)), ...prev];
    });
    setSyncing(false);
  };

  const filtered = filter === "all" ? messages : messages.filter(m => m.severity === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">📥 Інбокс повідомлень</h1>
        <div className="flex gap-2">
          <button onClick={syncTelegram} disabled={syncing} className="text-xs bg-blue-900 hover:bg-blue-800 text-blue-300 px-3 py-1.5 rounded-lg disabled:opacity-50">
            {syncing ? "..." : "✈️ Синхронізувати Telegram"}
          </button>
          <button onClick={analyze} disabled={analyzing} className="text-xs bg-purple-900 hover:bg-purple-800 text-purple-300 px-3 py-1.5 rounded-lg disabled:opacity-50">
            {analyzing ? "Аналіз..." : "🤖 Проаналізувати"}
          </button>
        </div>
      </div>

      {summary && (
        <div className="bg-blue-950 border border-blue-800 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-blue-300">📋 Вижимка дня</p>
          <p className="text-sm text-gray-300">{summary}</p>
          {questions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-yellow-400 mb-1">❓ Питання до вас:</p>
              <ul className="space-y-1">{questions.map((q, i) => <li key={i} className="text-xs text-gray-300">• {q}</li>)}</ul>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        {["all", "critical", "high", "normal", "low"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${filter === f ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
            {f === "all" ? "Всі" : f}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(m => (
          <div key={m.id} className={`border rounded-xl p-4 ${SEV_COLORS[m.severity || "normal"]}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs">{CH_ICONS[m.channel] || "💬"}</span>
                  <span className="text-xs font-semibold text-white">{m.author}</span>
                  {m.isQuestion && <span className="text-xs bg-yellow-900 text-yellow-300 px-1.5 py-0.5 rounded">питання</span>}
                  {m.category && <span className="text-xs bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded">{m.category}</span>}
                </div>
                <p className="text-sm text-gray-200">{m.text}</p>
              </div>
              {m.severity && (
                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${SEV_COLORS[m.severity]}`}>{m.severity}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
