# DNS.NF

![DNS.NF](https://img.shields.io/badge/DNS.NF-DNS%20Intelligence-09090b?style=for-the-badge)
![TanStack Start](https://img.shields.io/badge/TanStack%20Start-React-ff4154?style=for-the-badge&logo=react&logoColor=white)
![Go API](https://img.shields.io/badge/Go-API-00add8?style=for-the-badge&logo=go&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Data-4169e1?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-Cache-dc382d?style=for-the-badge&logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ed?style=for-the-badge&logo=docker&logoColor=white)
![Public API](https://img.shields.io/badge/Public%20API-api.dns.nf-10b981?style=for-the-badge)
![License](https://img.shields.io/badge/License-Proprietary-71717a?style=for-the-badge)

DNS.NF is a modern DNS intelligence platform for DNS lookup, reverse DNS, reverse IP, subdomain discovery, reverse NS, reverse MX, DNSSEC checks, and a public DNS API.

- Website: https://dns.nf
- Public API: https://api.dns.nf
- Repository: https://github.com/gentpan/dnsnf

## Languages

- [中文说明](#中文说明)
- [English Version](#english-version)

## 中文说明

DNS.NF 是一个面向开发者、运维、安全研究、域名持有人和基础设施团队的 DNS 情报查询平台。它提供干净的网页控制台和公开 HTTP API，用于查询 DNS 记录、反向 DNS、反向 IP、子域名、反向 NS、反向 MX、PTR 关键词和 DNSSEC 信息。

当前版本使用 TanStack Start、React 19、TanStack Router、TanStack Query、Base UI、Tailwind CSS 4 和 shadcn/ui 风格组件构建前端。后端是 Go API，使用 pgx、Redis、PostgreSQL 和 miekg/dns。

### 中文关键词

域名解析, DNS查询, DNS查找, DNS记录查询, DNS检测, DNS解析查询, 域名DNS查询, DNS传播检测, nslookup查询, dig查询, A记录查询, AAAA记录查询, CNAME查询, MX记录查询, NS记录查询, TXT记录查询, SOA记录查询, CAA记录查询, PTR查询, SPF查询, DMARC查询, 反向DNS查询, rDNS查询, 反向IP查询, 子域名查询, 子域名发现, 反向NS查询, 反向MX查询, DNSSEC检测, DNS API接口, 公共DNS API, 域名情报, 基础设施发现。

### 功能

- DNS 记录查询：`A`、`AAAA`、`CNAME`、`MX`、`NS`、`TXT`、`SOA`、`CAA`、`SRV`、`PTR` 和 `ALL`
- 反向 DNS 和 PTR 查询，支持 IPv4 目标和小范围 CIDR
- 反向 IP 查询，发现同一 IPv4 上观察到的域名
- 子域名发现，并展示公开来源标签
- 反向 NS 查询，用于发现共享权威 NS 基础设施
- 反向 MX 查询，用于发现共享邮件交换基础设施
- rDNS / PTR 主机名关键词搜索
- DNSSEC 检测：DS、DNSKEY、RRSIG、NSEC 等相关记录
- Public API 页面，包含请求构建、Send 按钮、响应预览和多语言示例
- Blog 页面，为每类查询补充用途说明和结果解释
- API 在线状态和延迟显示、favicon、SEO 元信息、站点地图友好路由和 Umami 统计脚本

### 技术栈

前端：

- TanStack Start
- React 19
- TanStack Router
- TanStack Query
- Base UI
- shadcn/ui-style components
- Tailwind CSS 4
- Vite
- Nitro runtime

后端：

- Go
- pgx
- Redis
- miekg/dns
- PostgreSQL
- Prometheus metrics

部署：

- Docker / Docker Compose
- Caddy 或其他反向代理
- 前端 Node 服务，构建产物为 `.output/server/index.mjs`
- Go API 服务，对外域名为 `api.dns.nf`

### 项目结构

```text
.
├── src/
│   ├── components/       # 应用外壳、查询面板、UI 基础组件
│   ├── lib/              # API 客户端、博客内容、SEO 工具
│   └── routes/           # TanStack Router 文件路由
├── public/               # Logo、favicon、browser config、manifest
├── backend/
│   ├── cmd/server/       # Go API 入口
│   ├── internal/         # handlers、middleware、models、repository、services
│   └── migrations/       # PostgreSQL schema
├── scripts/              # 本地工具脚本
├── Dockerfile            # 前端生产镜像
├── docker-compose.yml    # 本地完整栈
├── package.json          # 前端脚本和依赖
└── vite.config.ts        # TanStack Start / Vite 配置
```

### 本地开发

环境要求：

- Node.js 22+
- pnpm
- Go 1.26+
- Docker 和 Docker Compose

安装前端依赖：

```bash
pnpm install
```

启动 PostgreSQL 和 Redis：

```bash
docker compose up -d postgres redis
```

运行 Go API：

```bash
cd backend
POSTGRES_DSN="postgres://postgres:postgres@localhost:5432/dns_platform?sslmode=disable" \
REDIS_ADDR="localhost:6379" \
REDIS_PASSWORD="redis" \
go run ./cmd/server
```

运行前端：

```bash
VITE_API_BASE="http://localhost:8080" pnpm dev
```

本地地址：

- Web: http://localhost:3000
- API Health: http://localhost:8080/health
- API Metrics: http://localhost:8080/metrics

### Docker

运行完整本地环境：

```bash
docker compose up -d --build
```

默认端口：

- Web: http://localhost:3000
- API: http://localhost:8080
- PostgreSQL: Docker 内部网络
- Redis: Docker 内部网络

常用环境变量：

```env
WEB_PORT=3000
API_PORT=8080
VITE_API_BASE=http://localhost:8080
DB_PASSWORD=postgres
REDIS_PASSWORD=redis
DNS_UPSTREAM=1.1.1.1:53
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
INTERNAL_TOKEN=change-me
```

### 常用命令

前端：

```bash
pnpm dev
pnpm generate-routes
pnpm test
pnpm build
pnpm preview
```

后端：

```bash
cd backend
go test ./...
go run ./cmd/server
```

### Public API

生产 API 地址：

```text
https://api.dns.nf
```

公开限制：

```text
60 requests per minute per client
```

健康检查：

```bash
curl "https://api.dns.nf/health"
```

DNS 查询：

```bash
curl "https://api.dns.nf/v1/dns/lookup?domain=example.com&type=ALL&resolver=cloudflare"
curl "https://api.dns.nf/v1/dns/lookup?domain=example.com&type=MX&resolver=google"
curl "https://api.dns.nf/v1/dns/lookup?domain=example.com&type=TXT&resolver=ali"
```

`resolver` 支持 `cloudflare`、`google`、`ali`、`authoritative` 和 `local`。默认使用 `cloudflare`。

反向 DNS：

```bash
curl "https://api.dns.nf/v1/dns/lookup?ip=8.8.8.8&type=RDNS"
curl "https://api.dns.nf/v1/dns/lookup?ip=8.8.8.0/30&type=RDNS"
curl "https://api.dns.nf/v1/dns/rdns?keyword=google&mode=middle&limit=200"
```

发现类接口：

```bash
curl "https://api.dns.nf/v1/dns/reverse-ip?ip=8.8.8.8"
curl "https://api.dns.nf/v1/dns/subdomains?domain=example.com"
curl "https://api.dns.nf/v1/dns/reverse-ns?domain=example.com"
curl "https://api.dns.nf/v1/dns/reverse-mx?domain=example.com"
curl "https://api.dns.nf/v1/dns/dnssec?domain=example.com"
```

统计接口：

```bash
curl "https://api.dns.nf/v1/dns/stats/overview"
```

### API 响应格式

成功响应通常为：

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

触发限流时：

```json
{
  "code": 429,
  "message": "rate limit exceeded"
}
```

### 页面

- `/` - 主 DNS 查询控制台
- `/dns-lookup` - DNS 记录查询
- `/reverse-ip` - 反向 IP 查询
- `/subdomains` - 子域名发现
- `/reverse-ns` - 共享 NS 查询
- `/reverse-mx` - 共享 MX 查询
- `/rdns` - PTR / rDNS 关键词搜索
- `/dnssec` - DNSSEC 记录检测
- `/api` - Public API 参考和请求控制台
- `/docs` - 产品使用文档和结果解释
- `/blog` - DNS 指南和查询说明文章

### SEO 和统计

应用在 `src/lib/seo.ts` 中维护共享关键词，并为主要页面设置独立标题和描述。根文档包含 favicon、manifest、theme color、Open Graph、Twitter card，以及 Umami analytics 和 heatmap recorder 脚本。

### 生产部署说明

推荐生产结构：

```text
dns.nf      -> reverse proxy -> frontend Node server
api.dns.nf  -> reverse proxy -> Go API server
```

当前生产服务模式：

- Frontend: Node server，使用内部端口，例如 `3010`
- API: Go server，使用内部端口，例如 `18085`
- Reverse proxy: Caddy 或等价 TLS 代理
- Data: PostgreSQL 和 Redis

## English Version

DNS.NF is a DNS intelligence platform for developers, operators, security researchers, domain owners, and infrastructure teams. It provides a clean web console and a public HTTP API for DNS records, reverse DNS, reverse IP, subdomain discovery, reverse NS, reverse MX, PTR keyword search, and DNSSEC inspection.

The current version is built with TanStack Start, React 19, TanStack Router, TanStack Query, Base UI, Tailwind CSS 4, and shadcn/ui-style components. The backend is a Go API powered by pgx, Redis, PostgreSQL, and miekg/dns.

### English Keywords

DNS lookup, DNS checker, DNS records, DNS query, DNS propagation, DNS resolver, nslookup, dig DNS, A record lookup, AAAA record lookup, CNAME lookup, MX lookup, NS lookup, TXT lookup, SOA lookup, CAA lookup, PTR lookup, SPF check, DMARC check, reverse DNS lookup, rDNS lookup, reverse IP lookup, subdomain finder, subdomain discovery, reverse NS lookup, reverse MX lookup, DNSSEC checker, DNS API, public DNS API, domain intelligence, infrastructure discovery.

### Features

- DNS lookup for `A`, `AAAA`, `CNAME`, `MX`, `NS`, `TXT`, `SOA`, `CAA`, `SRV`, `PTR`, and `ALL`
- Reverse DNS and PTR lookup for IPv4 targets and small CIDR ranges
- Reverse IP discovery for domains observed on the same IPv4 address
- Subdomain discovery with public source labels
- Reverse NS lookup for shared authoritative nameserver infrastructure
- Reverse MX lookup for shared mail exchanger infrastructure
- rDNS keyword search for PTR hostname patterns
- DNSSEC inspection for DS, DNSKEY, RRSIG, NSEC, and related records
- Public API page with request builder, Send button, response preview, and language examples
- Blog guides for query purpose, DNS record interpretation, and operational usage
- API health latency indicator, request counters, favicon set, sitemap-friendly routes, and Umami analytics scripts

### Tech Stack

Frontend:

- TanStack Start
- React 19
- TanStack Router
- TanStack Query
- Base UI
- shadcn/ui-style components
- Tailwind CSS 4
- Vite
- Nitro runtime

Backend:

- Go
- pgx
- Redis
- miekg/dns
- PostgreSQL
- Prometheus metrics

Deployment:

- Docker / Docker Compose
- Caddy or another reverse proxy
- Frontend Node server built to `.output/server/index.mjs`
- Go API service behind `api.dns.nf`

### Project Structure

```text
.
├── src/
│   ├── components/       # App shell, query panels, UI primitives
│   ├── lib/              # API client, blog content, SEO helpers
│   └── routes/           # TanStack Router file routes
├── public/               # Logo, favicon set, browser config, manifest
├── backend/
│   ├── cmd/server/       # Go API entrypoint
│   ├── internal/         # Handlers, middleware, models, repository, services
│   └── migrations/       # PostgreSQL schema
├── scripts/              # Small local utility scripts
├── Dockerfile            # Frontend production image
├── docker-compose.yml    # Local full stack
├── package.json          # Frontend scripts and dependencies
└── vite.config.ts        # TanStack Start / Vite configuration
```

### Local Development

Requirements:

- Node.js 22+
- pnpm
- Go 1.26+
- Docker and Docker Compose

Install frontend dependencies:

```bash
pnpm install
```

Start PostgreSQL and Redis:

```bash
docker compose up -d postgres redis
```

Run the Go API:

```bash
cd backend
POSTGRES_DSN="postgres://postgres:postgres@localhost:5432/dns_platform?sslmode=disable" \
REDIS_ADDR="localhost:6379" \
REDIS_PASSWORD="redis" \
go run ./cmd/server
```

Run the web app:

```bash
VITE_API_BASE="http://localhost:8080" pnpm dev
```

Local URLs:

- Web: http://localhost:3000
- API health: http://localhost:8080/health
- API metrics: http://localhost:8080/metrics

### Docker

Run the full local stack:

```bash
docker compose up -d --build
```

Default ports:

- Web: http://localhost:3000
- API: http://localhost:8080
- PostgreSQL: internal Docker network
- Redis: internal Docker network

Useful environment variables:

```env
WEB_PORT=3000
API_PORT=8080
VITE_API_BASE=http://localhost:8080
DB_PASSWORD=postgres
REDIS_PASSWORD=redis
DNS_UPSTREAM=1.1.1.1:53
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
INTERNAL_TOKEN=change-me
```

### Commands

Frontend:

```bash
pnpm dev
pnpm generate-routes
pnpm test
pnpm build
pnpm preview
```

Backend:

```bash
cd backend
go test ./...
go run ./cmd/server
```

### Public API

Production base URL:

```text
https://api.dns.nf
```

Public rate limit:

```text
60 requests per minute per client
```

Health:

```bash
curl "https://api.dns.nf/health"
```

DNS lookup:

```bash
curl "https://api.dns.nf/v1/dns/lookup?domain=example.com&type=ALL&resolver=cloudflare"
curl "https://api.dns.nf/v1/dns/lookup?domain=example.com&type=MX&resolver=google"
curl "https://api.dns.nf/v1/dns/lookup?domain=example.com&type=TXT&resolver=ali"
```

The `resolver` parameter supports `cloudflare`, `google`, `ali`, `authoritative`, and `local`. The default resolver is `cloudflare`.

Reverse DNS:

```bash
curl "https://api.dns.nf/v1/dns/lookup?ip=8.8.8.8&type=RDNS"
curl "https://api.dns.nf/v1/dns/lookup?ip=8.8.8.0/30&type=RDNS"
curl "https://api.dns.nf/v1/dns/rdns?keyword=google&mode=middle&limit=200"
```

Discovery:

```bash
curl "https://api.dns.nf/v1/dns/reverse-ip?ip=8.8.8.8"
curl "https://api.dns.nf/v1/dns/subdomains?domain=example.com"
curl "https://api.dns.nf/v1/dns/reverse-ns?domain=example.com"
curl "https://api.dns.nf/v1/dns/reverse-mx?domain=example.com"
curl "https://api.dns.nf/v1/dns/dnssec?domain=example.com"
```

Stats:

```bash
curl "https://api.dns.nf/v1/dns/stats/overview"
```

### API Response Shape

Successful responses generally follow this structure:

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

Rate-limited responses use:

```json
{
  "code": 429,
  "message": "rate limit exceeded"
}
```

### Pages

- `/` - main DNS lookup console
- `/dns-lookup` - focused DNS record lookup
- `/reverse-ip` - reverse IP discovery
- `/subdomains` - subdomain discovery
- `/reverse-ns` - shared nameserver discovery
- `/reverse-mx` - shared mail infrastructure discovery
- `/rdns` - PTR/rDNS keyword search
- `/dnssec` - DNSSEC record inspection
- `/api` - professional public API reference and request console
- `/docs` - product usage documentation and result interpretation
- `/blog` - DNS guides and query explanations

### SEO Metadata

The app defines shared SEO keywords in `src/lib/seo.ts` and route-level titles/descriptions for each major page. The root document also includes favicon, manifest, theme color, Open Graph, Twitter card, and Umami analytics plus heatmap recorder scripts.

### Production Notes

Recommended production layout:

```text
dns.nf      -> reverse proxy -> frontend Node server
api.dns.nf  -> reverse proxy -> Go API server
```

Current production service pattern:

- Frontend: Node server on an internal port such as `3010`
- API: Go server on an internal port such as `18085`
- Reverse proxy: Caddy or equivalent TLS proxy
- Data: PostgreSQL and Redis

## License

Proprietary. All rights reserved.
