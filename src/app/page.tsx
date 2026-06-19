import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold">AI App</h1>
      <p className="text-gray-500">Базова структура Next.js + Claude AI</p>
      <div className="flex gap-3 mt-4">
        <Link
          href="/chat"
          className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          Відкрити чат
        </Link>
        <Link
          href="/login"
          className="border px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
        >
          Увійти
        </Link>
      </div>
    </main>
  );
}
