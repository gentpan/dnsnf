import { defineComponent, ref, computed, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderList, ssrInterpolate, ssrRenderClass } from 'vue/server-renderer';
import { u as useSeoMeta } from './composables-kD9ulvwD.mjs';
import { _ as _export_sfc } from './server.mjs';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import '../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'anymatch';
import 'node:crypto';
import 'node:url';
import 'ipx';
import 'unhead/server';
import 'devalue';
import 'unhead/plugins';
import 'unhead/utils';
import 'pinia';
import 'vue-router';
import 'perfect-debounce';
import '@vue/shared';
import 'axios';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "api",
  __ssrInlineRender: true,
  setup(__props) {
    useSeoMeta({
      title: "API & Docs | DNS.NF",
      description: "DNS.NF API reference and documentation: endpoints, request examples, record types, and error codes for https://api.dns.nf."
    });
    const featureRows = [
      {
        name: "DNS Lookup",
        page: "/dns-lookup",
        api: "/v1/dns/lookup",
        note: "A/AAAA/CNAME/MX/NS/SOA/SRV/TXT/CAA records for domain targets"
      },
      {
        name: "rDNS Scanner",
        page: "/rdns",
        api: "/v1/dns/rdns",
        note: "IPv4/CIDR concurrent scan, PTR+CNAME match modes, scoring and hint labels"
      },
      {
        name: "Reverse IP",
        page: "/reverse-ip",
        api: "/api/reverse-ip",
        note: "Find public domains pointing to one IPv4, with source labels + JSON/CSV export"
      },
      {
        name: "Reverse NS",
        page: "/reverse-ns",
        api: "/api/reverse-ns",
        note: "Find domains sharing authoritative NS servers"
      },
      {
        name: "Reverse MX",
        page: "/reverse-mx",
        api: "/api/reverse-mx",
        note: "Find domains sharing MX mail servers"
      },
      {
        name: "Subdomain Discovery",
        page: "/subdomains",
        api: "/api/subdomains",
        note: "Public host/subdomain discovery with source labels + JSON/CSV export"
      },
      {
        name: "DNSSEC",
        page: "/dnssec",
        api: "/api/dnssec",
        note: "DS / DNSKEY / RRSIG / NSEC checks with 0–100 security score and strong/partial/weak status"
      },
      {
        name: "DNS History",
        page: "/dns-history",
        api: "/v1/dns/history",
        note: "Passive DNS records from CIRCL, Robtex, and local query history — permanently stored"
      }
    ];
    const endpointRows = [
      {
        method: "GET",
        path: "/v1/dns/lookup",
        query: "domain, type?",
        purpose: "Standard DNS lookup for domain targets",
        limit: "30 req/min per client IP"
      },
      {
        method: "GET",
        path: "/v1/dns/rdns",
        query: "target (ipv4|cidr)",
        purpose: "Concurrent reverse DNS scan with PTR/CNAME scoring",
        limit: "30s cooldown per client"
      },
      {
        method: "GET",
        path: "/api/reverse-ip",
        query: "ip",
        purpose: "Find public domains pointing to an IPv4",
        limit: "Public source dependent"
      },
      {
        method: "GET",
        path: "/api/reverse-ns",
        query: "domain, limit?",
        purpose: "Find domains sharing authoritative NS servers",
        limit: "Server-side capped and cached"
      },
      {
        method: "GET",
        path: "/api/reverse-mx",
        query: "domain, limit?",
        purpose: "Find domains sharing MX mail servers",
        limit: "Server-side capped and cached"
      },
      {
        method: "GET",
        path: "/api/subdomains",
        query: "domain",
        purpose: "Find public host records under target domain",
        limit: "Server-side capped and cached"
      },
      {
        method: "GET",
        path: "/api/dnssec",
        query: "domain",
        purpose: "DS/DNSKEY/RRSIG/NSEC checks with 0–100 security score",
        limit: "30 req/min per client IP"
      },
      {
        method: "GET",
        path: "/v1/dns/history",
        query: "domain, limit?",
        purpose: "Passive DNS history from CIRCL, Robtex, and local records",
        limit: "30 req/min per client IP"
      },
      {
        method: "POST",
        path: "/v1/dns/history",
        query: "(JSON body)",
        purpose: "Ingest passive DNS records (internal / V2 use)",
        limit: "Requires Bearer token"
      },
      {
        method: "GET",
        path: "/health",
        query: "(none)",
        purpose: "Health check endpoint",
        limit: "No auth; monitoring use"
      }
    ];
    const recordExplainRows = [
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
      { type: "SPF / DMARC / DKIM", target: "TXT class", useCase: "Auto-grouped under TXT in this system" }
    ];
    const examples = [
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
              TXT: ["SPF: v=spf1 include:spf.protection.outlook.com -all"]
            }
          },
          cached: false,
          timestamp: 1771545e3
        }
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
                updated_at: "2026-02-20T06:15:20Z"
              }
            ]
          },
          cached: false,
          timestamp: 1771545050
        }
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
              { domain: "resolver.google", sources: ["yougetsignal"] }
            ]
          },
          cached: true,
          timestamp: 1771545100
        }
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
                source_ips: ["93.184.216.34"]
              }
            ]
          },
          cached: false,
          timestamp: 1771545150
        }
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
                source_ips: ["203.0.113.10"]
              }
            ]
          },
          cached: false,
          timestamp: 1771545180
        }
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
                source: "circl"
              },
              {
                type: "A",
                value: "104.16.132.229",
                first_seen: "2024-01-15T08:30:00Z",
                last_seen: "2026-02-20T12:00:00Z",
                source: "robtex"
              },
              {
                type: "AAAA",
                value: "2606:4700::6810:85e5",
                first_seen: "2024-03-10T14:20:00Z",
                last_seen: "2026-02-18T09:15:00Z",
                source: "local"
              }
            ],
            total: 3
          },
          cached: true,
          timestamp: 1771545200
        }
      }
    ];
    const errorRows = [
      { code: "200", meaning: "Success — response body contains code, data, cached, timestamp." },
      { code: "400", meaning: "Bad Request — missing or invalid query parameters." },
      { code: "404", meaning: "Not Found — no records found for the requested target." },
      { code: "429", meaning: "Too Many Requests — rate limit exceeded (30 req/min for V1)." },
      { code: "500", meaning: "Internal Server Error — upstream lookup failure." }
    ];
    const languageTabs = [
      { id: "curl", label: "cURL" },
      { id: "node", label: "Node.js" },
      { id: "php", label: "PHP" },
      { id: "python", label: "Python" },
      { id: "go", label: "Go" },
      { id: "java", label: "Java" }
    ];
    const activeExampleId = ref(examples[0].id);
    const activeLanguage = ref("curl");
    const terminalOutput = ref("");
    const terminalRequest = ref("");
    const typing = ref(false);
    computed(() => examples.find((x) => x.id === activeExampleId.value) || examples[0]);
    const activeLanguageLabel = computed(
      () => languageTabs.find((x) => x.id === activeLanguage.value)?.label || "cURL"
    );
    const escapeHtml = (value) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
    const highlightJson = (raw) => {
      const tokenRe = /("(?:\\.|[^"\\])*"(?=\s*:))|("(?:\\.|[^"\\])*")|\b(true|false|null)\b|\b-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/g;
      let out = "";
      let last = 0;
      let match;
      while ((match = tokenRe.exec(raw)) !== null) {
        const token = match[0];
        const index = match.index;
        out += escapeHtml(raw.slice(last, index));
        let cls = "token-default";
        if (match[1]) cls = "token-key";
        else if (match[2]) cls = "token-string";
        else if (match[3]) cls = "token-literal";
        else cls = "token-number";
        out += `<span class="${cls}">${escapeHtml(token)}</span>`;
        last = index + token.length;
      }
      out += escapeHtml(raw.slice(last));
      return out;
    };
    const keywordRe = /\b(const|let|var|await|async|import|from|new|return|if|else|for|while|try|catch|defer|func|package|public|private|class|static|void|int|String|System|echo|print|true|false|null|nil)\b/;
    const punctuationRe = /[{}()[\].,:;]/;
    const highlightSource = (raw) => {
      const tokenRe = /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|\b-?\d+(?:\.\d+)?\b|\b(const|let|var|await|async|import|from|new|return|if|else|for|while|try|catch|defer|func|package|public|private|class|static|void|int|String|System|echo|print|true|false|null|nil)\b|[{}()[\].,:;]/g;
      let out = "";
      let last = 0;
      let match;
      while ((match = tokenRe.exec(raw)) !== null) {
        const token = match[0];
        const index = match.index;
        out += escapeHtml(raw.slice(last, index));
        let cls = "token-default";
        if (token.startsWith('"') || token.startsWith("'")) cls = "token-string";
        else if (keywordRe.test(token)) cls = "token-keyword";
        else if (punctuationRe.test(token)) cls = "token-punc";
        else cls = "token-number";
        out += `<span class="${cls}">${escapeHtml(token)}</span>`;
        last = index + token.length;
      }
      out += escapeHtml(raw.slice(last));
      return out;
    };
    const highlightedTerminalRequest = computed(() => highlightSource(terminalRequest.value));
    const highlightedTerminalOutput = computed(() => highlightJson(terminalOutput.value));
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<section${ssrRenderAttrs(mergeProps({ class: "page-container docs-page" }, _attrs))} data-v-f62182d0><section class="docs-hero" data-v-f62182d0><h1 data-v-f62182d0><i class="fa-solid fa-book-open" aria-hidden="true" data-v-f62182d0></i> API &amp; Documentation</h1><p data-v-f62182d0> Live reference for DNS.NF endpoints, record types, and usage examples. Base URL: <code class="inline-code" data-v-f62182d0>https://api.dns.nf</code></p><div class="docs-badges" data-v-f62182d0><span class="docs-badge" data-v-f62182d0><i class="fa-solid fa-gauge-high" aria-hidden="true" data-v-f62182d0></i> DNS Lookup: 30 req/min per IP</span><span class="docs-badge" data-v-f62182d0><i class="fa-solid fa-satellite-dish" aria-hidden="true" data-v-f62182d0></i> rDNS: 30s cooldown per client</span><span class="docs-badge" data-v-f62182d0><i class="fa-solid fa-server" aria-hidden="true" data-v-f62182d0></i> V1: Public (30 req/min) | V2: Internal (Token required)</span><span class="docs-badge" data-v-f62182d0><i class="fa-solid fa-database" aria-hidden="true" data-v-f62182d0></i> Passive DNS permanently stored in PostgreSQL</span></div></section><section class="docs-card" data-v-f62182d0><div class="section-head" data-v-f62182d0><h2 data-v-f62182d0><i class="fa-solid fa-table" aria-hidden="true" data-v-f62182d0></i> Feature Matrix</h2></div><div class="docs-table-wrap" data-v-f62182d0><table class="docs-table feature-matrix-table" data-v-f62182d0><thead data-v-f62182d0><tr data-v-f62182d0><th data-v-f62182d0>Feature</th><th data-v-f62182d0>Page</th><th data-v-f62182d0>API</th><th data-v-f62182d0>Description</th></tr></thead><tbody data-v-f62182d0><!--[-->`);
      ssrRenderList(featureRows, (row) => {
        _push(`<tr data-v-f62182d0><td data-v-f62182d0>${ssrInterpolate(row.name)}</td><td data-v-f62182d0><code data-v-f62182d0>${ssrInterpolate(row.page)}</code></td><td data-v-f62182d0><code data-v-f62182d0>${ssrInterpolate(row.api)}</code></td><td data-v-f62182d0>${ssrInterpolate(row.note)}</td></tr>`);
      });
      _push(`<!--]--></tbody></table></div></section><section class="docs-card" data-v-f62182d0><div class="section-head" data-v-f62182d0><h2 data-v-f62182d0><i class="fa-solid fa-plug" aria-hidden="true" data-v-f62182d0></i> API Endpoints</h2></div><div class="docs-table-wrap" data-v-f62182d0><table class="docs-table endpoints-table" data-v-f62182d0><thead data-v-f62182d0><tr data-v-f62182d0><th data-v-f62182d0>Method</th><th data-v-f62182d0>Path</th><th data-v-f62182d0>Query</th><th data-v-f62182d0>Purpose</th><th data-v-f62182d0>Limit / Rule</th></tr></thead><tbody data-v-f62182d0><!--[-->`);
      ssrRenderList(endpointRows, (row) => {
        _push(`<tr data-v-f62182d0><td data-v-f62182d0><span class="method-pill" data-v-f62182d0>${ssrInterpolate(row.method)}</span></td><td data-v-f62182d0><code data-v-f62182d0>${ssrInterpolate(row.path)}</code></td><td class="query-col" data-v-f62182d0>${ssrInterpolate(row.query)}</td><td data-v-f62182d0>${ssrInterpolate(row.purpose)}</td><td data-v-f62182d0>${ssrInterpolate(row.limit)}</td></tr>`);
      });
      _push(`<!--]--></tbody></table></div><p class="endpoint-note" data-v-f62182d0><strong data-v-f62182d0>V1 API</strong>: Public access, rate limited (30 req/min). <strong data-v-f62182d0>V2 API</strong>: Internal use only, requires Bearer token, no rate limit. </p></section><section class="docs-card terminal-card" data-v-f62182d0><div class="section-head" data-v-f62182d0><h2 data-v-f62182d0><i class="fa-solid fa-terminal" aria-hidden="true" data-v-f62182d0></i> Interactive Terminal Demo</h2></div><div class="terminal-lang-tabs" data-v-f62182d0><!--[-->`);
      ssrRenderList(languageTabs, (tab) => {
        _push(`<button type="button" class="${ssrRenderClass([{ "is-active": unref(activeLanguage) === tab.id }, "terminal-lang-tab"])}" data-v-f62182d0>${ssrInterpolate(tab.label)}</button>`);
      });
      _push(`<!--]--></div><div class="terminal-layout" data-v-f62182d0><div class="terminal-example-list" data-v-f62182d0><!--[-->`);
      ssrRenderList(examples, (item) => {
        _push(`<button type="button" class="${ssrRenderClass([{ "is-active": unref(activeExampleId) === item.id }, "terminal-example-btn"])}" data-v-f62182d0><span class="terminal-example-title" data-v-f62182d0>${ssrInterpolate(item.label)}</span><span class="terminal-example-desc" data-v-f62182d0>${ssrInterpolate(item.description)}</span></button>`);
      });
      _push(`<!--]--></div><div class="terminal-shell" data-v-f62182d0><div class="terminal-head" data-v-f62182d0><span data-v-f62182d0>${ssrInterpolate(unref(activeLanguageLabel))} Example</span><button type="button" class="run-btn" data-v-f62182d0><i class="fa-solid fa-play" aria-hidden="true" data-v-f62182d0></i> Run </button></div><pre class="terminal-command" data-v-f62182d0><code class="terminal-code" data-v-f62182d0>${unref(highlightedTerminalRequest) ?? ""}</code></pre><pre class="terminal-output" data-v-f62182d0><code class="terminal-code" data-v-f62182d0>${unref(highlightedTerminalOutput) ?? ""}</code>`);
      if (unref(typing)) {
        _push(`<span class="cursor" data-v-f62182d0>|</span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</pre></div></div></section><section class="docs-card" data-v-f62182d0><div class="section-head" data-v-f62182d0><h2 data-v-f62182d0><i class="fa-solid fa-list-check" aria-hidden="true" data-v-f62182d0></i> Record Types And Meaning</h2></div><div class="docs-table-wrap" data-v-f62182d0><table class="docs-table" data-v-f62182d0><thead data-v-f62182d0><tr data-v-f62182d0><th data-v-f62182d0>Type</th><th data-v-f62182d0>Target</th><th data-v-f62182d0>What It Means</th></tr></thead><tbody data-v-f62182d0><!--[-->`);
      ssrRenderList(recordExplainRows, (row) => {
        _push(`<tr data-v-f62182d0><td data-v-f62182d0><code data-v-f62182d0>${ssrInterpolate(row.type)}</code></td><td data-v-f62182d0>${ssrInterpolate(row.target)}</td><td data-v-f62182d0>${ssrInterpolate(row.useCase)}</td></tr>`);
      });
      _push(`<!--]--></tbody></table></div></section><section class="docs-card" data-v-f62182d0><div class="section-head" data-v-f62182d0><h2 data-v-f62182d0><i class="fa-solid fa-triangle-exclamation" aria-hidden="true" data-v-f62182d0></i> Response &amp; Errors</h2></div><div class="docs-table-wrap" data-v-f62182d0><table class="docs-table" data-v-f62182d0><thead data-v-f62182d0><tr data-v-f62182d0><th data-v-f62182d0>HTTP Code</th><th data-v-f62182d0>Meaning</th></tr></thead><tbody data-v-f62182d0><!--[-->`);
      ssrRenderList(errorRows, (row) => {
        _push(`<tr data-v-f62182d0><td data-v-f62182d0><code data-v-f62182d0>${ssrInterpolate(row.code)}</code></td><td data-v-f62182d0>${ssrInterpolate(row.meaning)}</td></tr>`);
      });
      _push(`<!--]--></tbody></table></div><p class="endpoint-note" data-v-f62182d0> All JSON responses share the same shape: <code data-v-f62182d0>{ code: number, data: any, cached: boolean, timestamp: number }</code>. </p></section><blockquote class="privacy-quote" data-v-f62182d0><i class="fa-solid fa-shield-halved privacy-quote-icon" aria-hidden="true" data-v-f62182d0></i><span data-v-f62182d0>DNS.NF queries only publicly available DNS data and public datasets. Some results may be incomplete or delayed.</span></blockquote></section>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/api.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const api = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-f62182d0"]]);

export { api as default };
//# sourceMappingURL=api-BRPdbMnM.mjs.map
