<script setup lang="ts">
useSeoMeta({
  title: "API & Docs | DNS.NF",
  description:
    "DNS.NF API reference and documentation: endpoints, request examples, record types, and error codes for https://api.dns.nf.",
})

type FeatureRow = {
  name: string
  page: string
  api: string
  note: string
}

type EndpointRow = {
  method: "GET" | "POST"
  path: string
  query: string
  purpose: string
  limit: string
}

type RecordExplain = {
  type: string
  target: string
  useCase: string
}

type TerminalExample = {
  id: string
  label: string
  description: string
  endpoint: string
  query: string
  response: Record<string, unknown>
  origin?: string
}

type LanguageId = "curl" | "node" | "php" | "python" | "go" | "java"

type ErrorRow = {
  code: string
  meaning: string
}

const featureRows: FeatureRow[] = [
  {
    name: "DNS Lookup",
    page: "/dns-lookup",
    api: "/v1/dns/lookup",
    note: "A/AAAA/CNAME/MX/NS/SOA/SRV/TXT/CAA records for domain targets",
  },
  {
    name: "rDNS Scanner",
    page: "/rdns",
    api: "/v1/dns/rdns",
    note: "IPv4/CIDR concurrent scan, PTR+CNAME match modes, scoring and hint labels",
  },
  {
    name: "Reverse IP",
    page: "/reverse-ip",
    api: "/api/reverse-ip",
    note: "Find public domains pointing to one IPv4, with source labels + JSON/CSV export",
  },
  {
    name: "Reverse NS",
    page: "/reverse-ns",
    api: "/api/reverse-ns",
    note: "Find domains sharing authoritative NS servers",
  },
  {
    name: "Reverse MX",
    page: "/reverse-mx",
    api: "/api/reverse-mx",
    note: "Find domains sharing MX mail servers",
  },
  {
    name: "Subdomain Discovery",
    page: "/subdomains",
    api: "/api/subdomains",
    note: "Public host/subdomain discovery with source labels + JSON/CSV export",
  },
  {
    name: "DNSSEC",
    page: "/dnssec",
    api: "/api/dnssec",
    note: "DS / DNSKEY / RRSIG / NSEC checks with 0–100 security score and strong/partial/weak status",
  },
  {
    name: "DNS History",
    page: "/dns-history",
    api: "/v1/dns/history",
    note: "Read passive DNS records from CIRCL, Robtex, and local query history",
  },
]

const endpointRows: EndpointRow[] = [
  {
    method: "GET",
    path: "/v1/dns/lookup",
    query: "domain, type?",
    purpose: "Standard DNS lookup for domain targets",
    limit: "30 req/min per client IP",
  },
  {
    method: "GET",
    path: "/v1/dns/rdns",
    query: "target (ipv4|cidr)",
    purpose: "Concurrent reverse DNS scan with PTR/CNAME scoring",
    limit: "30s cooldown per client",
  },
  {
    method: "GET",
    path: "/api/reverse-ip",
    query: "ip",
    purpose: "Find public domains pointing to an IPv4",
    limit: "Public source dependent",
  },
  {
    method: "GET",
    path: "/api/reverse-ns",
    query: "domain, limit?",
    purpose: "Find domains sharing authoritative NS servers",
    limit: "Server-side capped and cached",
  },
  {
    method: "GET",
    path: "/api/reverse-mx",
    query: "domain, limit?",
    purpose: "Find domains sharing MX mail servers",
    limit: "Server-side capped and cached",
  },
  {
    method: "GET",
    path: "/api/subdomains",
    query: "domain",
    purpose: "Find public host records under target domain",
    limit: "Server-side capped and cached",
  },
  {
    method: "GET",
    path: "/api/dnssec",
    query: "domain",
    purpose: "DS/DNSKEY/RRSIG/NSEC checks with 0–100 security score",
    limit: "30 req/min per client IP",
  },
  {
    method: "GET",
    path: "/v1/dns/history",
    query: "domain, limit?",
    purpose: "Passive DNS history from CIRCL, Robtex, and local records",
    limit: "30 req/min per client IP",
  },
  {
    method: "GET",
    path: "/health",
    query: "(none)",
    purpose: "Health check endpoint",
    limit: "No token required",
  },
]

const recordExplainRows: RecordExplain[] = [
  { type: "A", target: "Domain", useCase: "IPv4 address mapping" },
  { type: "AAAA", target: "Domain", useCase: "IPv6 address mapping" },
  { type: "CNAME", target: "Domain", useCase: "Alias target chain" },
  { type: "MX", target: "Domain", useCase: "Mail server routing and priority" },
  { type: "NS", target: "Domain", useCase: "Authoritative name servers" },
  { type: "PTR", target: "IP/Domain(A/AAAA)", useCase: "Reverse lookup hostname" },
  { type: "SOA", target: "Domain", useCase: "Zone authority metadata" },
  { type: "SRV", target: "Domain", useCase: "Service endpoint target/port/priority" },
  { type: "TXT", target: "Domain", useCase: "Text policies and verification strings" },
  { type: "CAA", target: "Domain", useCase: "Allowed certificate authorities" },
  { type: "SPF / DMARC / DKIM", target: "TXT class", useCase: "Auto-grouped under TXT in this system" },
]

const examples: TerminalExample[] = [
  {
    id: "dns-all",
    label: "DNS ALL",
    description: "Lookup full standard record set for a domain",
    endpoint: "/v1/dns/lookup",
    query: "domain=microsoft.com&type=ALL",
    response: {
      code: 0,
      data: {
        domain: "microsoft.com",
        reverse_dns: ["13.107.253.44 r-0001.example.net"],
        records: {
          A: ["13.107.253.44", "13.107.226.44"],
          AAAA: ["2603:1030:b:3::152"],
          MX: [{ host: "microsoft-com.mail.protection.outlook.com", pref: 10 }],
          NS: ["ns1-39.azure-dns.com", "ns2-39.azure-dns.net"],
          TXT: ["SPF: v=spf1 include:spf.protection.outlook.com -all"],
        },
      },
      cached: false,
      timestamp: 1771545000,
    },
  },
  {
    id: "rdns-cidr",
    label: "rDNS CIDR",
    description: "Scan PTR/CNAME over CIDR with match filters",
    endpoint: "/v1/dns/rdns",
    query: "target=8.8.8.0/30&match_mode=middle&match_target=both",
    response: {
      code: 0,
      data: {
        target: "8.8.8.0/30",
        scanned: 2,
        with_ptr: 1,
        without_ptr: 1,
        results: [
          {
            ip: "8.8.8.1",
            ptr: ["dns.google"],
            cname: [],
            ok: true,
            residential_score: 30,
            hint: "datacenter_ptr_keyword",
            updated_at: "2026-02-20T06:15:20Z",
          },
        ],
      },
      cached: false,
      timestamp: 1771545050,
    },
  },
  {
    id: "reverse-ip",
    label: "Reverse IP",
    description: "Find public domains that resolve to one IPv4",
    endpoint: "/api/reverse-ip",
    origin: "https://dns.nf",
    query: "ip=8.8.8.8",
    response: {
      code: 0,
      data: {
        ip: "8.8.8.8",
        total: 2,
        domains: [
          { domain: "dns.google", sources: ["hackertarget"] },
          { domain: "resolver.google", sources: ["yougetsignal"] },
        ],
      },
      cached: true,
      timestamp: 1771545100,
    },
  },
  {
    id: "reverse-ns",
    label: "Reverse NS",
    description: "Find domains sharing authoritative NS",
    endpoint: "/api/reverse-ns",
    origin: "https://dns.nf",
    query: "domain=example.com&limit=20",
    response: {
      code: 0,
      data: {
        target: "example.com",
        ns: ["ns1.example-dns.com", "ns2.example-dns.com"],
        total_shared: 3,
        items: [
          {
            domain: "sample.net",
            shared_ns: ["ns1.example-dns.com"],
            source_ips: ["93.184.216.34"],
          },
        ],
      },
      cached: false,
      timestamp: 1771545150,
    },
  },
  {
    id: "reverse-mx",
    label: "Reverse MX",
    description: "Find domains sharing MX mail servers",
    endpoint: "/api/reverse-mx",
    origin: "https://dns.nf",
    query: "domain=example.com&limit=20",
    response: {
      code: 0,
      data: {
        target: "example.com",
        mx: ["mx1.example-mail.com"],
        total_shared: 2,
        items: [
          {
            domain: "sample.org",
            shared_mx: ["mx1.example-mail.com"],
            source_ips: ["203.0.113.10"],
          },
        ],
      },
      cached: false,
      timestamp: 1771545180,
    },
  },
  {
    id: "dns-history",
    label: "DNS History",
    description: "Passive DNS records from CIRCL, Robtex, and local query history",
    endpoint: "/v1/dns/history",
    query: "domain=cloudflare.com&limit=10",
    response: {
      code: 0,
      data: {
        domain: "cloudflare.com",
        records: [
          {
            type: "A",
            value: "104.16.133.229",
            first_seen: "2024-01-15T08:30:00Z",
            last_seen: "2026-02-20T12:00:00Z",
            source: "circl",
          },
          {
            type: "A",
            value: "104.16.132.229",
            first_seen: "2024-01-15T08:30:00Z",
            last_seen: "2026-02-20T12:00:00Z",
            source: "robtex",
          },
          {
            type: "AAAA",
            value: "2606:4700::6810:85e5",
            first_seen: "2024-03-10T14:20:00Z",
            last_seen: "2026-02-18T09:15:00Z",
            source: "local",
          },
        ],
        total: 3,
      },
      cached: true,
      timestamp: 1771545200,
    },
  },
]

const errorRows: ErrorRow[] = [
  { code: "200", meaning: "Success — response body contains code, data, cached, timestamp." },
  { code: "400", meaning: "Bad Request — missing or invalid query parameters." },
  { code: "404", meaning: "Not Found — no records found for the requested target." },
  { code: "429", meaning: "Too Many Requests — public rate limit or scan cooldown exceeded." },
  { code: "500", meaning: "Internal Server Error — upstream lookup failure." },
]

const languageTabs: Array<{ id: LanguageId; label: string }> = [
  { id: "curl", label: "cURL" },
  { id: "node", label: "Node.js" },
  { id: "php", label: "PHP" },
  { id: "python", label: "Python" },
  { id: "go", label: "Go" },
  { id: "java", label: "Java" },
]

const activeExampleId = ref(examples[0].id)
const activeLanguage = ref<LanguageId>("curl")
const terminalOutput = ref("")
const terminalRequest = ref("")
const typing = ref(false)
let timer: ReturnType<typeof setInterval> | null = null

const activeExample = computed(() => examples.find((x) => x.id === activeExampleId.value) || examples[0])
const activeLanguageLabel = computed(
  () => languageTabs.find((x) => x.id === activeLanguage.value)?.label || "cURL",
)

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")

const highlightJson = (raw: string) => {
  const tokenRe =
    /("(?:\\.|[^"\\])*"(?=\s*:))|("(?:\\.|[^"\\])*")|\b(true|false|null)\b|\b-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/g
  let out = ""
  let last = 0
  let match: RegExpExecArray | null
  while ((match = tokenRe.exec(raw)) !== null) {
    const token = match[0]
    const index = match.index
    out += escapeHtml(raw.slice(last, index))
    let cls = "token-default"
    if (match[1]) cls = "token-key"
    else if (match[2]) cls = "token-string"
    else if (match[3]) cls = "token-literal"
    else cls = "token-number"
    out += `<span class="${cls}">${escapeHtml(token)}</span>`
    last = index + token.length
  }
  out += escapeHtml(raw.slice(last))
  return out
}

const keywordRe =
  /\b(const|let|var|await|async|import|from|new|return|if|else|for|while|try|catch|defer|func|package|public|private|class|static|void|int|String|System|echo|print|true|false|null|nil)\b/
const punctuationRe = /[{}()[\].,:;]/

const highlightSource = (raw: string) => {
  const tokenRe =
    /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|\b-?\d+(?:\.\d+)?\b|\b(const|let|var|await|async|import|from|new|return|if|else|for|while|try|catch|defer|func|package|public|private|class|static|void|int|String|System|echo|print|true|false|null|nil)\b|[{}()[\].,:;]/g
  let out = ""
  let last = 0
  let match: RegExpExecArray | null
  while ((match = tokenRe.exec(raw)) !== null) {
    const token = match[0]
    const index = match.index
    out += escapeHtml(raw.slice(last, index))
    let cls = "token-default"
    if (token.startsWith('"') || token.startsWith("'")) cls = "token-string"
    else if (keywordRe.test(token)) cls = "token-keyword"
    else if (punctuationRe.test(token)) cls = "token-punc"
    else cls = "token-number"
    out += `<span class="${cls}">${escapeHtml(token)}</span>`
    last = index + token.length
  }
  out += escapeHtml(raw.slice(last))
  return out
}

const highlightedTerminalRequest = computed(() => highlightSource(terminalRequest.value))
const highlightedTerminalOutput = computed(() => highlightJson(terminalOutput.value))

const originText = () => "https://api.dns.nf"

const stopTyping = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  typing.value = false
}

const buildRequestSnippet = (lang: LanguageId, endpoint: string, query: string, origin?: string) => {
  const url = `${origin || originText()}${endpoint}?${query}`
  switch (lang) {
    case "curl":
      return `curl -sS "${url}"`
    case "node":
      return [
        "const url = new URL(\"" + url + "\")",
        "",
        "const res = await fetch(url)",
        "const data = await res.json()",
        "console.log(JSON.stringify(data, null, 2))",
      ].join("\n")
    case "php":
      return [
        "$url = \"" + url + "\";",
        "$response = file_get_contents($url);",
        "$data = json_decode($response, true);",
        "echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;",
      ].join("\n")
    case "python":
      return [
        "import requests",
        "",
        "url = \"" + url + "\"",
        "resp = requests.get(url, timeout=15)",
        "print(resp.text)",
      ].join("\n")
    case "go":
      return [
        "resp, err := http.Get(\"" + url + "\")",
        "if err != nil {",
        "  log.Fatal(err)",
        "}",
        "defer resp.Body.Close()",
        "body, _ := io.ReadAll(resp.Body)",
        "fmt.Println(string(body))",
      ].join("\n")
    case "java":
      return [
        "HttpClient client = HttpClient.newHttpClient();",
        "HttpRequest request = HttpRequest.newBuilder()",
        "  .uri(URI.create(\"" + url + "\"))",
        "  .GET()",
        "  .build();",
        "HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());",
        "System.out.println(response.body());",
      ].join("\n")
    default:
      return `curl -sS "${url}"`
  }
}

const runExample = (id?: string) => {
  if (id) activeExampleId.value = id
  stopTyping()

  const selected = activeExample.value
  terminalRequest.value = buildRequestSnippet(activeLanguage.value, selected.endpoint, selected.query, selected.origin)

  const text = JSON.stringify(selected.response, null, 2)
  terminalOutput.value = ""
  typing.value = true

  let index = 0
  timer = setInterval(() => {
    index += 2
    terminalOutput.value = text.slice(0, index)
    if (index >= text.length) {
      stopTyping()
    }
  }, 8)
}

onMounted(() => runExample(activeExampleId.value))
onBeforeUnmount(() => stopTyping())
</script>

<template>
  <section class="page-container docs-page">
    <section class="docs-hero">
      <h1><i class="fa-solid fa-book-open" aria-hidden="true"></i> API & Documentation</h1>
      <p>
        Live reference for DNS.NF endpoints, record types, and usage examples. Base URL:
        <code class="inline-code">https://api.dns.nf</code>
      </p>
      <div class="docs-badges">
        <span class="docs-badge"><i class="fa-solid fa-gauge-high" aria-hidden="true"></i> DNS Lookup: 30 req/min per IP</span>
        <span class="docs-badge"><i class="fa-solid fa-satellite-dish" aria-hidden="true"></i> rDNS: 30s cooldown per client</span>
        <span class="docs-badge"><i class="fa-solid fa-unlock-keyhole" aria-hidden="true"></i> Public queries: no token required</span>
        <span class="docs-badge"><i class="fa-solid fa-database" aria-hidden="true"></i> Passive DNS from public datasets</span>
      </div>
    </section>

    <section class="docs-card">
      <div class="section-head">
        <h2><i class="fa-solid fa-table" aria-hidden="true"></i> Feature Matrix</h2>
      </div>
      <div class="docs-table-wrap">
        <table class="docs-table feature-matrix-table">
          <thead>
            <tr>
              <th>Feature</th>
              <th>Page</th>
              <th>API</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in featureRows" :key="row.name">
              <td>{{ row.name }}</td>
              <td><code>{{ row.page }}</code></td>
              <td><code>{{ row.api }}</code></td>
              <td>{{ row.note }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="docs-card">
      <div class="section-head">
        <h2><i class="fa-solid fa-plug" aria-hidden="true"></i> API Endpoints</h2>
      </div>
      <div class="docs-table-wrap">
        <table class="docs-table endpoints-table">
          <thead>
            <tr>
              <th>Method</th>
              <th>Path</th>
              <th>Query</th>
              <th>Purpose</th>
              <th>Limit / Rule</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in endpointRows" :key="row.path + row.method">
              <td><span class="method-pill">{{ row.method }}</span></td>
              <td><code>{{ row.path }}</code></td>
              <td class="query-col">{{ row.query }}</td>
              <td>{{ row.purpose }}</td>
              <td>{{ row.limit }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="endpoint-note">
        Public query endpoints do not require an API token. Some endpoints are rate limited or capped to keep the free service available.
      </p>
    </section>

    <section class="docs-card terminal-card">
      <div class="section-head">
        <h2><i class="fa-solid fa-terminal" aria-hidden="true"></i> Interactive Terminal Demo</h2>
      </div>
      <div class="terminal-lang-tabs">
        <button
          v-for="tab in languageTabs"
          :key="tab.id"
          type="button"
          class="terminal-lang-tab"
          :class="{ 'is-active': activeLanguage === tab.id }"
          @click="activeLanguage = tab.id; runExample()"
        >
          {{ tab.label }}
        </button>
      </div>
      <div class="terminal-layout">
        <div class="terminal-example-list">
          <button
            v-for="item in examples"
            :key="item.id"
            type="button"
            class="terminal-example-btn"
            :class="{ 'is-active': activeExampleId === item.id }"
            @click="runExample(item.id)"
          >
            <span class="terminal-example-title">{{ item.label }}</span>
            <span class="terminal-example-desc">{{ item.description }}</span>
          </button>
        </div>

        <div class="terminal-shell">
          <div class="terminal-head">
            <span>{{ activeLanguageLabel }} Example</span>
            <button type="button" class="run-btn" @click="runExample()">
              <i class="fa-solid fa-play" aria-hidden="true"></i> Run
            </button>
          </div>
          <pre class="terminal-command"><code class="terminal-code" v-html="highlightedTerminalRequest"></code></pre>
          <pre class="terminal-output"><code class="terminal-code" v-html="highlightedTerminalOutput"></code><span v-if="typing" class="cursor">|</span></pre>
        </div>
      </div>
    </section>

    <section class="docs-card">
      <div class="section-head">
        <h2><i class="fa-solid fa-list-check" aria-hidden="true"></i> Record Types And Meaning</h2>
      </div>
      <div class="docs-table-wrap">
        <table class="docs-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Target</th>
              <th>What It Means</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in recordExplainRows" :key="row.type">
              <td><code>{{ row.type }}</code></td>
              <td>{{ row.target }}</td>
              <td>{{ row.useCase }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="docs-card">
      <div class="section-head">
        <h2><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> Response &amp; Errors</h2>
      </div>
      <div class="docs-table-wrap">
        <table class="docs-table">
          <thead>
            <tr>
              <th>HTTP Code</th>
              <th>Meaning</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in errorRows" :key="row.code">
              <td><code>{{ row.code }}</code></td>
              <td>{{ row.meaning }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="endpoint-note">
        All JSON responses share the same shape:
        <code>{ code: number, data: any, cached: boolean, timestamp: number }</code>.
      </p>
    </section>

    <blockquote class="privacy-quote">
      <i class="fa-solid fa-shield-halved privacy-quote-icon" aria-hidden="true"></i>
      <span>DNS.NF queries only publicly available DNS data and public datasets. Some results may be incomplete or delayed.</span>
    </blockquote>
  </section>
</template>

<style scoped>
.docs-page {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.privacy-quote {
  margin-top: 10px;
}

.docs-hero,
.docs-card {
  border: 1px solid var(--panel-border);
  background: #ffffff;
  padding: 16px;
  border-radius: 0;
}

.docs-hero h1 {
  margin: 0;
  color: #1E293B;
  font-size: 24px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.docs-hero p {
  margin-top: 8px;
  color: #64748B;
  font-size: 14px;
}

.inline-code {
  background: #f4f6f8;
  border: 1px solid var(--panel-border);
  color: #1E293B;
  font-size: 13px;
  padding: 2px 6px;
}

.docs-badges {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.docs-badge {
  min-height: 30px;
  border: 1px solid var(--panel-border);
  background: #f8f9fa;
  color: #495057;
  font-size: 12px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 0 10px;
}

.section-head {
  margin-bottom: 10px;
}

.section-head h2 {
  margin: 0;
  color: #1E293B;
  font-size: 19px;
  display: inline-flex;
  align-items: center;
  gap: 9px;
}

.docs-table-wrap {
  border: 1px solid var(--panel-border);
  overflow-x: hidden;
}

.docs-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.docs-table th,
.docs-table td {
  border-bottom: 1px solid var(--panel-border);
  padding: 10px;
  vertical-align: top;
  text-align: left;
  color: #1E293B;
  font-size: 13px;
  line-height: 1.45;
}

.endpoints-table th:nth-child(1),
.endpoints-table td:nth-child(1) { width: 80px; }
.endpoints-table th:nth-child(2),
.endpoints-table td:nth-child(2) { width: 180px; }
.endpoints-table th:nth-child(3),
.endpoints-table td:nth-child(3) { width: 150px; }
.endpoints-table th:nth-child(4),
.endpoints-table td:nth-child(4) { width: 400px; }
.endpoints-table th:nth-child(5),
.endpoints-table td:nth-child(5) { width: auto; }

.feature-matrix-table th:nth-child(1),
.feature-matrix-table td:nth-child(1) { width: 180px; }
.feature-matrix-table th:nth-child(2),
.feature-matrix-table td:nth-child(2) { width: 150px; }
.feature-matrix-table th:nth-child(3),
.feature-matrix-table td:nth-child(3) { width: 160px; }
.feature-matrix-table th:nth-child(4),
.feature-matrix-table td:nth-child(4) { width: auto; }

.docs-table th {
  background: #f8f9fa;
  color: #64748B;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.docs-table tr:last-child td {
  border-bottom: none;
}

.docs-table code,
.endpoint-note code {
  background: #f4f6f8;
  border: 1px solid var(--panel-border);
  color: #1E293B;
  font-size: 12px;
  padding: 2px 6px;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.query-col {
  overflow-wrap: anywhere;
  word-break: break-word;
}

.method-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 24px;
  min-width: 44px;
  border: 1px solid #8ed8ab;
  background: #e9f7ef;
  color: var(--app-accent);
  font-weight: 700;
  font-size: 11px;
  padding: 0 8px;
}

.endpoint-note {
  margin-top: 10px;
  color: #64748B;
  font-size: 13px;
}

.terminal-card {
  overflow: hidden;
}

.terminal-lang-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.terminal-lang-tab {
  min-height: 32px;
  border: 1px solid var(--panel-border);
  background: #ffffff;
  color: #495057;
  font-size: 12px;
  font-weight: 700;
  padding: 0 12px;
  cursor: pointer;
}

.terminal-lang-tab.is-active {
  border-color: var(--app-accent);
  color: var(--app-accent);
  background: #eaf7ef;
}

.terminal-layout {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 12px;
  align-items: stretch;
}

.terminal-example-list {
  border: 1px solid var(--panel-border);
  background: #ffffff;
  padding: 8px;
  display: grid;
  gap: 8px;
  height: 420px;
  overflow: auto;
}

.terminal-example-btn {
  border: 1px solid var(--panel-border);
  background: #ffffff;
  color: #1E293B;
  text-align: left;
  padding: 8px;
  cursor: pointer;
  display: grid;
  gap: 3px;
}

.terminal-example-btn.is-active {
  border-color: var(--app-accent);
  background: #eaf7ef;
}

.terminal-example-title {
  font-size: 13px;
  font-weight: 700;
}

.terminal-example-desc {
  font-size: 12px;
  color: #64748B;
}

.terminal-shell {
  border: 1px solid var(--panel-border);
  background: #0f172a;
  color: #dbeafe;
  height: 420px;
  display: flex;
  flex-direction: column;
}

.terminal-head {
  min-height: 40px;
  border-bottom: 1px solid #1e293b;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  font-size: 12px;
  color: #93c5fd;
}

.run-btn {
  border: 1px solid #2f855a;
  background: var(--app-accent);
  color: #ffffff;
  min-height: 28px;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.run-btn:hover {
  filter: brightness(0.95);
}

.terminal-command {
  margin: 0;
  padding: 10px 12px;
  border-bottom: 1px solid #1e293b;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.terminal-output {
  margin: 0;
  padding: 12px;
  flex: 1;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  overflow: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.terminal-code {
  display: block;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.terminal-shell :deep(.token-default) {
  color: #dbeafe;
}

.terminal-shell :deep(.token-keyword) {
  color: var(--app-accent);
  font-weight: 600;
}

.terminal-shell :deep(.token-key),
.terminal-shell :deep(.token-string) {
  color: #86efac;
}

.terminal-shell :deep(.token-number) {
  color: #facc15;
}

.terminal-shell :deep(.token-literal) {
  color: #60a5fa;
  font-weight: 600;
}

.terminal-shell :deep(.token-punc) {
  color: #94a3b8;
}

html[data-theme="light"] .terminal-shell :deep(.token-default) {
  color: #e2e8f0;
}

html[data-theme="light"] .terminal-shell :deep(.token-keyword) {
  color: var(--app-accent);
}

html[data-theme="light"] .terminal-shell :deep(.token-key),
html[data-theme="light"] .terminal-shell :deep(.token-string) {
  color: #bbf7d0;
}

html[data-theme="light"] .terminal-shell :deep(.token-number) {
  color: #fde68a;
}

html[data-theme="light"] .terminal-shell :deep(.token-literal) {
  color: #93c5fd;
}

html[data-theme="light"] .terminal-shell :deep(.token-punc) {
  color: #cbd5e1;
}

html[data-theme="dark"] .terminal-shell :deep(.token-default) {
  color: #EBEBEB;
}

html[data-theme="dark"] .terminal-shell :deep(.token-keyword) {
  color: var(--app-accent);
}

html[data-theme="dark"] .terminal-shell :deep(.token-key),
html[data-theme="dark"] .terminal-shell :deep(.token-string) {
  color: #86efac;
}

html[data-theme="dark"] .terminal-shell :deep(.token-number) {
  color: #facc15;
}

html[data-theme="dark"] .terminal-shell :deep(.token-literal) {
  color: #60a5fa;
}

html[data-theme="dark"] .terminal-shell :deep(.token-punc) {
  color: #94a3b8;
}

.cursor {
  color: #86efac;
  animation: blink 0.9s steps(1) infinite;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}

@media (max-width: 1024px) {
  .terminal-layout {
    grid-template-columns: 1fr;
  }

  .terminal-shell {
    height: 320px;
  }

  .terminal-example-list {
    height: auto;
    overflow: visible;
  }
}
</style>
