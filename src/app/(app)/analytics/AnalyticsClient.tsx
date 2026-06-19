"use client";
import { useState } from "react";

interface Template { id: string; name: string; description?: string | null; promptText: string; outputFormat: string }
interface Update { id: string; result: string; format: string; createdAt: Date | string; templateId?: string | null }

export function AnalyticsClient({ templates: initial, history: initialHistory }: { templates: Template[]; history: Update[] }) {
  const [templates, setTemplates] = useState(initial);
  const [history, setHistory] = useState(initialHistory);
  const [selectedTpl, setSelectedTpl] = useState<Template | null>(null);
  const [inputData, setInputData] = useState("");
  const [result, setResult] = useState("");
  const [generating, setGenerating] = useState(false);
  const [showNewTpl, setShowNewTpl] = useState(false);
  const [newTpl, setNewTpl] = useState({ name: "", description: "", promptText: "", outputFormat: "markdown" });

  const generate = async () => {
    if (!selectedTpl || !inputData.trim()) return;
    setGenerating(true);
    const res = await fetch("/api/ai/analytics-update", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId: selectedTpl.id, inputData }),
    });
    const data = await res.json();
    setResult(data.result);
    setHistory(prev => [data.update, ...prev]);
    setGenerating(false);
  };

  const download = async (updateId: string, format: string) => {
    const res = await fetch(`/api/analytics/export?id=${updateId}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `update.${format}`; a.click();
  };

  const saveTpl = async () => {
    const res = await fetch("/api/templates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newTpl) });
    const data = await res.json();
    setTemplates(prev => [data.template, ...prev]);
    setShowNewTpl(false);
    setNewTpl({ name: "", description: "", promptText: "", outputFormat: "markdown" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">📈 Аналітичні апдейти</h1>
        <button onClick={() => setShowNewTpl(true)} className="text-xs bg-blue-900 hover:bg-blue-800 text-blue-300 px-3 py-1.5 rounded-lg">+ Новий шаблон</button>
      </div>

      {showNewTpl && (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-white">Новий шаблон промту</p>
          <input placeholder="Назва" value={newTpl.name} onChange={e => setNewTpl(p => ({ ...p, name: e.target.value }))}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm" />
          <input placeholder="Опис (опційно)" value={newTpl.description} onChange={e => setNewTpl(p => ({ ...p, description: e.target.value }))}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm" />
          <textarea rows={4} placeholder="Текст промту..." value={newTpl.promptText} onChange={e => setNewTpl(p => ({ ...p, promptText: e.target.value }))}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm resize-none" />
          <select value={newTpl.outputFormat} onChange={e => setNewTpl(p => ({ ...p, outputFormat: e.target.value }))}
            className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm">
            {["markdown", "csv", "xlsx"].map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          <div className="flex gap-2">
            <button onClick={saveTpl} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">Зберегти</button>
            <button onClick={() => setShowNewTpl(false)} className="bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm">Скасувати</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {templates.map(t => (
          <div key={t.id} onClick={() => setSelectedTpl(t)}
            className={`border rounded-xl p-4 cursor-pointer transition-colors ${selectedTpl?.id === t.id ? "border-blue-500 bg-blue-950" : "border-gray-700 bg-gray-900 hover:border-gray-600"}`}>
            <p className="text-sm font-semibold text-white">{t.name}</p>
            <p className="text-xs text-gray-500 mt-1">{t.description || t.promptText.slice(0, 60)}</p>
            <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded mt-2 inline-block">{t.outputFormat}</span>
          </div>
        ))}
        {templates.length === 0 && <p className="text-sm text-gray-500 col-span-3">Шаблонів немає. Додайте перший!</p>}
      </div>

      {selectedTpl && (
        <div className="space-y-3">
          <p className="text-sm text-gray-400">Шаблон: <span className="text-white">{selectedTpl.name}</span></p>
          <textarea rows={6} value={inputData} onChange={e => setInputData(e.target.value)}
            placeholder="Вставте вхідні дані (текст, таблиця, цифри)..."
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 text-sm resize-none" />
          <button onClick={generate} disabled={generating || !inputData.trim()}
            className="bg-purple-700 hover:bg-purple-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50">
            {generating ? "Генерація..." : "🤖 Згенерувати апдейт"}
          </button>
        </div>
      )}

      {result && (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-white">Результат</p>
          <pre className="text-xs text-gray-300 whitespace-pre-wrap">{result}</pre>
          <button onClick={() => download(history[0]?.id, history[0]?.format)}
            className="text-xs bg-green-900 hover:bg-green-800 text-green-300 px-3 py-1.5 rounded-lg">⬇ Завантажити файл</button>
        </div>
      )}

      {history.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-300 mb-3">Історія</p>
          <div className="space-y-2">
            {history.map(h => (
              <div key={h.id} className="bg-gray-900 border border-gray-800 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">{new Date(h.createdAt).toLocaleString("uk-UA")}</p>
                  <p className="text-sm text-gray-300 line-clamp-1 mt-0.5">{h.result.slice(0, 80)}...</p>
                </div>
                <button onClick={() => download(h.id, h.format)} className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-400 px-2 py-1 rounded">⬇</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
