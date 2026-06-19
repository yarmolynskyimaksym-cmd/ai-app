#!/bin/bash
# Подвійний клік у Finder запускає worker Command Center.
cd "$(dirname "$0")"
export CC_URL="https://ai-app-nu-virid.vercel.app"
export WORKER_SECRET="bea92192d92ec22036f64a8074705372"
echo "🤖 Запускаю worker Command Center..."
echo "Не закривай це вікно поки користуєшся аналітикою."
echo ""
node worker/run.mjs
