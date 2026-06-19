# Command Center Worker

Локальний міст: Command Center (хмара) → Claude на твоєму ПК → файл назад у Command Center → бот шле агентці.

## Запуск

```bash
CC_URL=https://ai-app-nu-virid.vercel.app \
WORKER_SECRET=bea92192d92ec22036f64a8074705372 \
node worker/run.mjs
```

(WORKER_SECRET той самий що у Vercel env.)

## Вимоги
- `claude` CLI у PATH
- Для скрейп-скілів (agent/streamer analytics) — відкритий Chrome, залогінений у c.liti.live, та browser-MCP
- Ноут увімкнений поки чекаєш на звіт

## Як працює
1. На сторінці «Аналітика» обираєш тип звіту, заповнюєш поля, (опційно) групу
2. Worker підхоплює завдання, запускає `claude -p "<промт скіла>"` у тимчасовій теці
3. Claude генерує файл → worker завантажує його назад → Command Center шле в групу
