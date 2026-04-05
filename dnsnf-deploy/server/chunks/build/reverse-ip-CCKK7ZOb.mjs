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
  __name: "reverse-ip",
  __ssrInlineRender: true,
  setup(__props) {
    useRoute();
    const ip = ref("");
    const loading = ref(false);
    const error = ref("");
    const result = ref(null);
    const { copiedKey, copyText } = useCopyState(1400);
    const copyDomain = async (domain) => {
      await copyText(domain, domain);
    };
    useSeoMeta({
      title: "DNS.NF | Reverse IP Lookup",
      description: "Reverse IP lookup for IPv4 targets. Find publicly indexed domains that resolve to an IP, with source labels."
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_el_alert = ElAlert;
      const _component_CopyIconButton = __nuxt_component_1;
      const _component_AppUsageGuide = __nuxt_component_2;
      _push(`<section${ssrRenderAttrs(mergeProps({ class: "page-container reverse-page" }, _attrs))} data-v-ead16d87><section class="result-panel reverse-panel" data-v-ead16d87><h3 data-v-ead16d87><span class="panel-title-main" data-v-ead16d87><i class="fa-solid fa-link" aria-hidden="true" data-v-ead16d87></i> Reverse IP Lookup</span></h3><p class="reverse-hint" data-v-ead16d87>This uses public datasets and returns best-effort reverse mappings.</p><div class="reverse-form-row" data-v-ead16d87><input${ssrRenderAttr("value", unref(ip))} class="reverse-input" type="text" placeholder="Enter IPv4, e.g. 8.8.8.8" data-v-ead16d87><button class="reverse-btn" type="button"${ssrIncludeBooleanAttr(unref(loading)) ? " disabled" : ""} data-v-ead16d87>`);
      if (unref(loading)) {
        _push(`<span class="dns-loading-dot" aria-hidden="true" data-v-ead16d87></span>`);
      } else {
        _push(`<!--[--><i class="fa-solid fa-magnifying-glass" aria-hidden="true" data-v-ead16d87></i> Lookup Domains <!--]-->`);
      }
      _push(`</button></div>`);
      if (unref(error)) {
        _push(ssrRenderComponent(_component_el_alert, {
          title: unref(error),
          type: "error",
          class: "reverse-alert"
        }, {
          icon: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<i class="fa-solid fa-circle-exclamation" aria-hidden="true" data-v-ead16d87${_scopeId}></i>`);
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
        _push(`<!--[--><div class="reverse-summary" data-v-ead16d87><div class="record-cell" data-v-ead16d87><span class="record-name" data-v-ead16d87>Target</span><strong class="record-count" data-v-ead16d87>${ssrInterpolate(unref(result).data.ip)}</strong></div><div class="record-cell" data-v-ead16d87><span class="record-name" data-v-ead16d87>Domains</span><strong class="record-count" data-v-ead16d87>${ssrInterpolate(unref(result).data.total)}</strong></div><div class="record-cell" data-v-ead16d87><span class="record-name" data-v-ead16d87>Sources</span><strong class="record-count" data-v-ead16d87>${ssrInterpolate(unref(result).data.sources.length)}</strong></div><div class="record-cell" data-v-ead16d87><span class="record-name" data-v-ead16d87>Cached</span><strong class="record-count" data-v-ead16d87>${ssrInterpolate(unref(result).cached ? "Yes" : "No")}</strong></div></div><div class="reverse-table-wrap" data-v-ead16d87>`);
        if (unref(result).data.errors.length > 0) {
          _push(`<div class="reverse-source-errors" data-v-ead16d87><strong data-v-ead16d87>Data source errors:</strong><ul data-v-ead16d87><!--[-->`);
          ssrRenderList(unref(result).data.errors, (errMsg, idx) => {
            _push(`<li data-v-ead16d87>${ssrInterpolate(errMsg)}</li>`);
          });
          _push(`<!--]--></ul></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="reverse-actions" data-v-ead16d87><button type="button" class="reverse-action-btn" title="Download JSON" data-v-ead16d87><i class="fa-solid fa-file-arrow-down" aria-hidden="true" data-v-ead16d87></i> JSON </button><button type="button" class="reverse-action-btn" title="Download CSV" data-v-ead16d87><i class="fa-solid fa-table" aria-hidden="true" data-v-ead16d87></i> CSV </button></div><table class="reverse-table" data-v-ead16d87><thead data-v-ead16d87><tr data-v-ead16d87><th data-v-ead16d87>Domain</th><th data-v-ead16d87>Sources</th><th class="ta-r" data-v-ead16d87>Action</th></tr></thead><tbody data-v-ead16d87><!--[-->`);
        ssrRenderList(unref(result).data.domains, (row) => {
          _push(`<tr data-v-ead16d87><td data-v-ead16d87><code class="reverse-code" data-v-ead16d87>${ssrInterpolate(row.domain)}</code></td><td data-v-ead16d87><span class="source-list" data-v-ead16d87><!--[-->`);
          ssrRenderList(row.sources, (source) => {
            _push(`<span class="source-pill" data-v-ead16d87>${ssrInterpolate(source)}</span>`);
          });
          _push(`<!--]--></span></td><td class="ta-r" data-v-ead16d87>`);
          _push(ssrRenderComponent(_component_CopyIconButton, {
            copied: unref(copiedKey) === row.domain,
            "copy-title": "Copy domain",
            "aria-label": "Copy domain",
            onClick: ($event) => copyDomain(row.domain)
          }, null, _parent));
          _push(`</td></tr>`);
        });
        _push(`<!--]-->`);
        if (unref(result).data.domains.length === 0) {
          _push(`<tr data-v-ead16d87><td colspan="3" class="muted" data-v-ead16d87>No domains found in current public sources.</td></tr>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</tbody></table></div><!--]-->`);
      } else {
        _push(`<!---->`);
      }
      _push(ssrRenderComponent(_component_AppUsageGuide, {
        title: "How This Query Works",
        description: "Reverse IP correlates one IPv4 to candidate domains using passive public datasets, then returns normalized source labels.",
        points: [
          "Input supports IPv4 only; each query builds a merged candidate list from external public providers.",
          "Source count indicates dataset agreement, not strict DNS authority confidence.",
          "Data source errors reveal rate limits or upstream unavailability during that request window.",
          "Use JSON/CSV export for downstream validation and historical diff workflows."
        ],
        tags: ["IPv4", "Passive Datasets", "Source Trace", "Export-ready"]
      }, null, _parent));
      _push(`</section><blockquote class="privacy-quote" data-v-ead16d87><i class="fa-solid fa-shield-halved privacy-quote-icon" aria-hidden="true" data-v-ead16d87></i><span data-v-ead16d87>Reverse IP lookup results come from public datasets and may be incomplete or delayed.</span></blockquote></section>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/reverse-ip.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const reverseIp = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-ead16d87"]]);

export { reverseIp as default };
//# sourceMappingURL=reverse-ip-CCKK7ZOb.mjs.map
