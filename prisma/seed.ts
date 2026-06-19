import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("demo123", 10);
  const user = await prisma.user.upsert({
    where: { email: "demo@commandcenter.io" },
    update: {},
    create: { email: "demo@commandcenter.io", name: "Максим", password: hash },
  });

  await prisma.agent.deleteMany();
  await prisma.agent.createMany({ data: [
    { name: "Марія Коваленко", status: "active", metricCurrent: 142, metricPrev: 120, period: "2026-W25" },
    { name: "Петро Сидоренко", status: "active", metricCurrent: 98, metricPrev: 110, period: "2026-W25" },
    { name: "Оксана Бойко", status: "active", metricCurrent: 205, metricPrev: 189, period: "2026-W25" },
    { name: "Дмитро Мельник", status: "paused", metricCurrent: 77, metricPrev: 80, period: "2026-W25" },
    { name: "Ірина Ткач", status: "active", metricCurrent: 160, metricPrev: 145, period: "2026-W25" },
    { name: "Олег Гончар", status: "active", metricCurrent: 55, metricPrev: 90, period: "2026-W25" },
  ]});

  await prisma.bug.deleteMany();
  await prisma.bug.createMany({ data: [
    { title: "API 500 при логіні через Google на iOS", body: "Критична помилка — користувачі не можуть увійти", author: "Іван Коваль", channel: "#bugs", priority: "critical", status: "new", userId: user.id },
    { title: "Кнопка 'Зберегти' зникає після кліку", body: "На сторінці агента зникає кнопка після першого кліку", author: "Оля Марченко", channel: "#bugs", priority: "high", status: "in_progress", userId: user.id },
    { title: "Фільтр по даті не працює в Safari", body: "Баг з часовим поясом — Safari відображає неправильні дати", author: "Сергій Бойко", channel: "#bugs", priority: "medium", status: "new", userId: user.id },
    { title: "Ліміт завантаження файлів 5MB", body: "Треба збільшити до 20MB або зробити chunked upload", author: "Katia", channel: "#bugs", priority: "medium", status: "fixed", userId: user.id },
    { title: "Notification не приходять на Android", body: "Push-повідомлення не доходять на деяких Android 13", author: "Вася Примак", channel: "#mobile-bugs", priority: "high", status: "in_progress", userId: user.id },
  ]});

  await prisma.message.deleteMany({ where: { userId: user.id } });
  await prisma.message.createMany({ data: [
    { channel: "telegram", author: "Марія Агент", text: "Клієнт скаржиться на затримку виплати вже 3 дні! Що робити?", userId: user.id },
    { channel: "telegram", author: "Петро Агент", text: "Скільки лідів треба закрити цього місяця?", userId: user.id },
    { channel: "telegram", author: "Оксана Агент", text: "Не можу увійти в систему, пароль не підходить", userId: user.id },
    { channel: "whatsapp", author: "Дмитро Агент", text: "Зробив 15 дзвінків сьогодні, 3 зацікавлені клієнти", userId: user.id },
    { channel: "telegram", author: "Марія Агент", text: "Клієнт Іваненко відмовляється від договору, потрібна ваша допомога ТЕРМІНОВО", userId: user.id },
    { channel: "instagram", author: "user123", text: "Коли буде нова акція? Дуже чекаємо!", userId: user.id },
    { channel: "facebook", author: "Сергій К.", text: "Шахраї використовують вашу назву компанії!", userId: user.id },
    { channel: "telegram", author: "Ірина Агент", text: "Звіт за тиждень: 8 нових клієнтів, виручка 45 000 грн", userId: user.id },
  ]});

  await prisma.note.deleteMany({ where: { userId: user.id } });
  await prisma.note.createMany({ data: [
    { raw: "дати бонус агенту Марії завтра", action: "Видати бонус Марії Коваленко", dueDate: new Date(), userId: user.id },
    { raw: "зустріч з командою у п'ятницю о 15:00", action: "Зустріч з командою", dueDate: new Date(Date.now() + 4 * 86400000), userId: user.id },
  ]});

  console.log("Seed done. Demo: demo@commandcenter.io / demo123");
}

main().finally(() => prisma.$disconnect());
