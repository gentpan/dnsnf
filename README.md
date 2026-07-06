# DNS.NF

DNS.NF is a DNS lookup and infrastructure discovery toolkit for checking public DNS records, reverse DNS data, shared infrastructure, and DNSSEC status.

- Website: https://dns.nf
- Public API: https://api.dns.nf
- Repository: https://github.com/gentpan/dnsnf

## Features

- DNS lookup for `A`, `AAAA`, `CNAME`, `MX`, `NS`, `TXT`, `SOA`, `CAA`, and `ALL`
- Reverse DNS and PTR lookup for IPv4 targets and small CIDR ranges
- Reverse IP discovery for domains observed on the same IPv4 address
- Subdomain discovery with public source labels
- Reverse NS and Reverse MX discovery for shared infrastructure analysis
- DNSSEC inspection for DS, DNSKEY, RRSIG, NSEC, and related records
- Public API reference with interactive request examples
- Blog guides under `/blog` for explaining query purpose and result interpretation
- Request counters, API health latency indicator, and Umami analytics integration

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

### Backend

- Go
- pgx
- Redis
- miekg/dns
- Prometheus metrics

### Data & Deployment

- PostgreSQL
- Redis
- Docker / Docker Compose
- Caddy or any reverse proxy in production

## Project Structure

```text
.
├── src/                  # TanStack Start frontend
│   ├── components/       # App shell, query panels, UI components
│   ├── lib/              # API client, blog content, helpers
│   └── routes/           # File-based routes
├── public/               # Logo, favicon set, manifest
├── backend/              # Go API server
│   ├── cmd/server/       # API entrypoint
│   ├── internal/         # Handlers, middleware, services, repository
│   └── migrations/       # PostgreSQL schema
├── Dockerfile            # Frontend production image
├── docker-compose.yml    # Full local stack
└── package.json          # Frontend scripts and dependencies
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

Run the full stack locally:

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

## Frontend Commands

```bash
pnpm dev              # Start local dev server
pnpm generate-routes  # Regenerate TanStack Router route tree
pnpm test             # Type-check
pnpm build            # Build production output
pnpm preview          # Preview production build
```

## Backend Commands

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

Public API rate limit:

```text
60 requests per minute
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

Most API responses use this shape:

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

Rate-limited requests return:

```json
{
  "code": 429,
  "message": "rate limit exceeded"
}
```

## Production Notes

The production frontend is built with TanStack Start and served by Node from `.output/server/index.mjs`.

A typical production setup:

```text
dns.nf      -> reverse proxy -> frontend Node server
api.dns.nf  -> reverse proxy -> Go API server
```

Recommended service ports:

- Frontend: `3010` behind reverse proxy
- API: `18085` behind reverse proxy

## License

Proprietary. All rights reserved.
