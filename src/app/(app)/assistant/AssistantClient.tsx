"use client";
import { useState } from "react";

interface Note { id: string; raw: string; action?: string | null; dueDate?: Date | string | null; done: boolean }

export function AssistantClient({ notes: initial, todayNotes }: { notes: Note[]; todayNotes: Note[] }) {
  const [notes, setNotes] = useState(initial);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const addNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setSending(true);
    const res = await fetch("/api/ai/parse-note", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: input }) });
    const data = await res.json();
    setNotes(prev => [data.note, ...prev]);
    setInput("");
    setSending(false);
  };

  const markDone = async (id: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, done: true } : n));
    await fetch("/api/notes/done", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-bold text-white">🤖 Веб-помічник</h1>

      {todayNotes.length > 0 && (
        <div className="bg-yellow-950 border border-yellow-800 rounded-xl p-4">
          <p className="text-sm font-semibold text-yellow-300 mb-3">⏰ На сьогодні</p>
          <div className="space-y-2">
            {todayNotes.map(n => (
              <div key={n.id} className="flex items-center justify-between">
                <span className="text-sm text-gray-200">{n.action || n.raw}</span>
                <button onClick={() => markDone(n.id)} className="text-xs bg-green-900 hover:bg-green-800 text-green-300 px-2 py-1 rounded">✓ Виконано</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={addNote} className="flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Напишіть довільно: 'нагадати передзвонити Марії завтра'..."
          className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500" />
        <button type="submit" disabled={sending || !input.trim()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50">
          {sending ? "..." : "Додати"}
        </button>
      </form>

      <div className="space-y-2">
        {notes.filter(n => !n.done).map(n => (
          <div key={n.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-white">{n.action || n.raw}</p>
              <p className="text-xs text-gray-500 mt-1">{n.raw}</p>
              {n.dueDate && <p className="text-xs text-blue-400 mt-1">📅 {new Date(n.dueDate).toLocaleDateString("uk-UA")}</p>}
            </div>
            <button onClick={() => markDone(n.id)} className="text-xs bg-gray-800 hover:bg-green-900 text-gray-400 hover:text-green-300 px-2 py-1 rounded">✓</button>
          </div>
        ))}
      </div>
    </div>
  );
}
