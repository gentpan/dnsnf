import { _ as _export_sfc, d as useFetch, a as __nuxt_component_1 } from './server.mjs';
import { defineComponent, ref, withAsyncContext, computed, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderList, ssrInterpolate, ssrRenderComponent, ssrRenderAttr } from 'vue/server-renderer';
import { u as useSeoMeta } from './composables-kD9ulvwD.mjs';
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
import 'pinia';
import 'vue-router';
import 'perfect-debounce';
import '@vue/shared';
import 'axios';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/plugins';
import 'unhead/utils';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const rdnsTarget = ref("");
    const reverseIpTarget = ref("");
    const reverseNsTarget = ref("");
    const reverseMxTarget = ref("");
    const subdomainTarget = ref("");
    const heroTypes = ["A", "AAAA", "CNAME", "MX", "NS", "PTR", "TXT", "CAA", "SOA", "SRV", "RDNS"];
    const emptyStats = { query_projects: 0, today_requests: 0, total_queries: 0, today_visitors: 0, updated_at: 0 };
    const { data: statsRes } = ([__temp, __restore] = withAsyncContext(() => useFetch(
      "/api/stats/overview",
      {
        default: () => ({ code: 0, data: emptyStats })
      },
      "$C5KvPmwqSm"
      /* nuxt-injected */
    )), __temp = await __temp, __restore(), __temp);
    const heroStats = computed(() => statsRes.value?.data || emptyStats);
    const formatMetric = (value) => new Intl.NumberFormat("en-US").format(Math.max(0, Number(value) || 0));
    useSeoMeta({
      title: "DNS.NF - DNS Lookup, rDNS, Reverse IP/NS/MX, Subdomains & DNSSEC",
      description: "DNS.NF provides DNS lookup, rDNS CIDR scanning, reverse IP/NS/MX discovery, subdomain search, DNSSEC checks, and DNS history APIs.",
      ogTitle: "DNS.NF - DNS Lookup, rDNS, Reverse IP/NS/MX, Subdomains & DNSSEC",
      ogDescription: "Fast DNS tools with structured output: standard records, rDNS scanner, reverse datasets, DNSSEC validation, and API token quota control.",
      twitterTitle: "DNS.NF - DNS Lookup, rDNS, Reverse IP/NS/MX, Subdomains & DNSSEC",
      twitterDescription: "Query domains and IPs with DNS lookup, rDNS, reverse IP/NS/MX, subdomains, DNSSEC, and DNS history in one workspace."
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_ClientOnly = __nuxt_component_1;
      _push(`<section${ssrRenderAttrs(mergeProps({ class: "page-container" }, _attrs))} data-v-b7b4db42><div class="hero" data-v-b7b4db42><div class="hero-top" data-v-b7b4db42><div class="hero-copy" data-v-b7b4db42><h1 class="hero-title" data-v-b7b4db42><svg class="hero-icon" width="40" height="40" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" data-v-b7b4db42><path d="m40 26h-32c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h32c1.1 0 2-.9 2-2v-12c0-1.1-.9-2-2-2zm-26 12c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4zm26-32h-32c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h32c1.1 0 2-.9 2-2v-12c0-1.1-.9-2-2-2zm-26 12c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z" data-v-b7b4db42></path></svg><span class="hero-title-main" data-v-b7b4db42>DNS.NF</span><span class="hero-title-sub-inline" data-v-b7b4db42>Unified DNS Intelligence Workspace</span></h1><div class="hero-scope" data-v-b7b4db42><h3 data-v-b7b4db42><i class="fa-solid fa-terminal" aria-hidden="true" data-v-b7b4db42></i> Query Scope</h3><div class="hero-scope-layout" data-v-b7b4db42><div class="hero-scope-main" data-v-b7b4db42><p class="hero-desc" data-v-b7b4db42> One workspace for DNS lookup, reverse discovery, and DNS security checks. </p><ul data-v-b7b4db42><li data-v-b7b4db42><span data-v-b7b4db42>Domain</span><strong data-v-b7b4db42>A / AAAA / CNAME / MX / NS / TXT / CAA / SOA / SRV</strong></li><li data-v-b7b4db42><span data-v-b7b4db42>IP / CIDR</span><strong data-v-b7b4db42>PTR lookup and rDNS CIDR scan</strong></li><li data-v-b7b4db42><span data-v-b7b4db42>Reverse Discovery</span><strong data-v-b7b4db42>Reverse IP, Reverse NS, Reverse MX, Subdomains</strong></li><li data-v-b7b4db42><span data-v-b7b4db42>Security</span><strong data-v-b7b4db42>DNSSEC, DNS history</strong></li></ul><div class="hero-types" data-v-b7b4db42><!--[-->`);
      ssrRenderList(heroTypes, (type) => {
        _push(`<span class="app-pill" data-v-b7b4db42>${ssrInterpolate(type)}</span>`);
      });
      _push(`<!--]--></div></div><aside class="hero-stats" aria-label="Site statistics" data-v-b7b4db42><div class="hero-stat-card" data-v-b7b4db42><span class="hero-stat-label" data-v-b7b4db42>Tools</span><strong class="hero-stat-value" data-v-b7b4db42>${ssrInterpolate(formatMetric(unref(heroStats).query_projects))}</strong></div><div class="hero-stat-card" data-v-b7b4db42><span class="hero-stat-label" data-v-b7b4db42>Requests Today</span><strong class="hero-stat-value" data-v-b7b4db42>${ssrInterpolate(formatMetric(unref(heroStats).today_requests))}</strong></div><div class="hero-stat-card" data-v-b7b4db42><span class="hero-stat-label" data-v-b7b4db42>Total Queries</span><strong class="hero-stat-value" data-v-b7b4db42>${ssrInterpolate(formatMetric(unref(heroStats).total_queries))}</strong></div><div class="hero-stat-card" data-v-b7b4db42><span class="hero-stat-label" data-v-b7b4db42>Visitors Today</span><strong class="hero-stat-value" data-v-b7b4db42>${ssrInterpolate(formatMetric(unref(heroStats).today_visitors))}</strong></div></aside></div></div></div></div><div class="hero-footer hero-notes" data-v-b7b4db42><span data-v-b7b4db42><i class="fa-solid fa-square" aria-hidden="true" data-v-b7b4db42></i> DNS + reverse datasets in one workflow</span><span data-v-b7b4db42><i class="fa-solid fa-square" aria-hidden="true" data-v-b7b4db42></i> Structured cards, hint scoring, and query filters</span><span data-v-b7b4db42><i class="fa-solid fa-square" aria-hidden="true" data-v-b7b4db42></i> JSON output, export actions, and token-aware API access</span></div></div><section class="dns-home-box" data-v-b7b4db42><div class="dns-home-head" data-v-b7b4db42><h3 data-v-b7b4db42><i class="fa-solid fa-magnifying-glass" aria-hidden="true" data-v-b7b4db42></i> DNS Lookup</h3><span data-v-b7b4db42>Domain and IP record query</span></div><div class="search-form-wrap" data-v-b7b4db42>`);
      _push(ssrRenderComponent(_component_ClientOnly, null, {}, _parent));
      _push(`</div></section><section class="tool-box rdns-home-box" data-v-b7b4db42><div class="tool-head rdns-home-head" data-v-b7b4db42><h3 data-v-b7b4db42><i class="fa-solid fa-satellite-dish" aria-hidden="true" data-v-b7b4db42></i> rDNS Scanner</h3><span data-v-b7b4db42>Dedicated reverse DNS lookup and CIDR scan result page</span></div><div class="tool-form-card rdns-form-card" data-v-b7b4db42><div class="tool-row rdns-home-row" data-v-b7b4db42><input${ssrRenderAttr("value", unref(rdnsTarget))} type="text" class="tool-input rdns-home-input" placeholder="Enter IPv4 or CIDR, e.g. 8.8.8.8 or 213.230.74.0/24" data-v-b7b4db42><button type="button" class="tool-btn rdns-home-btn" data-v-b7b4db42><i class="fa-solid fa-magnifying-glass" aria-hidden="true" data-v-b7b4db42></i> Scan rDNS </button></div></div></section><section class="tool-box reverseip-home-box" data-v-b7b4db42><div class="tool-head reverseip-home-head" data-v-b7b4db42><h3 data-v-b7b4db42><i class="fa-solid fa-link" aria-hidden="true" data-v-b7b4db42></i> Reverse IP Lookup</h3><span data-v-b7b4db42>Find public domains that point to a single IPv4</span></div><div class="tool-form-card reverseip-form-card" data-v-b7b4db42><div class="tool-row reverseip-home-row" data-v-b7b4db42><input${ssrRenderAttr("value", unref(reverseIpTarget))} type="text" class="tool-input reverseip-home-input" placeholder="Enter IPv4, e.g. 8.8.8.8" data-v-b7b4db42><button type="button" class="tool-btn reverseip-home-btn" data-v-b7b4db42><i class="fa-solid fa-magnifying-glass" aria-hidden="true" data-v-b7b4db42></i> Lookup Domains </button></div></div></section><section class="tool-box sharedns-home-box" data-v-b7b4db42><div class="tool-head sharedns-home-head" data-v-b7b4db42><h3 data-v-b7b4db42><i class="fa-solid fa-server" aria-hidden="true" data-v-b7b4db42></i> Reverse NS</h3><span data-v-b7b4db42>Discover domains that share the same authoritative NS</span></div><div class="tool-form-card sharedns-form-card" data-v-b7b4db42><div class="tool-row sharedns-home-row" data-v-b7b4db42><input${ssrRenderAttr("value", unref(reverseNsTarget))} type="text" class="tool-input sharedns-home-input" placeholder="Enter domain, e.g. example.com" data-v-b7b4db42><button type="button" class="tool-btn sharedns-home-btn" data-v-b7b4db42><i class="fa-solid fa-magnifying-glass" aria-hidden="true" data-v-b7b4db42></i> Find Reverse NS </button></div></div></section><section class="tool-box reversemx-home-box" data-v-b7b4db42><div class="tool-head reversemx-home-head" data-v-b7b4db42><h3 data-v-b7b4db42><i class="fa-solid fa-envelope" aria-hidden="true" data-v-b7b4db42></i> Reverse MX</h3><span data-v-b7b4db42>Discover domains that share the same MX mail servers</span></div><div class="tool-form-card reversemx-form-card" data-v-b7b4db42><div class="tool-row reversemx-home-row" data-v-b7b4db42><input${ssrRenderAttr("value", unref(reverseMxTarget))} type="text" class="tool-input reversemx-home-input" placeholder="Enter domain, e.g. example.com" data-v-b7b4db42><button type="button" class="tool-btn reversemx-home-btn" data-v-b7b4db42><i class="fa-solid fa-magnifying-glass" aria-hidden="true" data-v-b7b4db42></i> Find Reverse MX </button></div></div></section><section class="tool-box subdomain-home-box" data-v-b7b4db42><div class="tool-head subdomain-home-head" data-v-b7b4db42><h3 data-v-b7b4db42><i class="fa-solid fa-sitemap" aria-hidden="true" data-v-b7b4db42></i> Find DNS Host Records (Subdomains)</h3><span data-v-b7b4db42>Discover public subdomains for a target domain</span></div><div class="tool-form-card subdomain-form-card" data-v-b7b4db42><div class="tool-row subdomain-home-row" data-v-b7b4db42><input${ssrRenderAttr("value", unref(subdomainTarget))} type="text" class="tool-input subdomain-home-input" placeholder="Enter domain, e.g. example.com" data-v-b7b4db42><button type="button" class="tool-btn subdomain-home-btn" data-v-b7b4db42><i class="fa-solid fa-magnifying-glass" aria-hidden="true" data-v-b7b4db42></i> Find Subdomains </button></div></div></section><section class="home-extra" data-v-b7b4db42><div class="home-section" data-v-b7b4db42><div class="home-section-head" data-v-b7b4db42><h3 data-v-b7b4db42><i class="fa-solid fa-circle-info" aria-hidden="true" data-v-b7b4db42></i> How DNS.NF Works</h3><span data-v-b7b4db42>What to use it for and how to read results</span></div><div class="info-grid" data-v-b7b4db42><article class="info-card" data-v-b7b4db42><h4 data-v-b7b4db42>What It Does</h4><p data-v-b7b4db42>Lookup DNS records for domains and IPs in one place.</p></article><article class="info-card" data-v-b7b4db42><h4 data-v-b7b4db42>Typical Use Cases</h4><p data-v-b7b4db42>Propagation checks, mail troubleshooting, and DNS debugging.</p></article><article class="info-card" data-v-b7b4db42><h4 data-v-b7b4db42>Service Scope</h4><p data-v-b7b4db42>Fast lookup, grouped results, copy actions, and raw JSON.</p></article><article class="info-card" data-v-b7b4db42><h4 data-v-b7b4db42>Data Completeness</h4><p data-v-b7b4db42>Only publicly resolvable DNS data is returned.</p></article></div></div></section><blockquote class="privacy-quote" data-v-b7b4db42><i class="fa-solid fa-shield-halved privacy-quote-icon" aria-hidden="true" data-v-b7b4db42></i><span data-v-b7b4db42>DNS.NF queries only publicly available DNS data. We do not access private/internal DNS zones, and query targets are processed only to return lookup results.</span></blockquote></section>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-b7b4db42"]]);

export { index as default };
//# sourceMappingURL=index-2fAOT5SW.mjs.map
