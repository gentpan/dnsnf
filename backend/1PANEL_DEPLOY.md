# 1Panel Docker 部署指南

## 📋 部署前准备

确保你已经：
1. 安装了 1Panel 面板
2. 服务器开放 8080 端口（或你自定义的端口）
3. 有一个域名指向服务器（可选，但推荐）

---

## 步骤 1: 上传代码到服务器

### 方式 A: 直接上传（推荐）

1. 在本地项目目录执行：
```bash
# 压缩项目（排除 node_modules 和 .git）
zip -r giantaccel-api.zip . -x "*.git*" -x "*node_modules*" -x "*.DS_Store"
```

2. 登录 1Panel → 文件 → 选择一个目录（如 `/opt`）
3. 上传 `giantaccel-api.zip`
4. 解压：右键点击文件 → 解压

### 方式 B: Git 克隆

在 1Panel 的终端中执行：
```bash
cd /opt
git clone <你的仓库地址> giantaccel-api
cd giantaccel-api
```

---

## 步骤 2: 创建环境变量文件

在 1Panel 文件管理器中，进入项目目录，创建 `.env` 文件：

```env
DB_PASSWORD=你的数据库密码（建议随机生成）
REDIS_PASSWORD=你的Redis密码（建议随机生成）
INTERNAL_TOKEN=你的API Token（建议随机生成）
CORS_ORIGINS=https://dns.nf,https://api.dns.nf
```

**如何生成随机密码：**
在 1Panel 终端执行：
```bash
openssl rand -base64 32
```

---

## 步骤 3: 在 1Panel 中部署

### 3.1 创建容器编排

1. 进入 1Panel → 容器 → 编排
2. 点击 "创建编排"
3. 填写信息：
   - 名称：`giantaccel`
   - 编排内容：复制 `docker-compose.1panel.yml` 的全部内容

4. 点击 "确认"

### 3.2 查看部署状态

等待编排创建完成，你应该看到 3 个容器：
- `giantaccel-api` - API 服务
- `giantaccel-postgres` - 数据库
- `giantaccel-redis` - 缓存

---

## 步骤 4: 测试 API

### 测试健康检查
```bash
curl http://你的服务器IP:8080/health
```

应该返回：
```json
{"status":"ok","timestamp":1234567890}
```

### 测试 V1 API（限流）
```bash
# DNS 查询
curl "http://你的服务器IP:8080/v1/dns/lookup?domain=example.com"

# DNS 历史
curl "http://你的服务器IP:8080/v1/dns/history?domain=example.com"
```

### 测试 V2 API（需 Token）
```bash
# 使用 Bearer Token
curl -H "Authorization: Bearer 你的INTERNAL_TOKEN" \
  "http://你的服务器IP:8080/v2/dns/lookup?domain=example.com"
```

---

## 步骤 5: 配置反向代理（推荐）

为了让 API 可以通过域名访问，配置反向代理：

### 5.1 配置 api.giantaccel.com

1. 1Panel → 网站 → 创建网站
2. 选择 "反向代理"
3. 主域名：`api.giantaccel.com`
4. 代理地址：`http://127.0.0.1:8080`
5. 开启 HTTPS（如果有证书）

### 5.2 配置 api.dns.nf（子站）

1. 创建另一个反向代理网站
2. 主域名：`api.dns.nf`
3. 代理地址：`http://127.0.0.1:8080`
4. 可以配置只代理 `/v1/` 路径

---

## 🔧 常用操作

### 查看日志
```bash
# 在 1Panel 终端执行
cd /opt/giantaccel-api
docker-compose -f docker-compose.1panel.yml logs -f api
```

### 重启服务
```bash
docker-compose -f docker-compose.1panel.yml restart
```

### 更新代码后重新部署
```bash
# 1. 拉取最新代码（如果是 git）
git pull

# 2. 重新构建并启动
docker-compose -f docker-compose.1panel.yml up -d --build
```

### 进入容器
```bash
# 进入 API 容器
docker exec -it giantaccel-api sh

# 进入数据库容器
docker exec -it giantaccel-postgres psql -U postgres -d dns_platform
```

---

## 🛡️ 安全建议

1. **修改默认端口**：不要使用 8080，改为随机高位端口
2. **防火墙设置**：只允许必要 IP 访问 8080
3. **强密码**：使用 `openssl rand -base64 32` 生成强密码
4. **定期备份**：备份 PostgreSQL 数据卷
5. **HTTPS**：生产环境务必使用 HTTPS

---

## 📊 API 路径速查

### V1 API（公开，30次/分钟）
| 功能 | 路径 |
|------|------|
| DNS 查询 | `GET /v1/dns/lookup?domain=xxx&type=ALL` |
| rDNS 扫描 | `GET /v1/dns/rdns?target=x.x.x.x/24` |
| DNS 历史 | `GET /v1/dns/history?domain=xxx` |

### V2 API（需 Token，无限流）
| 功能 | 路径 |
|------|------|
| DNS 查询 | `GET /v2/dns/lookup?domain=xxx` |
| rDNS 扫描 | `GET /v2/dns/rdns?target=x.x.x.x` |
| DNS 历史 | `GET/POST /v2/dns/history` |
| rDNS 记录 | `POST /v2/dns/rdns-records` |

---

## 🆘 常见问题

### 容器启动失败
检查端口冲突：
```bash
netstat -tlnp | grep 8080
```

### 数据库连接失败
检查环境变量是否正确设置，特别是 `DB_PASSWORD`

### API 返回 429（限流）
V1 API 默认 30次/分钟，超过会被限流。使用 V2 + Token 无限流。

### 跨域问题
修改 `CORS_ORIGINS` 环境变量，添加你的前端域名。

---

## 📞 需要帮助？

查看日志获取详细错误信息：
```bash
docker-compose -f docker-compose.1panel.yml logs -f
```
