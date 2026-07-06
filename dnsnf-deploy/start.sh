#!/bin/bash
# DNS.NF 前端启动脚本
# 监听端口由 NITRO_PORT/PORT 或 PM2 环境决定

cd /opt/dnsnf

if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

export NUXT_PUBLIC_API_BASE=${NUXT_PUBLIC_API_BASE:-https://api.dns.nf}
export NUXT_API_INTERNAL_BASE=${NUXT_API_INTERNAL_BASE:-http://127.0.0.1:18085}
export NUXT_INTERNAL_TOKEN=${NUXT_INTERNAL_TOKEN:-}
export NUXT_API_ADMIN_KEY=${NUXT_API_ADMIN_KEY:-}
export NUXT_API_PUBLIC_PER_MINUTE=${NUXT_API_PUBLIC_PER_MINUTE:-30}

if [ -f .output/server/index.mjs ]; then
  node .output/server/index.mjs
else
  node server/index.mjs
fi
