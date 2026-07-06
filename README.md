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

## Description

DNS.NF helps developers, operators, security researchers, domain owners, and infrastructure teams inspect public DNS data from a clean web console and a simple HTTP API.

The current version is built on TanStack Start, React 19, TanStack Router, TanStack Query, Base UI, Tailwind CSS 4, and shadcn/ui-style components. The backend is a Go API using pgx, Redis, PostgreSQL, and miekg/dns.

Use it to check DNS records, investigate infrastructure relationships, discover public subdomains, inspect reverse DNS naming patterns, review DNSSEC posture, and integrate DNS intelligence into scripts or internal tools through `https://api.dns.nf`.

## Keywords

DNS lookup, DNS checker, DNS records, DNS query, DNS propagation, DNS resolver, nslookup, dig DNS, A record lookup, AAAA record lookup, CNAME lookup, MX lookup, NS lookup, TXT lookup, SOA lookup, CAA lookup, PTR lookup, SPF check, DMARC check, reverse DNS lookup, rDNS lookup, reverse IP lookup, subdomain finder, subdomain discovery, reverse NS lookup, reverse MX lookup, DNSSEC checker, DNS API, public DNS API, domain intelligence, infrastructure discovery.

域名解析, DNS查询, DNS查找, DNS记录查询, DNS检测, DNS解析查询, 域名DNS查询, DNS传播检测, nslookup查询, dig查询, A记录查询, AAAA记录查询, CNAME查询, MX记录查询, NS记录查询, TXT记录查询, SOA记录查询, CAA记录查询, PTR查询, SPF查询, DMARC查询, 反向DNS查询, rDNS查询, 反向IP查询, 子域名查询, 反向NS查询, 反向MX查询, DNSSEC检测, DNS API接口, 域名情报, 基础设施发现.

## Features

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

## Tech Stack

### Frontend

- TanStack Start
- React 19
- TanStack Router
- TanStack Query
- Base UI
- shadcn/ui-style components
- Tailwind CSS 4
- Vite
- Nitro runtime

### Backend

- Go
- pgx
- Redis
- miekg/dns
- PostgreSQL
- Prometheus metrics

### Deployment

- Docker / Docker Compose
- Caddy or another reverse proxy
- Frontend Node server built to `.output/server/index.mjs`
- Go API service behind `api.dns.nf`

## Project Structure

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
├── nuxt-assets-legacy/   # Archived Nuxt-era static assets
├── nuxt-server-legacy/   # Archived Nuxt server routes/utilities
├── Dockerfile            # Frontend production image
├── docker-compose.yml    # Local full stack
├── package.json          # Frontend scripts and dependencies
└── vite.config.ts        # TanStack Start / Vite configuration
```

## Requirements

- Node.js 22+
- pnpm
- Go 1.26+
- Docker and Docker Compose

## Local Development

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

## Docker

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

## Commands

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

## Public API

Production base URL:

```text
https://api.dns.nf
```

Public rate limit:

```text
60 requests per minute per client
```

### Health

```bash
curl "https://api.dns.nf/health"
```

### DNS Lookup

```bash
curl "https://api.dns.nf/v1/dns/lookup?domain=example.com&type=ALL"
curl "https://api.dns.nf/v1/dns/lookup?domain=example.com&type=MX"
curl "https://api.dns.nf/v1/dns/lookup?domain=example.com&type=TXT"
```

### Reverse DNS

```bash
curl "https://api.dns.nf/v1/dns/lookup?ip=8.8.8.8&type=RDNS"
curl "https://api.dns.nf/v1/dns/lookup?ip=8.8.8.0/30&type=RDNS"
curl "https://api.dns.nf/v1/dns/rdns?keyword=google&mode=middle&limit=200"
```

### Discovery

```bash
curl "https://api.dns.nf/v1/dns/reverse-ip?ip=8.8.8.8"
curl "https://api.dns.nf/v1/dns/subdomains?domain=example.com"
curl "https://api.dns.nf/v1/dns/reverse-ns?domain=example.com"
curl "https://api.dns.nf/v1/dns/reverse-mx?domain=example.com"
curl "https://api.dns.nf/v1/dns/dnssec?domain=example.com"
```

### Stats

```bash
curl "https://api.dns.nf/v1/dns/stats/overview"
```

## API Response Shape

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

## Pages

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

## SEO Metadata

The app defines shared SEO keywords in `src/lib/seo.ts` and route-level titles/descriptions for each major page. The root document also includes favicon, manifest, theme color, Open Graph, Twitter card, and Umami analytics scripts.

## Production Notes

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
