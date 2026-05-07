<div align="center">

# DNS NF

**DNS 域名管理平台 — Nuxt 3 + Go + PostgreSQL**

<p>
  <img src="https://img.shields.io/badge/Nuxt-3-00DC82?style=for-the-badge&logo=nuxt&logoColor=white" alt="Nuxt">
  <img src="https://img.shields.io/badge/Go-1.26-00ADD8?style=for-the-badge&logo=go&logoColor=white" alt="Go">
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis">
  <img src="https://img.shields.io/badge/Docker-ready-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker">
  <img src="https://img.shields.io/badge/license-MIT-brightgreen?style=for-the-badge" alt="License">
</p>

</div>

---

## 📖 概述

DNS NF 是一个全功能的 DNS 域名管理平台，提供 DNS 查询、反向 DNS（rDNS）查询、域名解析分析等功能。前端使用 Nuxt 3，后端使用 Go + PostgreSQL + Redis。

---

## ✨ 特性

- 🔍 **DNS 查询** — A、AAAA、CNAME、MX、NS、TXT、CAA、SOA、SRV、PTR 等记录类型
- 🔄 **反向 DNS** — rDNS/PTR 查询
- 📊 **数据统计** — 查询统计、日活跃用户
- ⚡ **高性能** — Go 后端 + Redis 缓存
- 🐳 **Docker 部署** — 一键部署
- 🛠️ **1Panel 支持** — 1Panel 应用商店部署

---

## 🚀 快速开始

### Docker 部署

```bash
docker compose up -d
```

### 1Panel 部署

参考 [1PANEL_DEPLOY.md](1PANEL_DEPLOY.md)

---

## 📄 License

MIT
