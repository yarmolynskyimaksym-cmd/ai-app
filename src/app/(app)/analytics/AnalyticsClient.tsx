"use client";
import { useState, useEffect, useCallback } from "react";
import { REPORT_TYPES } from "@/lib/reportTypes";

interface Group { id: string; chatId: string; title: string }
interface Job { id: string; type: string; status: string; chatTitle?: string | null; resultFileName?: string | null; error?: string | null; createdAt: string | Date }

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-gray-700 text-gray-300",
  running: "bg-blue-900 text-blue-300",
  done: "bg-green-900 text-green-300",
  error: "bg-red-900 text-red-300",
};
const STATUS_LABEL: Record<string, string> = { pending: "В черзі", running: "Виконується…", done: "Готово", error: "Помилка" };

export function AnalyticsClient({ groups, initialJobs }: { groups: Group[]; initialJobs: Job[] }) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [typeId, setTypeId] = useState(REPORT_TYPES[0].id);
  const [form, setForm] = useState<Record<string, string>>({});
  const [chatId, setChatId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const rt = REPORT_TYPES.find(r => r.id === typeId)!;

  // Ручне завантаження файлу
  const [upFile, setUpFile] = useState<File | null>(null);
  const [upChat, setUpChat] = useState("");
  const [upCaption, setUpCaption] = useState("");
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState("");

  const sendFile = async () => {
    if (!upFile || !upChat) return;
    setSending(true); setSendMsg("");
    const fd = new FormData();
    fd.append("file", upFile);
    fd.append("chatId", upChat);
    fd.append("caption", upCaption);
    const res = await fetch("/api/telegram/send", { method: "POST", body: fd });
    const data = await res.json();
    setSendMsg(res.ok ? `✅ Надіслано: ${data.fileName}` : `❌ ${data.error || "Помилка"}`);
    if (res.ok) { setUpFile(null); setUpCaption(""); }
    setSending(false);
  };

  const refresh = useCallback(async () => {
    const res = await fetch("/api/jobs");
    if (res.ok) { const d = await res.json(); setJobs(d.jobs); }
  }, []);

  useEffect(() => {
    const hasActive = jobs.some(j => j.status === "pending" || j.status === "running");
    const t = setInterval(refresh, hasActive ? 4000 : 15000);
    return () => clearInterval(t);
  }, [refresh, jobs]);

  const submit = async () => {
    setSubmitting(true);
    const group = groups.find(g => g.chatId === chatId);
    const res = await fetch("/api/jobs", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ typeId, params: form, chatId: chatId || null, chatTitle: group?.title || null }),
    });
    if (res.ok) { setForm({}); await refresh(); }
    setSubmitting(false);
  };

  const ready = rt.fields.every(f => (form[f.key] || "").trim() || f.key === "lang" || f.key === "days" || f.key === "dateRange");

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-xl font-bold text-white">📈 Аналітичні апдейти</h1>

      {/* Ручне завантаження файлу → відправка агентці */}
      <div className="cc-card rounded-xl p-5 space-y-3">
        <p className="text-sm font-semibold text-white">📎 Надіслати файл агентці</p>
        <p className="text-xs text-gray-500">Згенеруй звіт у Claude → завантаж файл сюди → обери групу → відправ.</p>
        <label className="flex items-center gap-3 cursor-pointer bg-gray-800 border border-dashed border-gray-600 hover:border-gray-400 rounded-lg px-4 py-3 transition-colors">
          <span className="text-gray-400 text-sm">{upFile ? upFile.name : "Обрати файл..."}</span>
          <input type="file" onChange={e => setUpFile(e.target.files?.[0] ?? null)} className="hidden" />
        </label>
        <select value={upChat} onChange={e => setUpChat(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm">
          <option value="">— Обери групу —</option>
          {groups.map(g => <option key={g.id} value={g.chatId}>{g.title}</option>)}
        </select>
        <input value={upCaption} onChange={e => setUpCaption(e.target.value)} placeholder="Підпис (опційно)"
          className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm" />
        <div className="flex items-center gap-3">
          <button onClick={sendFile} disabled={sending || !upFile || !upChat}
            className="bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
            {sending ? "Надсилаю…" : "📤 Надіслати в групу"}
          </button>
          {sendMsg && <span className="text-xs text-gray-300">{sendMsg}</span>}
        </div>
        {groups.length === 0 && <p className="text-xs text-gray-600">Груп немає. Додай бота @cmdcenter_inbox_bot у групу.</p>}
      </div>

      <div className="text-xs text-gray-600 border-t border-gray-800 pt-4">Або через worker на ПК (експериментально):</div>

      {/* Вибір типу */}
      <div className="grid grid-cols-3 gap-3">
        {REPORT_TYPES.map(t => (
          <button key={t.id} onClick={() => { setTypeId(t.id); setForm({}); }}
            className={`text-left border rounded-xl p-4 transition-colors ${typeId === t.id ? "border-blue-500 bg-blue-950" : "border-gray-700 bg-gray-900 hover:border-gray-600"}`}>
            <p className="text-sm font-semibold text-white">{t.name}</p>
            <p className="text-xs text-gray-500 mt-1">{t.description}</p>
          </button>
        ))}
      </div>

      {/* Поля */}
      <div className="cc-card rounded-xl p-5 space-y-3">
        {rt.fields.map(f => (
          <div key={f.key}>
            <label className="text-xs font-semibold text-gray-400 mb-1 block">{f.label}</label>
            {f.type === "textarea" ? (
              <textarea rows={2} value={form[f.key] || ""} placeholder={f.placeholder}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm resize-none" />
            ) : (
              <input type={f.type === "date" ? "date" : "text"} value={form[f.key] || ""} placeholder={f.placeholder}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm" />
            )}
          </div>
        ))}

        {/* Доставка в групу */}
        <div>
          <label className="text-xs font-semibold text-gray-400 mb-1 block">Надіслати в групу (опційно)</label>
          <select value={chatId} onChange={e => setChatId(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm">
            <option value="">— Не надсилати, лише згенерувати —</option>
            {groups.map(g => <option key={g.id} value={g.chatId}>{g.title}</option>)}
          </select>
          {groups.length === 0 && <p className="text-xs text-gray-600 mt-1">Груп немає. Додай бота @cmdcenter_inbox_bot у групу.</p>}
        </div>

        <button onClick={submit} disabled={submitting || !ready}
          className="bg-purple-700 hover:bg-purple-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50">
          {submitting ? "Створюю завдання…" : "🚀 Запустити (через worker на ПК)"}
        </button>
        <p className="text-xs text-gray-600">Завдання виконає Claude на твоєму ноуті (worker має бути запущений). Файл повернеться сюди й піде в групу.</p>
      </div>

      {/* Черга/історія */}
      {jobs.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-300 mb-3">Завдання</p>
          <div className="space-y-2">
            {jobs.map(j => (
              <div key={j.id} className="cc-card rounded-xl p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-white">{REPORT_TYPES.find(r => r.id === j.type)?.name || j.type}</p>
                  <p className="text-xs text-gray-500">{new Date(j.createdAt).toLocaleString("uk-UA")}{j.chatTitle ? ` · → ${j.chatTitle}` : ""}{j.error ? ` · ${j.error}` : ""}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_BADGE[j.status]}`}>{STATUS_LABEL[j.status] || j.status}</span>
                  {j.status === "done" && j.resultFileName && (
                    <a href={`/api/jobs/${j.id}/download`} className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded">⬇</a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
