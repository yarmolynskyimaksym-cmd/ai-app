import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { askClaudeJSON } from "@/lib/ai";
import { getSlackMessages, getThreadReplies } from "@/lib/adapters/slack";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id as string;

  // КРОК 1 — Нові повідомлення зі Slack
  const slackMsgs = await getSlackMessages(70);

  // КРОК 2 — Відфільтрувати вже оброблені
  const processed = await prisma.bug.findMany({ where: { userId, externalId: { not: null } }, select: { externalId: true } });
  const processedIds = new Set(processed.map(b => b.externalId));
  const newMsgs = slackMsgs.filter(m => !processedIds.has(m.ts));

  let newBugsCount = 0;
  let addedCasesCount = 0;
  let skippedCount = 0;

  if (newMsgs.length > 0) {
    // Фільтрація через Claude — які є багами
    const filtered = await askClaudeJSON<{ bugs: Array<{ index: number; title: string; priority: string }> }>(
      `Проаналізуй повідомлення зі Slack і визнач які є реальними репортами багів.
Це НЕ баг: питання, коментарі, флуд, системні повідомлення, загальні обговорення.
Це баг: збій, помилка, некоректна поведінка, щось що не працює, скарга на проблему.
Якщо сумнівно — НЕ включати.
Одне повідомлення може містити кілька багів — розбий на окремі записи.

Повідомлення:
${newMsgs.map((m, i) => `[${i}] ${m.author}: ${m.text}`).join("\n")}

JSON: {"bugs":[{"index":0,"title":"коротка назва до 60 символів","priority":"critical|high|medium|low"}]}`
    );

    if (filtered.bugs.length === 0) {
      skippedCount = newMsgs.length;
    } else {
      // КРОК 3 — Існуючі баги для групування
      const existingBugs = await prisma.bug.findMany({ where: { userId }, select: { id: true, title: true, externalId: true } });

      for (const fb of filtered.bugs) {
        const msg = newMsgs[fb.index];
        if (!msg) continue;

        // AI-групування з існуючими
        let matchedBugId: string | null = null;
        if (existingBugs.length > 0) {
          const groupResult = await askClaudeJSON<{ match_id: string | null }>(
            `Визнач чи описує цей баг ту ж саму проблему що вже є в списку (>70% схожість за змістом, ігноруй мову та формулювання).
Новий баг: "${fb.title}" — "${msg.text}"
Існуючі:
${existingBugs.map(b => `ID:${b.id} — "${b.title}"`).join("\n")}
JSON: {"match_id":"ID або null якщо новий"}`
          );
          matchedBugId = groupResult.match_id || null;
        }

        if (matchedBugId) {
          // Оновити існуючий
          const existing = await prisma.bug.findUnique({ where: { id: matchedBugId } });
          if (existing) {
            const newCount = existing.caseCount + 1;
            const daysSince = (Date.now() - existing.createdAt.getTime()) / (1000 * 86400);
            const tag = daysSince > 7 || newCount >= 3 ? "Old" : existing.tag;
            await prisma.bug.update({
              where: { id: matchedBugId },
              data: { caseCount: newCount, lastSeen: new Date(), tag },
            });
            addedCasesCount++;
          }
        } else {
          // Новий баг
          const created = await prisma.bug.create({
            data: {
              externalId: msg.ts,
              title: fb.title,
              body: msg.text,
              author: msg.author,
              channel: "#bugs",
              priority: fb.priority,
              status: "new",
              source: "slack",
              tag: "New",
              caseCount: 1,
              lastSeen: new Date(),
              userId,
            },
          });
          existingBugs.push({ id: created.id, title: created.title, externalId: created.externalId });
          newBugsCount++;
        }
      }
      skippedCount = newMsgs.length - filtered.bugs.length;
    }
  }

  // КРОК 5 — Перевірка тредів для оновлення статусів
  const recentBugs = await prisma.bug.findMany({
    where: { userId, externalId: { not: null }, createdAt: { gte: new Date(Date.now() - 14 * 86400 * 1000) } },
    select: { id: true, externalId: true, status: true },
  });

  let statusUpdated = 0;
  for (const bug of recentBugs) {
    if (!bug.externalId) continue;
    const replies = await getThreadReplies(bug.externalId);
    let newStatus: string | null = null;
    for (const reply of replies) {
      if (/in progress|в роботі|беру/.test(reply)) newStatus = "in_progress";
      if (/fixed|виправлено|готово|done|пофікшено/.test(reply)) newStatus = "fixed";
      if (/^wait$|^чекаємо$|відкладено/.test(reply)) newStatus = "new";
    }
    if (newStatus && newStatus !== bug.status) {
      // не понижуємо fixed → in_progress
      const rank: Record<string, number> = { new: 0, in_progress: 1, fixed: 2 };
      if ((rank[newStatus] ?? 0) >= (rank[bug.status] ?? 0)) {
        await prisma.bug.update({ where: { id: bug.id }, data: { status: newStatus } });
        statusUpdated++;
      }
    }
  }

  // КРОК 6 — Авто-оновлення тегів New → Old
  const newTagBugs = await prisma.bug.findMany({ where: { userId, tag: "New" } });
  let tagsUpdated = 0;
  for (const bug of newTagBugs) {
    const daysSince = (Date.now() - bug.createdAt.getTime()) / (1000 * 86400);
    if (daysSince > 7 || bug.caseCount >= 3) {
      await prisma.bug.update({ where: { id: bug.id }, data: { tag: "Old" } });
      tagsUpdated++;
    }
  }

  const allBugs = await prisma.bug.findMany({ where: { userId }, orderBy: { lastSeen: "desc" } });
  return NextResponse.json({
    bugs: allBugs,
    report: { newBugs: newBugsCount, addedCases: addedCasesCount, skipped: skippedCount, statusUpdated, tagsUpdated },
  });
}
