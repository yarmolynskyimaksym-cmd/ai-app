#!/usr/bin/env node
// Локальний worker для Command Center.
// Опитує хмару, запускає Claude Code headless зі скілом, повертає згенерований файл.
//
// Запуск:
//   CC_URL=https://ai-app-nu-virid.vercel.app WORKER_SECRET=xxxx node worker/run.mjs
//
// Вимоги: встановлений `claude` CLI, залогінений Chrome у c.liti.live (для скрейп-скілів).

import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CC_URL = process.env.CC_URL || "https://ai-app-nu-virid.vercel.app";
const SECRET = process.env.WORKER_SECRET;
const POLL_MS = Number(process.env.POLL_MS || 5000);
const FILE_EXT = [".xlsx", ".xls", ".csv", ".docx", ".pdf", ".md"];

if (!SECRET) { console.error("❌ Потрібен WORKER_SECRET"); process.exit(1); }

const headers = { "x-worker-secret": SECRET, "Content-Type": "application/json" };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function pollJob() {
  try {
    const res = await fetch(`${CC_URL}/api/jobs/next`, { headers });
    if (!res.ok) return null;
    const data = await res.json();
    return data.job;
  } catch { return null; }
}

function runClaude(prompt, cwd) {
  // Запускаємо Claude Code headless у тимчасовій директорії
  const r = spawnSync("claude", ["-p", prompt, "--permission-mode", "bypassPermissions"], {
    cwd, encoding: "utf8", timeout: 1000 * 60 * 15, maxBuffer: 1024 * 1024 * 50,
  });
  if (r.error) throw new Error(r.error.message);
  return r.stdout || "";
}

function newestFile(dir, sinceMs) {
  const files = readdirSync(dir)
    .filter(f => FILE_EXT.some(e => f.toLowerCase().endsWith(e)))
    .map(f => ({ f, m: statSync(join(dir, f)).mtimeMs }))
    .filter(x => x.m >= sinceMs)
    .sort((a, b) => b.m - a.m);
  return files[0]?.f || null;
}

async function postResult(id, body) {
  await fetch(`${CC_URL}/api/jobs/${id}/result`, { method: "POST", headers, body: JSON.stringify(body) });
}

async function handle(job) {
  console.log(`▶ Job ${job.id} (${job.type})`);
  const dir = mkdtempSync(join(tmpdir(), "cc-job-"));
  const started = Date.now();
  try {
    runClaude(job.prompt, dir);
    const file = newestFile(dir, started - 2000);
    if (!file) throw new Error("Claude не згенерував файл");
    const dataBase64 = readFileSync(join(dir, file)).toString("base64");
    await postResult(job.id, { fileName: file, dataBase64 });
    console.log(`✅ Job ${job.id} → ${file}`);
  } catch (e) {
    console.error(`❌ Job ${job.id}:`, e.message);
    await postResult(job.id, { error: e.message });
  }
}

console.log(`🤖 Worker запущено. Сервер: ${CC_URL}. Опитування кожні ${POLL_MS}ms.`);
while (true) {
  const job = await pollJob();
  if (job) await handle(job);
  else await sleep(POLL_MS);
}
