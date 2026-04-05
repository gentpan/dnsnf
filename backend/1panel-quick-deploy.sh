#!/bin/bash
# GiantAccel 1Panel 一键部署脚本
# 使用方法：在 1Panel 终端中执行: bash 1panel-quick-deploy.sh

set -e

echo "=========================================="
echo "   GiantAccel API 快速部署"
echo "=========================================="

# 设置项目目录
PROJECT_DIR="/opt/giantaccel-api"
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

echo ""
echo "步骤 1/5: 检查 Docker..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    exit 1
fi
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose 未安装"
    exit 1
fi
echo "✅ Docker 环境正常"

echo ""
echo "步骤 2/5: 生成安全密码..."
if [ ! -f .env ]; then
    DB_PASSWORD=$(openssl rand -base64 32)
    REDIS_PASSWORD=$(openssl rand -base64 32)
    INTERNAL_TOKEN=$(openssl rand -base64 32)
    
    cat > .env << EOF
DB_PASSWORD=$DB_PASSWORD
REDIS_PASSWORD=$REDIS_PASSWORD
INTERNAL_TOKEN=$INTERNAL_TOKEN
CORS_ORIGINS=https://dns.nf,https://api.dns.nf,http://localhost:3000
EOF
    
    echo "✅ 环境变量已生成"
    echo ""
    echo "🔐 请保存以下重要信息："
    echo "===================================="
    echo "数据库密码: $DB_PASSWORD"
    echo "Redis密码:  $REDIS_PASSWORD"
    echo "API Token:  $INTERNAL_TOKEN"
    echo "===================================="
    echo "（这些信息已保存到 .env 文件）"
else
    echo "✅ 发现已存在的 .env 文件，使用现有配置"
    source .env
fi

echo ""
echo "步骤 3/5: 创建 docker-compose.yml..."
cat > docker-compose.yml << 'COMPOSE_EOF'
version: '3.8'

services:
  api:
    image: golang:1.26-alpine AS builder
    build:
      context: .
      dockerfile: Dockerfile
    container_name: giantaccel-api
    restart: always
    ports:
      - "8080:8080"
    environment:
      - APP_ENV=production
      - PORT=8080
      - HTTP_READ_TIMEOUT=10s
      - HTTP_WRITE_TIMEOUT=10s
      - HTTP_IDLE_TIMEOUT=60s
      - HTTP_SHUTDOWN_GRACE=10s
      - POSTGRES_DSN=postgres://postgres:${DB_PASSWORD}@postgres:5432/dns_platform?sslmode=disable
      - REDIS_ADDR=redis:6379
      - REDIS_PASSWORD=${REDIS_PASSWORD}
      - REDIS_DB=0
      - DNS_UPSTREAM=1.1.1.1:53
      - CORS_ALLOWED_ORIGINS=${CORS_ORIGINS}
      - INTERNAL_TOKEN=${INTERNAL_TOKEN}
    depends_on:
      - postgres
      - redis
    networks:
      - giantaccel-network

  postgres:
    image: postgres:16-alpine
    container_name: giantaccel-postgres
    restart: always
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=dns_platform
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - giantaccel-network

  redis:
    image: redis:7-alpine
    container_name: giantaccel-redis
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - giantaccel-network

volumes:
  postgres_data:
  redis_data:

networks:
  giantaccel-network:
    driver: bridge
COMPOSE_EOF

echo "✅ Docker Compose 配置已创建"

echo ""
echo "步骤 4/5: 构建并启动服务..."
docker-compose down 2>/dev/null || true
docker-compose up -d --build

# 等待服务启动
sleep 5

echo ""
echo "步骤 5/5: 健康检查..."
if curl -s http://localhost:8080/health > /dev/null; then
    echo "✅ API 服务运行正常"
else
    echo "⏳ 服务启动中，请稍后再检查..."
fi

echo ""
echo "=========================================="
echo "   🎉 部署完成！"
echo "=========================================="
echo ""
echo "📍 访问地址:"
echo "   健康检查: http://$(curl -s ifconfig.me):8080/health"
echo ""
echo "📊 API 路径:"
echo "   V1 (公开限流): /v1/dns/lookup, /v1/dns/rdns, /v1/dns/history"
echo "   V2 (需Token):  /v2/dns/lookup, /v2/dns/rdns, /v2/dns/history"
echo ""
echo "🔧 常用命令:"
echo "   查看日志: docker-compose logs -f api"
echo "   重启服务: docker-compose restart"
echo "   停止服务: docker-compose down"
echo ""
echo "💾 数据卷位置:"
echo "   PostgreSQL: giantaccel-api_postgres_data"
echo "   Redis:      giantaccel-api_redis_data"
echo ""
