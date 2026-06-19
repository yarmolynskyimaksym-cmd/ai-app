"use client";
import { useState } from "react";

interface Post { id: string; prompt: string; content: string; network: string; status: string }

const ACCOUNTS = [
  { id: "51526", label: "Instagram — Латам 🇧🇷", platform: "instagram", lang: "португальська (бразильська)" },
  { id: "51525", label: "Instagram — Туреччина 🇹🇷", platform: "instagram", lang: "турецька" },
  { id: "51527", label: "Instagram — Арабська 🇸🇦", platform: "instagram", lang: "арабська" },
  { id: "51554", label: "TikTok — Латам 🇧🇷", platform: "tiktok", lang: "португальська (бразильська)" },
  { id: "51556", label: "TikTok — Туреччина 🇹🇷", platform: "tiktok", lang: "турецька" },
  { id: "51557", label: "TikTok — Арабська 🇸🇦", platform: "tiktok", lang: "арабська" },
];

const MEDIA_TYPES = [
  { value: "photo", label: "📷 Фото" },
  { value: "video", label: "🎬 Відео" },
  { value: "carousel", label: "🖼️ Карусель" },
  { value: "reel", label: "🎥 Reel / Short" },
];

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-700 text-gray-300",
  scheduled: "bg-yellow-900 text-yellow-300",
  published: "bg-green-900 text-green-300",
};

export function SocialClient({ posts: initial }: { posts: Post[] }) {
  const [posts, setPosts] = useState(initial);
  const [idea, setIdea] = useState("");
  const [mediaType, setMediaType] = useState("photo");
  const [selectedAccount, setSelectedAccount] = useState(ACCOUNTS[0].id);
  const [variants, setVariants] = useState<string[]>([]);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishMsg, setPublishMsg] = useState("");

  const account = ACCOUNTS.find(a => a.id === selectedAccount)!;

  const generate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim()) return;
    setGenerating(true);
    setVariants([]);
    setPublishMsg("");
    const res = await fetch("/api/ai/generate-post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: idea, mediaType, accountLabel: account.label, lang: account.lang, platform: account.platform }),
    });
    const data = await res.json();
    setVariants(data.variants || []);
    setSelectedVariant(0);
    setGenerating(false);
  };

  const publish = async () => {
    if (!variants[selectedVariant]) return;
    setPublishing(true);
    setPublishMsg("");
    const res = await fetch("/api/integrations/postbridge/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: variants[selectedVariant],
        prompt: idea,
        accountId: selectedAccount,
        platform: account.platform,
      }),
    });
    const data = await res.json();
    setPosts(prev => [data.post, ...prev]);
    setPublishMsg(data.post.status === "published" ? "✅ Опубліковано!" : "📋 Збережено як чернетку");
    setVariants([]);
    setIdea("");
    setPublishing(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-bold text-white">📱 Публікація постів</h1>

      <form onSubmit={generate} className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        {/* Акаунт */}
        <div>
          <label className="text-xs font-semibold text-gray-400 mb-1.5 block">Акаунт</label>
          <div className="grid grid-cols-2 gap-2">
            {ACCOUNTS.map(a => (
              <button key={a.id} type="button" onClick={() => setSelectedAccount(a.id)}
                className={`text-left px-3 py-2 rounded-lg text-sm transition-colors border ${
                  selectedAccount === a.id
                    ? "bg-blue-600 border-blue-500 text-white"
                    : "bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500"
                }`}>
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* Тип медіа */}
        <div>
          <label className="text-xs font-semibold text-gray-400 mb-1.5 block">Тип медіа</label>
          <div className="flex gap-2">
            {MEDIA_TYPES.map(m => (
              <button key={m.value} type="button" onClick={() => setMediaType(m.value)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  mediaType === m.value
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ідея */}
        <div>
          <label className="text-xs font-semibold text-gray-400 mb-1.5 block">Ідея поста</label>
          <textarea value={idea} onChange={e => setIdea(e.target.value)} rows={4}
            placeholder="Опишіть що має бути в пості: тема, настрій, що показати, заклик до дії..."
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 text-sm outline-none focus:border-blue-500 resize-none" />
        </div>

        <button type="submit" disabled={generating || !idea.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
          {generating ? "Генерую підписи..." : "🤖 Згенерувати підписи"}
        </button>
      </form>

      {/* Варіанти */}
      {variants.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-300">Оберіть варіант підпису ({account.lang}):</p>
          {variants.map((v, i) => (
            <div key={i} onClick={() => setSelectedVariant(i)}
              className={`border rounded-xl p-4 cursor-pointer transition-colors ${
                i === selectedVariant ? "border-blue-500 bg-blue-950" : "border-gray-700 bg-gray-900 hover:border-gray-600"
              }`}>
              <p className="text-xs text-gray-500 mb-1.5">Варіант {i + 1}</p>
              <p className="text-sm text-gray-200 whitespace-pre-wrap">{v}</p>
            </div>
          ))}
          <button onClick={publish} disabled={publishing}
            className="w-full bg-green-700 hover:bg-green-600 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
            {publishing ? "Публікую..." : `🚀 Опублікувати на ${account.label}`}
          </button>
        </div>
      )}

      {publishMsg && (
        <div className="bg-green-950 border border-green-800 rounded-xl p-4 text-sm text-green-300">
          {publishMsg}
        </div>
      )}

      {/* Історія */}
      {posts.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-300 mb-3">Останні пости</p>
          <div className="space-y-2">
            {posts.map(p => (
              <div key={p.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">{p.prompt.slice(0, 60)}{p.prompt.length > 60 ? "..." : ""}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[p.status] || STATUS_COLORS.draft}`}>{p.status}</span>
                </div>
                <p className="text-sm text-gray-300 line-clamp-2">{p.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
