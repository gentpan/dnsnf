import { E as ElAlert } from './el-alert-evJ2M_PZ.mjs';
import { u as useCopyState, a as __nuxt_component_1, _ as __nuxt_component_2 } from './AppUsageGuide-4So_Vmg6.mjs';
import { defineComponent, ref, mergeProps, unref, withCtx, createVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderAttr, ssrIncludeBooleanAttr, ssrRenderComponent, ssrInterpolate, ssrRenderList } from 'vue/server-renderer';
import { _ as _export_sfc, u as useRoute } from './server.mjs';
import { u as useSeoMeta } from './composables-kD9ulvwD.mjs';
import '@vue/shared';
import 'lodash-unified';
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
import 'axios';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/plugins';
import 'unhead/utils';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "subdomains",
  __ssrInlineRender: true,
  setup(__props) {
    useRoute();
    const domain = ref("");
    const loading = ref(false);
    const error = ref("");
    const result = ref(null);
    const { copiedKey, copyText } = useCopyState(1400);
    const copyHost = async (host) => {
      await copyText(host, host);
    };
    useSeoMeta({
      title: "DNS.NF | Find DNS Host Records (Subdomains)",
      description: "Find DNS host records (subdomains) for a domain using public datasets with source labels and export options."
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_el_alert = ElAlert;
      const _component_CopyIconButton = __nuxt_component_1;
      const _component_AppUsageGuide = __nuxt_component_2;
      _push(`<section${ssrRenderAttrs(mergeProps({ class: "page-container subdomain-page" }, _attrs))} data-v-0c6c7739><section class="result-panel subdomain-panel" data-v-0c6c7739><h3 data-v-0c6c7739><span class="panel-title-main" data-v-0c6c7739><i class="fa-solid fa-sitemap" aria-hidden="true" data-v-0c6c7739></i> Find DNS Host Records (Subdomains)</span></h3><p class="subdomain-hint" data-v-0c6c7739>Best-effort discovery from public sources. Results can be incomplete.</p><div class="subdomain-form-row" data-v-0c6c7739><input${ssrRenderAttr("value", unref(domain))} class="subdomain-input" type="text" placeholder="Enter domain, e.g. example.com" data-v-0c6c7739><button class="subdomain-btn" type="button"${ssrIncludeBooleanAttr(unref(loading)) ? " disabled" : ""} data-v-0c6c7739>`);
      if (unref(loading)) {
        _push(`<span class="dns-loading-dot" aria-hidden="true" data-v-0c6c7739></span>`);
      } else {
        _push(`<!--[--><i class="fa-solid fa-magnifying-glass" aria-hidden="true" data-v-0c6c7739></i> Find Subdomains <!--]-->`);
      }
      _push(`</button></div>`);
      if (unref(error)) {
        _push(ssrRenderComponent(_component_el_alert, {
          title: unref(error),
          type: "error",
          class: "subdomain-alert"
        }, {
          icon: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<i class="fa-solid fa-circle-exclamation" aria-hidden="true" data-v-0c6c7739${_scopeId}></i>`);
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
        _push(`<!--[--><div class="subdomain-summary" data-v-0c6c7739><div class="record-cell" data-v-0c6c7739><span class="record-name" data-v-0c6c7739>Target</span><strong class="record-count" data-v-0c6c7739>${ssrInterpolate(unref(result).data.target)}</strong></div><div class="record-cell" data-v-0c6c7739><span class="record-name" data-v-0c6c7739>Hosts</span><strong class="record-count" data-v-0c6c7739>${ssrInterpolate(unref(result).data.total)}</strong></div><div class="record-cell" data-v-0c6c7739><span class="record-name" data-v-0c6c7739>Sources</span><strong class="record-count" data-v-0c6c7739>${ssrInterpolate(unref(result).data.sources.length)}</strong></div><div class="record-cell" data-v-0c6c7739><span class="record-name" data-v-0c6c7739>Cached</span><strong class="record-count" data-v-0c6c7739>${ssrInterpolate(unref(result).cached ? "Yes" : "No")}</strong></div></div><div class="subdomain-table-wrap" data-v-0c6c7739><div class="subdomain-actions" data-v-0c6c7739><button type="button" class="subdomain-action-btn" title="Download JSON" data-v-0c6c7739><i class="fa-solid fa-file-arrow-down" aria-hidden="true" data-v-0c6c7739></i> JSON </button><button type="button" class="subdomain-action-btn" title="Download CSV" data-v-0c6c7739><i class="fa-solid fa-table" aria-hidden="true" data-v-0c6c7739></i> CSV </button></div><table class="subdomain-table" data-v-0c6c7739><thead data-v-0c6c7739><tr data-v-0c6c7739><th data-v-0c6c7739>Host</th><th data-v-0c6c7739>Sources</th><th class="ta-r" data-v-0c6c7739>Action</th></tr></thead><tbody data-v-0c6c7739><!--[-->`);
        ssrRenderList(unref(result).data.items, (row) => {
          _push(`<tr data-v-0c6c7739><td data-v-0c6c7739><code class="subdomain-code subdomain-host" data-v-0c6c7739>${ssrInterpolate(row.host)}</code></td><td data-v-0c6c7739><span class="source-list" data-v-0c6c7739><!--[-->`);
          ssrRenderList(row.sources, (source) => {
            _push(`<span class="source-pill" data-v-0c6c7739>${ssrInterpolate(source)}</span>`);
          });
          _push(`<!--]--></span></td><td class="ta-r" data-v-0c6c7739>`);
          _push(ssrRenderComponent(_component_CopyIconButton, {
            copied: unref(copiedKey) === row.host,
            "copy-title": "Copy host",
            "aria-label": "Copy host",
            onClick: ($event) => copyHost(row.host)
          }, null, _parent));
          _push(`</td></tr>`);
        });
        _push(`<!--]-->`);
        if (unref(result).data.items.length === 0) {
          _push(`<tr data-v-0c6c7739><td colspan="3" class="muted" data-v-0c6c7739>No host records found from current public sources.</td></tr>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</tbody></table></div><!--]-->`);
      } else {
        _push(`<!---->`);
      }
      _push(ssrRenderComponent(_component_AppUsageGuide, {
        title: "How This Query Works",
        description: "Subdomain discovery aggregates passive public feeds, normalizes hostnames, and removes duplicates under the target root zone.",
        points: [
          "Input should be one root domain (for example example.com).",
          "Only in-scope hosts ending with the target root are retained after normalization.",
          "Source labels indicate where each hostname was observed, useful for confidence scoring.",
          "Use JSON/CSV export for inventory baseline, drift checks, and external enrichment."
        ],
        tags: ["Root-zone Scope", "Deduplicated Hosts", "Source Labels", "Inventory Export"]
      }, null, _parent));
      _push(`</section><blockquote class="privacy-quote" data-v-0c6c7739><i class="fa-solid fa-shield-halved privacy-quote-icon" aria-hidden="true" data-v-0c6c7739></i><span data-v-0c6c7739>Subdomain discovery uses public data only and may not be complete.</span></blockquote></section>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/subdomains.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const subdomains = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-0c6c7739"]]);

export { subdomains as default };
//# sourceMappingURL=subdomains-CCKkCwOD.mjs.map
