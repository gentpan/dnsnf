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
  __name: "reverse-ns",
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
      title: "DNS.NF | Reverse NS",
      description: "Find domains sharing the same authoritative DNS servers (NS). Best-effort discovery using public datasets with DNS verification."
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_el_alert = ElAlert;
      const _component_CopyIconButton = __nuxt_component_1;
      const _component_AppUsageGuide = __nuxt_component_2;
      _push(`<section${ssrRenderAttrs(mergeProps({ class: "page-container shared-page" }, _attrs))} data-v-a37b99db><section class="result-panel shared-panel" data-v-a37b99db><h3 data-v-a37b99db><span class="panel-title-main" data-v-a37b99db><i class="fa-solid fa-server" aria-hidden="true" data-v-a37b99db></i> Reverse NS</span></h3><p class="shared-hint" data-v-a37b99db>This scans domains that share one or more authoritative NS with your target.</p><div class="shared-form-row" data-v-a37b99db><input${ssrRenderAttr("value", unref(domain))} class="shared-input" type="text" placeholder="Enter domain, e.g. example.com" data-v-a37b99db><button class="shared-btn" type="button"${ssrIncludeBooleanAttr(unref(loading)) ? " disabled" : ""} data-v-a37b99db>`);
      if (unref(loading)) {
        _push(`<span class="dns-loading-dot" aria-hidden="true" data-v-a37b99db></span>`);
      } else {
        _push(`<!--[--><i class="fa-solid fa-magnifying-glass" aria-hidden="true" data-v-a37b99db></i> Find Reverse NS <!--]-->`);
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
              _push2(`<i class="fa-solid fa-circle-exclamation" aria-hidden="true" data-v-a37b99db${_scopeId}></i>`);
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
        _push(`<!--[--><div class="shared-summary" data-v-a37b99db><div class="record-cell" data-v-a37b99db><span class="record-name" data-v-a37b99db>Target</span><strong class="record-count" data-v-a37b99db>${ssrInterpolate(unref(result).data.target)}</strong></div><div class="record-cell" data-v-a37b99db><span class="record-name" data-v-a37b99db>Target NS</span><strong class="record-count" data-v-a37b99db>${ssrInterpolate(unref(result).data.ns.length)}</strong></div><div class="record-cell" data-v-a37b99db><span class="record-name" data-v-a37b99db>Candidates</span><strong class="record-count" data-v-a37b99db>${ssrInterpolate(unref(result).data.total_candidates)}</strong></div><div class="record-cell" data-v-a37b99db><span class="record-name" data-v-a37b99db>Matched</span><strong class="record-count" data-v-a37b99db>${ssrInterpolate(unref(result).data.total_shared)}</strong></div><div class="record-cell" data-v-a37b99db><span class="record-name" data-v-a37b99db>Cached</span><strong class="record-count" data-v-a37b99db>${ssrInterpolate(unref(result).cached ? "Yes" : "No")}</strong></div></div><div class="shared-list" data-v-a37b99db><strong class="list-title" data-v-a37b99db>Target NS</strong><span class="pill-list" data-v-a37b99db><!--[-->`);
        ssrRenderList(unref(result).data.ns, (ns) => {
          _push(`<code class="shared-code" data-v-a37b99db>${ssrInterpolate(ns)}</code>`);
        });
        _push(`<!--]--></span></div><div class="shared-table-wrap" data-v-a37b99db><table class="shared-table" data-v-a37b99db><thead data-v-a37b99db><tr data-v-a37b99db><th data-v-a37b99db>Domain</th><th data-v-a37b99db>Shared NS</th><th data-v-a37b99db>Source IPs</th><th class="ta-r" data-v-a37b99db>Action</th></tr></thead><tbody data-v-a37b99db><!--[-->`);
        ssrRenderList(unref(result).data.items, (row) => {
          _push(`<tr data-v-a37b99db><td data-v-a37b99db><code class="shared-code shared-domain" data-v-a37b99db>${ssrInterpolate(row.domain)}</code></td><td data-v-a37b99db><span class="pill-list" data-v-a37b99db><!--[-->`);
          ssrRenderList(row.shared_ns, (ns) => {
            _push(`<code class="shared-code" data-v-a37b99db>${ssrInterpolate(ns)}</code>`);
          });
          _push(`<!--]--></span></td><td data-v-a37b99db><span class="pill-list" data-v-a37b99db><!--[-->`);
          ssrRenderList(row.source_ips, (ip) => {
            _push(`<code class="shared-code shared-ip" data-v-a37b99db>${ssrInterpolate(ip)}</code>`);
          });
          _push(`<!--]--></span></td><td class="ta-r" data-v-a37b99db>`);
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
          _push(`<tr data-v-a37b99db><td colspan="4" class="muted" data-v-a37b99db>No reverse NS domains found from current data sources.</td></tr>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</tbody></table></div><!--]-->`);
      } else {
        _push(`<!---->`);
      }
      _push(ssrRenderComponent(_component_AppUsageGuide, {
        title: "How This Query Works",
        description: "Reverse NS identifies domains sharing authoritative name servers with your target through candidate discovery and DNS verification.",
        points: [
          "Step 1: resolve authoritative NS for the target domain.",
          "Step 2: collect candidate domains from reverse IP intelligence on NS infrastructure.",
          "Step 3: re-resolve candidate NS and keep only domains with real NS overlap.",
          "Matched count is strict verification output; candidates reflect pre-verification recall."
        ],
        tags: ["Authoritative NS", "3-step Verification", "Strict Match", "Infrastructure Correlation"]
      }, null, _parent));
      _push(`</section><blockquote class="privacy-quote" data-v-a37b99db><i class="fa-solid fa-shield-halved privacy-quote-icon" aria-hidden="true" data-v-a37b99db></i><span data-v-a37b99db>Reverse NS results are best-effort from public data plus DNS verification, and may be incomplete.</span></blockquote></section>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/reverse-ns.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const reverseNs = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-a37b99db"]]);

export { reverseNs as default };
//# sourceMappingURL=reverse-ns-CrlDvfJ_.mjs.map
