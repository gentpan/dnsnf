import { E as ElAlert } from './el-alert-evJ2M_PZ.mjs';
import { defineComponent, ref, computed, watch, mergeProps, unref, withCtx, createVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderClass, ssrRenderAttr, ssrIncludeBooleanAttr, ssrInterpolate, ssrRenderComponent, ssrRenderList, ssrLooseContain, ssrLooseEqual, ssrRenderStyle } from 'vue/server-renderer';
import { $ as $fetch } from '../nitro/nitro.mjs';
import { _ as _export_sfc, u as useRoute } from './server.mjs';
import { u as useSeoMeta } from './composables-kD9ulvwD.mjs';
import '@vue/shared';
import 'lodash-unified';
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
import 'axios';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/plugins';
import 'unhead/utils';

const intervalError = "[nuxt] `setInterval` should not be used on the server. Consider wrapping it with an `onNuxtReady`, `onBeforeMount` or `onMounted` lifecycle hook, or ensure you only call it in the browser by checking `false`.";
const setInterval = (() => {
  console.error(intervalError);
});
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "rdns",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute();
    const activeTab = ref("scan");
    const target = ref("");
    const loading = ref(false);
    const error = ref("");
    const result = ref(null);
    const cooldownLeft = ref(0);
    const searchKeyword = ref("");
    const searchMode = ref("middle");
    const searchLoading = ref(false);
    const searchError = ref("");
    const searchResult = ref(null);
    let cooldownTimer = null;
    const isCIDR = computed(() => target.value.includes("/"));
    const isCoolingDown = computed(() => cooldownLeft.value > 0);
    const buttonDisabled = computed(() => loading.value || isCoolingDown.value);
    const buttonText = computed(() => {
      if (loading.value) return "";
      if (isCoolingDown.value) return `${cooldownLeft.value}s`;
      return isCIDR.value ? "Scan rDNS" : "Lookup rDNS";
    });
    const hintLabel = (hint) => {
      const map = {
        residential_ptr_keyword: "Residential PTR",
        datacenter_ptr_keyword: "Datacenter PTR",
        no_ptr: "No PTR",
        neutral_ptr: "Neutral PTR"
      };
      return map[hint] || hint;
    };
    const scoreClass = (score) => {
      if (score >= 65) return "score-high";
      if (score <= 35) return "score-low";
      return "score-mid";
    };
    const formatUpdatedAt = (row) => {
      const value = row.updated_at || row.checked_at || "";
      if (!value) return "-";
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return value;
      return d.toLocaleString();
    };
    const startCooldown = () => {
      if (cooldownTimer) {
        clearInterval(cooldownTimer);
        cooldownTimer = null;
      }
      cooldownLeft.value = 30;
      cooldownTimer = setInterval();
    };
    const runScan = async () => {
      const value = target.value.trim();
      if (!value || buttonDisabled.value) return;
      loading.value = true;
      error.value = "";
      result.value = null;
      startCooldown();
      try {
        if (false) ;
        const resp = await $fetch("/api/rdns", { query: { target: value } });
        result.value = resp;
      } catch (err) {
        const e = err;
        error.value = e.data?.message || e.message || "rDNS scan failed";
      } finally {
        loading.value = false;
      }
    };
    watch(
      () => route.query.target,
      async () => {
        const nextTarget = String(route.query.target || "").trim();
        if (nextTarget && nextTarget !== target.value) {
          target.value = nextTarget;
          await runScan();
        }
      }
    );
    useSeoMeta({
      title: "DNS.NF | rDNS Scanner",
      description: "Concurrent rDNS scan for IPv4 and CIDR targets with PTR analysis and residential hint scoring."
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_el_alert = ElAlert;
      _push(`<section${ssrRenderAttrs(mergeProps({ class: "page-container rdns-page" }, _attrs))} data-v-b1234d68><section class="result-panel rdns-panel" data-v-b1234d68><h3 data-v-b1234d68><span class="panel-title-main" data-v-b1234d68><i class="fa-solid fa-satellite-dish panel-heading-icon" aria-hidden="true" data-v-b1234d68></i> rDNS Scanner</span></h3><div class="rdns-tabs" data-v-b1234d68><button class="${ssrRenderClass([{ "is-active": unref(activeTab) === "scan" }, "rdns-tab-btn"])}" type="button" data-v-b1234d68><i class="fa-solid fa-magnifying-glass" aria-hidden="true" data-v-b1234d68></i> IP / CIDR Scan </button><button class="${ssrRenderClass([{ "is-active": unref(activeTab) === "search" }, "rdns-tab-btn"])}" type="button" data-v-b1234d68><i class="fa-solid fa-database" aria-hidden="true" data-v-b1234d68></i> PTR Reverse Search </button></div>`);
      if (unref(activeTab) === "scan") {
        _push(`<!--[--><p class="rdns-hint" data-v-b1234d68>CIDR scan runs concurrent PTR lookups and returns structured result rows.</p><div class="rdns-form-row" data-v-b1234d68><input${ssrRenderAttr("value", unref(target))} class="rdns-input" type="text" placeholder="Enter IPv4 or CIDR, e.g. 8.8.8.8 or 213.230.74.0/24" data-v-b1234d68><button class="dns-search-btn" type="button"${ssrIncludeBooleanAttr(unref(buttonDisabled)) ? " disabled" : ""} data-v-b1234d68>`);
        if (unref(loading)) {
          _push(`<span class="dns-loading-dot" aria-hidden="true" data-v-b1234d68></span>`);
        } else {
          _push(`<!--[--><i class="fa-solid fa-magnifying-glass" aria-hidden="true" data-v-b1234d68></i> ${ssrInterpolate(unref(buttonText))}<!--]-->`);
        }
        _push(`</button></div>`);
        if (unref(error)) {
          _push(ssrRenderComponent(_component_el_alert, {
            title: unref(error),
            type: "error",
            class: "rdns-alert"
          }, {
            icon: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<i class="fa-solid fa-circle-exclamation" aria-hidden="true" data-v-b1234d68${_scopeId}></i>`);
              } else {
                return [
                  createVNode("i", {
                    class: "fa-solid fa-circle-exclamation",
                    "aria-hidden": "true"
                  })
                ];
              }
            }),
            _: 1
          }, _parent));
        } else {
          _push(`<!---->`);
        }
        if (unref(result)) {
          _push(`<!--[--><div class="rdns-summary" data-v-b1234d68><div class="record-cell" data-v-b1234d68><span class="record-name" data-v-b1234d68>Target</span><strong class="record-count" data-v-b1234d68>${ssrInterpolate(unref(result).data.target)}</strong></div><div class="record-cell" data-v-b1234d68><span class="record-name" data-v-b1234d68>Scanned</span><strong class="record-count" data-v-b1234d68>${ssrInterpolate(unref(result).data.scanned)}</strong></div><div class="record-cell" data-v-b1234d68><span class="record-name" data-v-b1234d68>With PTR</span><strong class="record-count" data-v-b1234d68>${ssrInterpolate(unref(result).data.with_ptr)}</strong></div><div class="record-cell" data-v-b1234d68><span class="record-name" data-v-b1234d68>With CNAME</span><strong class="record-count" data-v-b1234d68>${ssrInterpolate(unref(result).data.with_cname)}</strong></div><div class="record-cell" data-v-b1234d68><span class="record-name" data-v-b1234d68>No PTR</span><strong class="record-count" data-v-b1234d68>${ssrInterpolate(unref(result).data.without_ptr)}</strong></div><div class="record-cell" data-v-b1234d68><span class="record-name" data-v-b1234d68>Failed</span><strong class="record-count" data-v-b1234d68>${ssrInterpolate(unref(result).data.failed)}</strong></div></div><div class="rdns-table-wrap" data-v-b1234d68><table class="rdns-table" data-v-b1234d68><thead data-v-b1234d68><tr data-v-b1234d68><th data-v-b1234d68>IP</th><th data-v-b1234d68>PTR</th><th data-v-b1234d68>CNAME</th><th data-v-b1234d68>Hint</th><th data-v-b1234d68>Score</th><th data-v-b1234d68>Updated At</th><th data-v-b1234d68>Status</th></tr></thead><tbody data-v-b1234d68><!--[-->`);
          ssrRenderList(unref(result).data.results, (row) => {
            _push(`<tr data-v-b1234d68><td data-v-b1234d68><code class="rdns-code rdns-code-ip" data-v-b1234d68>${ssrInterpolate(row.ip)}</code></td><td data-v-b1234d68>`);
            if (row.ptr.length) {
              _push(`<span class="rdns-ptr-list" data-v-b1234d68><!--[-->`);
              ssrRenderList(row.ptr, (ptr) => {
                _push(`<code class="rdns-code rdns-code-ptr" data-v-b1234d68>${ssrInterpolate(ptr)}</code>`);
              });
              _push(`<!--]--></span>`);
            } else {
              _push(`<span class="muted" data-v-b1234d68>-</span>`);
            }
            _push(`</td><td data-v-b1234d68>`);
            if (row.cname.length) {
              _push(`<span class="rdns-cname-list" data-v-b1234d68><!--[-->`);
              ssrRenderList(row.cname, (cname) => {
                _push(`<code class="rdns-code rdns-code-cname" data-v-b1234d68>${ssrInterpolate(cname)}</code>`);
              });
              _push(`<!--]--></span>`);
            } else {
              _push(`<span class="muted" data-v-b1234d68>-</span>`);
            }
            _push(`</td><td data-v-b1234d68>${ssrInterpolate(hintLabel(row.hint))}</td><td data-v-b1234d68><span class="${ssrRenderClass([scoreClass(row.residential_score), "score-badge"])}" data-v-b1234d68>${ssrInterpolate(row.residential_score)}</span></td><td data-v-b1234d68>${ssrInterpolate(formatUpdatedAt(row))}</td><td data-v-b1234d68>`);
            if (row.ok) {
              _push(`<span class="status-badge" data-v-b1234d68><i class="fa-solid fa-circle-check" aria-hidden="true" data-v-b1234d68></i> ok</span>`);
            } else {
              _push(`<span class="status-badge status-badge-err" data-v-b1234d68><i class="fa-solid fa-circle-xmark" aria-hidden="true" data-v-b1234d68></i> fail</span>`);
            }
            _push(`</td></tr>`);
          });
          _push(`<!--]--></tbody></table></div><!--]-->`);
        } else {
          _push(`<!---->`);
        }
        _push(`<!--]-->`);
      } else {
        _push(`<!---->`);
      }
      if (unref(activeTab) === "search") {
        _push(`<!--[--><p class="rdns-hint" data-v-b1234d68>Search stored PTR records by hostname pattern. Data is collected from rDNS scans.</p><div class="rdns-search-row" data-v-b1234d68><input${ssrRenderAttr("value", unref(searchKeyword))} class="rdns-input" type="text" placeholder="Enter hostname pattern, e.g. google, amazonaws.com, .static" data-v-b1234d68><select class="rdns-select rdns-search-select" data-v-b1234d68><option value="left" data-v-b1234d68${ssrIncludeBooleanAttr(Array.isArray(unref(searchMode)) ? ssrLooseContain(unref(searchMode), "left") : ssrLooseEqual(unref(searchMode), "left")) ? " selected" : ""}>Left Match</option><option value="middle" data-v-b1234d68${ssrIncludeBooleanAttr(Array.isArray(unref(searchMode)) ? ssrLooseContain(unref(searchMode), "middle") : ssrLooseEqual(unref(searchMode), "middle")) ? " selected" : ""}>Middle Match</option><option value="right" data-v-b1234d68${ssrIncludeBooleanAttr(Array.isArray(unref(searchMode)) ? ssrLooseContain(unref(searchMode), "right") : ssrLooseEqual(unref(searchMode), "right")) ? " selected" : ""}>Right Match</option></select><button class="dns-search-btn rdns-search-btn" type="button"${ssrIncludeBooleanAttr(unref(searchLoading)) ? " disabled" : ""} data-v-b1234d68>`);
        if (unref(searchLoading)) {
          _push(`<span class="dns-loading-dot" aria-hidden="true" data-v-b1234d68></span>`);
        } else {
          _push(`<!--[--><i class="fa-solid fa-magnifying-glass" aria-hidden="true" data-v-b1234d68></i> Search <!--]-->`);
        }
        _push(`</button></div><div class="rdns-usage" data-v-b1234d68><div class="rdns-usage-title" data-v-b1234d68>How it works</div><div class="rdns-usage-items" data-v-b1234d68><span data-v-b1234d68>1. Left Match: finds PTR records <strong data-v-b1234d68>starting with</strong> the keyword (e.g. <code data-v-b1234d68>static</code> → <code data-v-b1234d68>static.example.com</code>).</span><span data-v-b1234d68>2. Middle Match: finds PTR records <strong data-v-b1234d68>containing</strong> the keyword anywhere (default).</span><span data-v-b1234d68>3. Right Match: finds PTR records <strong data-v-b1234d68>ending with</strong> the keyword (e.g. <code data-v-b1234d68>.google.com</code> → <code data-v-b1234d68>dns.google.com</code>).</span><span data-v-b1234d68>4. Data is accumulated from rDNS scans. Run an IP / CIDR scan first to populate records.</span></div></div>`);
        if (unref(searchError)) {
          _push(ssrRenderComponent(_component_el_alert, {
            title: unref(searchError),
            type: "error",
            class: "rdns-alert"
          }, {
            icon: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<i class="fa-solid fa-circle-exclamation" aria-hidden="true" data-v-b1234d68${_scopeId}></i>`);
              } else {
                return [
                  createVNode("i", {
                    class: "fa-solid fa-circle-exclamation",
                    "aria-hidden": "true"
                  })
                ];
              }
            }),
            _: 1
          }, _parent));
        } else {
          _push(`<!---->`);
        }
        if (unref(searchResult)) {
          _push(`<!--[--><div class="rdns-summary" data-v-b1234d68><div class="record-cell" data-v-b1234d68><span class="record-name" data-v-b1234d68>Keyword</span><strong class="record-count" data-v-b1234d68>${ssrInterpolate(unref(searchResult).data.keyword)}</strong></div><div class="record-cell" data-v-b1234d68><span class="record-name" data-v-b1234d68>Mode</span><strong class="record-count" style="${ssrRenderStyle({ "font-size": "16px" })}" data-v-b1234d68>${ssrInterpolate(unref(searchResult).data.mode)}</strong></div><div class="record-cell" data-v-b1234d68><span class="record-name" data-v-b1234d68>Results</span><strong class="record-count" data-v-b1234d68>${ssrInterpolate(unref(searchResult).data.total)}</strong></div></div>`);
          if (unref(searchResult).data.records.length) {
            _push(`<div class="rdns-table-wrap" data-v-b1234d68><table class="rdns-table" data-v-b1234d68><thead data-v-b1234d68><tr data-v-b1234d68><th data-v-b1234d68>IP</th><th data-v-b1234d68>PTR</th><th data-v-b1234d68>Last Scanned</th></tr></thead><tbody data-v-b1234d68><!--[-->`);
            ssrRenderList(unref(searchResult).data.records, (row) => {
              _push(`<tr data-v-b1234d68><td data-v-b1234d68><code class="rdns-code rdns-code-ip" data-v-b1234d68>${ssrInterpolate(row.ip)}</code></td><td data-v-b1234d68><code class="rdns-code rdns-code-ptr" data-v-b1234d68>${ssrInterpolate(row.ptr)}</code></td><td data-v-b1234d68>${ssrInterpolate(new Date(row.scanned_at).toLocaleString())}</td></tr>`);
            });
            _push(`<!--]--></tbody></table></div>`);
          } else {
            _push(`<div class="rdns-empty" data-v-b1234d68>No PTR records found matching <strong data-v-b1234d68>${ssrInterpolate(unref(searchResult).data.keyword)}</strong>.</div>`);
          }
          _push(`<!--]-->`);
        } else {
          _push(`<!---->`);
        }
        _push(`<!--]-->`);
      } else {
        _push(`<!---->`);
      }
      _push(`</section><blockquote class="privacy-quote" data-v-b1234d68><i class="fa-solid fa-shield-halved privacy-quote-icon" aria-hidden="true" data-v-b1234d68></i><span data-v-b1234d68>DNS.NF queries only publicly available DNS data. We do not access private/internal DNS zones, and query targets are processed only to return lookup results.</span></blockquote></section>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/rdns.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const rdns = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-b1234d68"]]);

export { rdns as default };
//# sourceMappingURL=rdns-B1detQA8.mjs.map
