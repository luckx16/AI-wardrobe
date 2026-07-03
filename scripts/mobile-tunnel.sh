#!/usr/bin/env bash
# Пропрокидывает devtunnel-адрес бэкенда (порт 4000) в client/.env.local,
# чтобы тестировать мобилку без деплоя. Не трогает client/.env.
set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Usage: $0 <devtunnel-url-for-port-4000>"
  echo "Example: $0 https://sc1qmtdw-4000.euw.devtunnels.ms"
  exit 1
fi

API_URL="${1%/}"
FRONT_URL="${API_URL/-4000./-3000.}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../client/.env.local"

touch "$ENV_FILE"

if grep -q '^NEXT_PUBLIC_API_URL=' "$ENV_FILE"; then
  sed -i.bak "s|^NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=${API_URL}/api|" "$ENV_FILE"
  rm -f "$ENV_FILE.bak"
else
  echo "NEXT_PUBLIC_API_URL=${API_URL}/api" >> "$ENV_FILE"
fi

echo "✔ client/.env.local обновлён:"
echo "  NEXT_PUBLIC_API_URL=${API_URL}/api"
echo
echo "Дальше:"
echo "1. Убедись, что порты 3000 и 4000 в PORTS панели VS Code — Public."
echo "2. Перезапусти клиент (npm run dev в client/), чтобы подхватилась переменная."
echo "3. Открой на телефоне:"
echo "   ${FRONT_URL}"
