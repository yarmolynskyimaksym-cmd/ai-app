"use client";
import { useState } from "react";

interface Post { id: string; prompt: string; content: string; network: string; status: string }
const STATUS_COLORS: Record<string, string> = { draft: "bg-gray-700 text-gray-300", scheduled: "bg-yellow-900 text-yellow-300", published: "bg-green-900 text-green-300" };

export function SocialClient({ posts: initial }: { posts: Post[] }) {
  const [posts, setPosts] = useState(initial);
  const [prompt, setPrompt] = useState("");
  const [variants, setVariants] = useState<string[]>([]);
  const [selected, setSelected] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const generate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setGenerating(true);
    const res = await fetch("/api/ai/generate-post", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt }) });
    const data = await res.json();
    setVariants(data.variants || []);
    setSelected(0);
    setGenerating(false);
  };

  const publish = async () => {
    if (!variants[selected]) return;
    setPublishing(true);
    const res = await fetch("/api/integrations/postbridge/publish", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: variants[selected], prompt }),
    });
    const data = await res.json();
    setPosts(prev => [data.post, ...prev]);
    setVariants([]);
    setPrompt("");
    setPublishing(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-bold text-white">📱 Публікація постів</h1>

      <form onSubmit={generate} className="space-y-3">
        <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={3}
          placeholder="Опишіть тему поста: 'пост про запуск нової фічі, дружній тон, заклик підписатися'"
          className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 text-sm outline-none focus:border-blue-500 resize-none" />
        <button type="submit" disabled={generating || !prompt.trim()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50">
          {generating ? "Генерація..." : "🤖 Згенерувати"}
        </button>
      </form>

      {variants.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-300">Оберіть варіант:</p>
          {variants.map((v, i) => (
            <div key={i} onClick={() => setSelected(i)}
              className={`border rounded-xl p-4 cursor-pointer transition-colors ${i === selected ? "border-blue-500 bg-blue-950" : "border-gray-700 bg-gray-900 hover:border-gray-600"}`}>
              <p className="text-xs text-gray-500 mb-1">Варіант {i + 1}</p>
              <p className="text-sm text-gray-200 whitespace-pre-wrap">{v}</p>
            </div>
          ))}
          <button onClick={publish} disabled={publishing}
            className="bg-green-700 hover:bg-green-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 w-full">
            {publishing ? "Публікація..." : "🚀 Опублікувати"}
          </button>
        </div>
      )}

      <div>
        <p className="text-sm font-semibold text-gray-300 mb-3">Пости</p>
        <div className="space-y-2">
          {posts.map(p => (
            <div key={p.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">{p.prompt.slice(0, 60)}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[p.status]}`}>{p.status}</span>
              </div>
              <p className="text-sm text-gray-300 line-clamp-2">{p.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
