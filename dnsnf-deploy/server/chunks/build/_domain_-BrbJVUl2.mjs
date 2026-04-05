import { _ as _export_sfc, u as useRoute, a as __nuxt_component_1 } from './server.mjs';
import { u as useDnsStore, E as ElSkeleton, _ as __nuxt_component_3 } from './dnsStore-Nq9lE_-W.mjs';
import { E as ElAlert } from './el-alert-evJ2M_PZ.mjs';
import { _ as __nuxt_component_2 } from './AppUsageGuide-4So_Vmg6.mjs';
import { defineComponent, computed, onServerPrefetch, watch, mergeProps, unref, withCtx, createVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent } from 'vue/server-renderer';
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
import 'lodash-unified';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/plugins';
import 'unhead/utils';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "[domain]",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute();
    const store = useDnsStore();
    const decodeRouteTarget = (raw) => {
      const value = String(raw || "").trim();
      if (!value) return "";
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    };
    const target = computed(() => decodeRouteTarget(route.params.domain));
    const type = computed(() => {
      const raw = String(route.query.type || "ALL").toUpperCase();
      const supported = ["ALL", "A", "AAAA", "CNAME", "MX", "NS", "PTR", "SOA", "SRV", "TXT", "CAA"];
      return supported.includes(raw) ? raw : "ALL";
    });
    useSeoMeta({
      title: () => `DNS.NF | ${target.value}`,
      description: () => `View ${type.value} DNS records for ${target.value}.`
    });
    const fetchCurrent = async () => {
      await store.fetchLookup(target.value, type.value);
    };
    onServerPrefetch(fetchCurrent);
    watch([target, type], fetchCurrent);
    return (_ctx, _push, _parent, _attrs) => {
      const _component_ClientOnly = __nuxt_component_1;
      const _component_el_skeleton = ElSkeleton;
      const _component_el_alert = ElAlert;
      const _component_DnsResultCard = __nuxt_component_3;
      const _component_AppUsageGuide = __nuxt_component_2;
      _push(`<section${ssrRenderAttrs(mergeProps({ class: "page-container lookup-page" }, _attrs))} data-v-1675ae15><section class="result-panel lookup-panel" data-v-1675ae15><h3 data-v-1675ae15><span class="panel-title-main" data-v-1675ae15><i class="fa-solid fa-magnifying-glass" aria-hidden="true" data-v-1675ae15></i> DNS Lookup</span></h3><p class="lookup-hint" data-v-1675ae15>Query DNS records by domain and switch record types below.</p><div class="search-form-wrap" data-v-1675ae15>`);
      _push(ssrRenderComponent(_component_ClientOnly, null, {}, _parent));
      _push(`</div><div class="lookup-result" data-v-1675ae15>`);
      if (unref(store).loading) {
        _push(ssrRenderComponent(_component_el_skeleton, {
          rows: 8,
          animated: ""
        }, null, _parent));
      } else if (unref(store).error) {
        _push(ssrRenderComponent(_component_el_alert, {
          title: unref(store).error,
          type: "error"
        }, {
          icon: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<i class="fa-solid fa-circle-exclamation" aria-hidden="true" data-v-1675ae15${_scopeId}></i>`);
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
      } else if (unref(store).result) {
        _push(ssrRenderComponent(_component_DnsResultCard, {
          result: unref(store).result
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      _push(ssrRenderComponent(_component_AppUsageGuide, {
        title: "How This Query Works",
        description: "Route-based lookup mode keeps target and record type in URL for shareable, reproducible diagnostics.",
        points: [
          "Target is parsed from the route path and loaded on page enter.",
          "Record tabs apply type-focused filtering without changing the target context.",
          "Use copy actions for specific record values and raw JSON for exact payload review.",
          "Differences across runs can come from DNS cache expiration and upstream resolver changes."
        ],
        tags: ["Route-driven", "Shareable URL", "Structured Output", "Cache-aware"]
      }, null, _parent));
      _push(`</section><blockquote class="privacy-quote" data-v-1675ae15><i class="fa-solid fa-shield-halved privacy-quote-icon" aria-hidden="true" data-v-1675ae15></i><span data-v-1675ae15>DNS.NF queries only publicly available DNS data. We do not access private/internal DNS zones, and query targets are processed only to return lookup results.</span></blockquote></section>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/lookup/[domain].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const _domain_ = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-1675ae15"]]);

export { _domain_ as default };
//# sourceMappingURL=_domain_-BrbJVUl2.mjs.map
