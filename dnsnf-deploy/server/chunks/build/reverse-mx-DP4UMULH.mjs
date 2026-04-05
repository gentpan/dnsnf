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
  __name: "reverse-mx",
  __ssrInlineRender: true,
  setup(__props) {
    useRoute();
    const domain = ref("");
    const loading = ref(false);
    const error = ref("");
    const result = ref(null);
    const { copiedKey, copyText: copyToClipboard } = useCopyState();
    const copyDomain = async (value) => {
      await copyToClipboard(value, value);
    };
    useSeoMeta({
      title: "DNS.NF | Reverse MX",
      description: "Find domains sharing the same MX mail servers. Best-effort discovery using public datasets with DNS MX verification."
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_el_alert = ElAlert;
      const _component_CopyIconButton = __nuxt_component_1;
      const _component_AppUsageGuide = __nuxt_component_2;
      _push(`<section${ssrRenderAttrs(mergeProps({ class: "page-container shared-page" }, _attrs))} data-v-826c67c4><section class="result-panel shared-panel" data-v-826c67c4><h3 data-v-826c67c4><span class="panel-title-main" data-v-826c67c4><i class="fa-solid fa-envelope" aria-hidden="true" data-v-826c67c4></i> Reverse MX</span></h3><p class="shared-hint" data-v-826c67c4>Enter a domain or an MX host (e.g. hzmx01.xmail.ntesmail.com). We verify shared MX from public datasets.</p><div class="shared-form-row" data-v-826c67c4><input${ssrRenderAttr("value", unref(domain))} class="shared-input" type="text" placeholder="Enter domain, e.g. example.com" data-v-826c67c4><button class="shared-btn" type="button"${ssrIncludeBooleanAttr(unref(loading)) ? " disabled" : ""} data-v-826c67c4>`);
      if (unref(loading)) {
        _push(`<span class="dns-loading-dot" aria-hidden="true" data-v-826c67c4></span>`);
      } else {
        _push(`<!--[--><i class="fa-solid fa-magnifying-glass" aria-hidden="true" data-v-826c67c4></i> Find Reverse MX <!--]-->`);
      }
      _push(`</button></div>`);
      if (unref(error)) {
        _push(ssrRenderComponent(_component_el_alert, {
          title: unref(error),
          type: "error",
          class: "shared-alert"
        }, {
          icon: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<i class="fa-solid fa-circle-exclamation" aria-hidden="true" data-v-826c67c4${_scopeId}></i>`);
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
        _push(`<!--[--><div class="shared-summary" data-v-826c67c4><div class="record-cell" data-v-826c67c4><span class="record-name" data-v-826c67c4>Target</span><strong class="record-count" data-v-826c67c4>${ssrInterpolate(unref(result).data.target)}</strong></div><div class="record-cell" data-v-826c67c4><span class="record-name" data-v-826c67c4>Target MX</span><strong class="record-count" data-v-826c67c4>${ssrInterpolate(unref(result).data.mx.length)}</strong></div><div class="record-cell" data-v-826c67c4><span class="record-name" data-v-826c67c4>Candidates</span><strong class="record-count" data-v-826c67c4>${ssrInterpolate(unref(result).data.total_candidates)}</strong></div><div class="record-cell" data-v-826c67c4><span class="record-name" data-v-826c67c4>Matched</span><strong class="record-count" data-v-826c67c4>${ssrInterpolate(unref(result).data.total_shared)}</strong></div><div class="record-cell" data-v-826c67c4><span class="record-name" data-v-826c67c4>Cached</span><strong class="record-count" data-v-826c67c4>${ssrInterpolate(unref(result).cached ? "Yes" : "No")}</strong></div></div><div class="shared-list" data-v-826c67c4><strong class="list-title" data-v-826c67c4> Target MX <span class="mode-tag" data-v-826c67c4>${ssrInterpolate(unref(result).data.input_mode === "mx_host" ? "MX Host Mode" : "Domain Mode")}</span></strong><span class="pill-list" data-v-826c67c4><!--[-->`);
        ssrRenderList(unref(result).data.mx, (mx) => {
          _push(`<code class="shared-code" data-v-826c67c4>${ssrInterpolate(mx)}</code>`);
        });
        _push(`<!--]--></span></div><div class="shared-table-wrap" data-v-826c67c4>`);
        if (unref(result).data.errors.length > 0) {
          _push(`<div class="shared-source-errors" data-v-826c67c4><strong data-v-826c67c4>Data source errors:</strong><ul data-v-826c67c4><!--[-->`);
          ssrRenderList(unref(result).data.errors, (errMsg, idx) => {
            _push(`<li data-v-826c67c4>${ssrInterpolate(errMsg)}</li>`);
          });
          _push(`<!--]--></ul></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<table class="shared-table" data-v-826c67c4><thead data-v-826c67c4><tr data-v-826c67c4><th data-v-826c67c4>Domain</th><th data-v-826c67c4>Shared MX</th><th data-v-826c67c4>Source IPs</th><th class="ta-r" data-v-826c67c4>Action</th></tr></thead><tbody data-v-826c67c4><!--[-->`);
        ssrRenderList(unref(result).data.items, (row) => {
          _push(`<tr data-v-826c67c4><td data-v-826c67c4><code class="shared-code shared-domain" data-v-826c67c4>${ssrInterpolate(row.domain)}</code></td><td data-v-826c67c4><span class="pill-list" data-v-826c67c4><!--[-->`);
          ssrRenderList(row.shared_mx, (mx) => {
            _push(`<code class="shared-code" data-v-826c67c4>${ssrInterpolate(mx)}</code>`);
          });
          _push(`<!--]--></span></td><td data-v-826c67c4><span class="pill-list" data-v-826c67c4><!--[-->`);
          ssrRenderList(row.source_ips, (ip) => {
            _push(`<code class="shared-code shared-ip" data-v-826c67c4>${ssrInterpolate(ip)}</code>`);
          });
          _push(`<!--]--></span></td><td class="ta-r" data-v-826c67c4>`);
          _push(ssrRenderComponent(_component_CopyIconButton, {
            copied: unref(copiedKey) === row.domain,
            "copy-title": "Copy domain",
            "aria-label": "Copy domain",
            onClick: ($event) => copyDomain(row.domain)
          }, null, _parent));
          _push(`</td></tr>`);
        });
        _push(`<!--]-->`);
        if (unref(result).data.items.length === 0) {
          _push(`<tr data-v-826c67c4><td colspan="4" class="muted" data-v-826c67c4>No reverse MX domains found from current data sources.</td></tr>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</tbody></table></div><!--]-->`);
      } else {
        _push(`<!---->`);
      }
      _push(ssrRenderComponent(_component_AppUsageGuide, {
        title: "How This Query Works",
        description: "Reverse MX supports Domain Mode and MX Host Mode, then performs verified overlap matching on mail exchanger records.",
        points: [
          "Domain input resolves target MX set directly; MX host input enters MX Host Mode automatically.",
          "Candidates are discovered from reverse IP sources tied to MX host infrastructure.",
          "Final results keep only domains with confirmed shared MX hosts after DNS revalidation.",
          "When matched stays zero, review source errors: this usually indicates passive-source coverage limits."
        ],
        tags: ["Domain/MX Host Modes", "MX Revalidation", "Source Diagnostics", "Higher Recall"]
      }, null, _parent));
      _push(`</section><blockquote class="privacy-quote" data-v-826c67c4><i class="fa-solid fa-shield-halved privacy-quote-icon" aria-hidden="true" data-v-826c67c4></i><span data-v-826c67c4>Reverse MX results are best-effort from public data plus DNS verification, and may be incomplete.</span></blockquote></section>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/reverse-mx.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const reverseMx = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-826c67c4"]]);

export { reverseMx as default };
//# sourceMappingURL=reverse-mx-DP4UMULH.mjs.map
