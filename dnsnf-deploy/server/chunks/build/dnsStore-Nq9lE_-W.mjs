import { w as withInstall, b as buildProps, d as definePropType, a as withNoopInstall, u as useNamespace, p as picture_filled_default, i as isNumber, c as isUndefined } from './el-alert-evJ2M_PZ.mjs';
import { defineComponent, ref, computed, mergeProps, unref, useSSRContext, openBlock, createElementBlock, normalizeClass, createBlock, createCommentVNode, toRef, Fragment, renderList, renderSlot, createVNode, normalizeProps, watch } from 'vue';
import { isObject } from '@vue/shared';
import { u as useCopyState, a as __nuxt_component_1 } from './AppUsageGuide-4So_Vmg6.mjs';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderList, ssrRenderClass, ssrRenderAttr, ssrRenderComponent, ssrRenderStyle } from 'vue/server-renderer';
import { _ as _export_sfc, c as useRequestFetch, u as useRoute, b as useRequestEvent } from './server.mjs';
import { defineStore } from 'pinia';
import { L as getRequestURL } from '../nitro/nitro.mjs';

function useRequestURL(opts) {
  {
    return getRequestURL(useRequestEvent(), opts);
  }
}
const skeletonProps = buildProps({
  animated: Boolean,
  count: {
    type: Number,
    default: 1
  },
  rows: {
    type: Number,
    default: 3
  },
  loading: {
    type: Boolean,
    default: true
  },
  throttle: { type: definePropType([Number, Object]) }
});
const skeletonItemProps = buildProps({ variant: {
  type: String,
  values: [
    "circle",
    "rect",
    "h1",
    "h3",
    "text",
    "caption",
    "p",
    "image",
    "button"
  ],
  default: "text"
} });
var skeleton_item_vue_vue_type_script_setup_true_lang_default = /* @__PURE__ */ defineComponent({
  name: "ElSkeletonItem",
  __name: "skeleton-item",
  props: skeletonItemProps,
  setup(__props) {
    const ns = useNamespace("skeleton");
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", { class: normalizeClass([unref(ns).e("item"), unref(ns).e(__props.variant)]) }, [__props.variant === "image" ? (openBlock(), createBlock(unref(picture_filled_default), { key: 0 })) : createCommentVNode("v-if", true)], 2);
    };
  }
});
var skeleton_item_default = skeleton_item_vue_vue_type_script_setup_true_lang_default;
const useThrottleRender = (loading, throttle = 0) => {
  if (throttle === 0) return loading;
  const throttled = ref(isObject(throttle) && Boolean(throttle.initVal));
  let timeoutHandle = null;
  const dispatchThrottling = (timer) => {
    if (isUndefined(timer)) {
      throttled.value = loading.value;
      return;
    }
    if (timeoutHandle) clearTimeout(timeoutHandle);
    timeoutHandle = setTimeout(() => {
      throttled.value = loading.value;
    }, timer);
  };
  const dispatcher = (type) => {
    if (type === "leading") if (isNumber(throttle)) dispatchThrottling(throttle);
    else dispatchThrottling(throttle.leading);
    else if (isObject(throttle)) dispatchThrottling(throttle.trailing);
    else throttled.value = false;
  };
  watch(() => loading.value, (val) => {
    dispatcher(val ? "leading" : "trailing");
  });
  return throttled;
};
var skeleton_vue_vue_type_script_setup_true_lang_default = /* @__PURE__ */ defineComponent({
  name: "ElSkeleton",
  __name: "skeleton",
  props: skeletonProps,
  setup(__props, { expose: __expose }) {
    const props = __props;
    const ns = useNamespace("skeleton");
    const uiLoading = useThrottleRender(toRef(props, "loading"), props.throttle);
    __expose({ uiLoading });
    return (_ctx, _cache) => {
      return unref(uiLoading) ? (openBlock(), createElementBlock("div", mergeProps({
        key: 0,
        class: [unref(ns).b(), unref(ns).is("animated", __props.animated)]
      }, _ctx.$attrs), [(openBlock(true), createElementBlock(Fragment, null, renderList(__props.count, (i) => {
        return openBlock(), createElementBlock(Fragment, { key: i }, [unref(uiLoading) ? renderSlot(_ctx.$slots, "template", { key: i }, () => [createVNode(skeleton_item_default, {
          class: normalizeClass(unref(ns).is("first")),
          variant: "p"
        }, null, 8, ["class"]), (openBlock(true), createElementBlock(Fragment, null, renderList(__props.rows, (item) => {
          return openBlock(), createBlock(skeleton_item_default, {
            key: item,
            class: normalizeClass([unref(ns).e("paragraph"), unref(ns).is("last", item === __props.rows && __props.rows > 1)]),
            variant: "p"
          }, null, 8, ["class"]);
        }), 128))]) : createCommentVNode("v-if", true)], 64);
      }), 128))], 16)) : renderSlot(_ctx.$slots, "default", normalizeProps(mergeProps({ key: 1 }, _ctx.$attrs)));
    };
  }
});
var skeleton_default = skeleton_vue_vue_type_script_setup_true_lang_default;
const ElSkeleton = withInstall(skeleton_default, { SkeletonItem: skeleton_item_default });
withNoopInstall(skeleton_item_default);
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "DnsResultCard",
  __ssrInlineRender: true,
  props: {
    result: {}
  },
  setup(__props) {
    const props = __props;
    const route = useRoute();
    const { copiedKey, copyText } = useCopyState();
    const expandedGroups = ref({});
    const showRawJson = ref(false);
    useRequestURL();
    const normalizedRecords = computed(() => {
      const records = props.result?.data?.records;
      return {
        A: Array.isArray(records?.A) ? records.A : [],
        AAAA: Array.isArray(records?.AAAA) ? records.AAAA : [],
        CNAME: Array.isArray(records?.CNAME) ? records.CNAME : [],
        MX: Array.isArray(records?.MX) ? records.MX : [],
        NS: Array.isArray(records?.NS) ? records.NS : [],
        PTR: Array.isArray(records?.PTR) ? records.PTR : [],
        TXT: Array.isArray(records?.TXT) ? records.TXT : [],
        CAA: Array.isArray(records?.CAA) ? records.CAA : [],
        SPF: Array.isArray(records?.SPF) ? records.SPF : [],
        DMARC: Array.isArray(records?.DMARC) ? records.DMARC : [],
        DKIM: Array.isArray(records?.DKIM) ? records.DKIM : [],
        SOA: records?.SOA && typeof records.SOA === "object" ? records.SOA : {},
        SRV: Array.isArray(records?.SRV) ? records.SRV : []
      };
    });
    const txtMergedRecords = computed(() => {
      const r = normalizedRecords.value;
      return [
        ...r.TXT,
        ...r.SPF.map((item) => `SPF: ${item}`),
        ...r.DMARC.map((item) => `DMARC: ${item}`),
        ...r.DKIM.map((item) => `DKIM: ${item}`)
      ];
    });
    const targetLabel = computed(() => props.result.data.domain || props.result.data.ip || "unknown");
    const currentLookupType = computed(() => String(route.query.type || "ALL").toUpperCase());
    const showSoaGroup = computed(() => currentLookupType.value === "SOA" || currentLookupType.value === "ALL");
    const detailRows = computed(() => [
      { label: "Target", value: targetLabel.value }
    ]);
    const timestampText = computed(() => new Date(props.result.timestamp * 1e3).toLocaleString());
    const countRows = computed(() => {
      const records = normalizedRecords.value;
      const soaCount = Object.keys(records.SOA || {}).length ? 1 : 0;
      return [
        { label: "A", value: String(records.A.length) },
        { label: "AAAA", value: String(records.AAAA.length) },
        { label: "CNAME", value: String(records.CNAME.length) },
        { label: "MX", value: String(records.MX.length) },
        { label: "NS", value: String(records.NS.length) },
        { label: "PTR", value: String(records.PTR.length) },
        { label: "SOA", value: String(soaCount) },
        { label: "SRV", value: String(records.SRV.length) },
        { label: "TXT", value: String(txtMergedRecords.value.length) },
        { label: "CAA", value: String(records.CAA.length) }
      ];
    });
    const totalRecordCount = computed(
      () => countRows.value.reduce((sum, row) => sum + Number.parseInt(row.value, 10), 0)
    );
    const recordGridStyle = computed(() => ({
      gridTemplateColumns: `repeat(${Math.max(countRows.value.length, 1)}, minmax(0, 1fr))`
    }));
    const reverseDnsRows = computed(
      () => props.result.data.reverse_dns.map((item) => {
        const trimmed = String(item).trim();
        const firstSpace = trimmed.indexOf(" ");
        if (firstSpace > 0) {
          const ip = trimmed.slice(0, firstSpace).trim();
          const ptr = trimmed.slice(firstSpace + 1).trim();
          if (ip && ptr && (ip.includes(".") || ip.includes(":"))) {
            return { ip, ptr, raw: trimmed };
          }
        }
        return { ip: "-", ptr: trimmed, raw: trimmed };
      })
    );
    const reverseDnsByIp = computed(() => {
      const grouped = {};
      for (const row of reverseDnsRows.value) {
        if (!row.ip || row.ip === "-") continue;
        grouped[row.ip] = grouped[row.ip] || [];
        grouped[row.ip].push(row.ptr);
      }
      return grouped;
    });
    const withReverseDnsItems = (ips) => {
      const merged = [...ips];
      for (const ip of ips) {
        const ptrList = reverseDnsByIp.value[ip] || [];
        for (const ptr of ptrList) {
          merged.push(`PTR: ${ip} -> ${ptr}`);
        }
      }
      return merged;
    };
    const valueGroups = computed(() => {
      const r = normalizedRecords.value;
      const groups = [
        { title: "A", items: withReverseDnsItems(r.A) },
        { title: "AAAA", items: withReverseDnsItems(r.AAAA) },
        { title: "CNAME", items: r.CNAME },
        { title: "NS", items: r.NS },
        { title: "TXT", items: txtMergedRecords.value },
        { title: "MX", items: r.MX.map((x) => `${x.host} (pref ${x.pref})`) },
        { title: "CAA", items: r.CAA.map((x) => `${x.tag}: ${x.value}`) },
        { title: "SRV", items: r.SRV.map((x) => `${x.target}:${x.port} p${x.priority} w${x.weight}`) }
      ];
      if (props.result.data.domain && showSoaGroup.value) {
        groups.push({
          title: "SOA",
          items: [
            `NS: ${r.SOA.ns || "-"}`,
            `MBox: ${r.SOA.mbox || "-"}`,
            `Serial: ${r.SOA.serial ?? "-"}`,
            `Refresh: ${r.SOA.refresh ?? "-"}`,
            `Retry: ${r.SOA.retry ?? "-"}`,
            `Expire: ${r.SOA.expire ?? "-"}`
          ]
        });
      }
      return groups.filter((g) => g.items.length > 0);
    });
    const soaComments = {
      NS: "Primary authoritative DNS server",
      MBox: "Administrator mailbox",
      Serial: "Zone version number for synchronization",
      Refresh: "Secondary DNS refresh interval (seconds)",
      Retry: "Retry interval after failed refresh (seconds)",
      Expire: "Secondary DNS expiry time (seconds)"
    };
    const soaCommentText = (item) => {
      const key = item.split(":")[0]?.trim();
      return key ? soaComments[key] || "" : "";
    };
    const formatSoaItem = (item) => {
      if (!item.startsWith("MBox:")) return item;
      const raw = item.slice(5).trim();
      if (!raw || raw === "-") return item;
      const at = raw.replace(".", "@");
      return `MBox: ${at}`;
    };
    const copyEnabledGroups = /* @__PURE__ */ new Set(["A", "AAAA", "NS", "MX", "TXT"]);
    const compactInlineGroups = /* @__PURE__ */ new Set(["NS"]);
    const groupIcons = {
      A: "fa-network-wired",
      AAAA: "fa-globe",
      CNAME: "fa-link",
      MX: "fa-envelope",
      NS: "fa-server",
      TXT: "fa-file-lines",
      CAA: "fa-certificate",
      SOA: "fa-circle-info",
      SRV: "fa-diagram-project"
    };
    const apiQuery = computed(
      () => props.result.data.ip ? `ip=${encodeURIComponent(props.result.data.ip)}` : `domain=${encodeURIComponent(props.result.data.domain || "")}`
    );
    const apiDisplayUrl = computed(() => `https://api.dns.nf/v1/dns/lookup?${apiQuery.value}`);
    const rawJsonText = computed(() => JSON.stringify(props.result, null, 2));
    const rawJsonHighlighted = computed(() => {
      const escaped = rawJsonText.value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      return escaped.replace(
        /("(?:\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"\s*:?)|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
        (match, strToken, boolToken, numToken) => {
          if (strToken) {
            if (strToken.endsWith(":")) return `<span class="json-key">${strToken}</span>`;
            return `<span class="json-string">${strToken}</span>`;
          }
          if (boolToken) return `<span class="json-boolean">${match}</span>`;
          if (numToken) return `<span class="json-number">${match}</span>`;
          return match;
        }
      );
    });
    const canCopy = (groupTitle) => copyEnabledGroups.has(groupTitle);
    const isCompactInlineGroup = (groupTitle) => compactInlineGroups.has(groupTitle);
    const iconForGroup = (groupTitle) => groupIcons[groupTitle] || "fa-tag";
    const canCollapseGroup = (groupTitle, count) => groupTitle === "TXT" && count > 3;
    const isGroupExpanded = (groupTitle) => !!expandedGroups.value[groupTitle];
    const visibleGroupItems = (groupTitle, items) => {
      if (!canCollapseGroup(groupTitle, items.length)) return items;
      return isGroupExpanded(groupTitle) ? items : items.slice(0, 3);
    };
    const copyValue = async (groupTitle, item, index) => {
      return;
    };
    const copyApiUrl = async () => {
      await copyText(apiDisplayUrl.value, "api-url");
    };
    const copyRawJson = async () => {
      await copyText(rawJsonText.value, "raw-json");
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_CopyIconButton = __nuxt_component_1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "result-stack" }, _attrs))} data-v-80bef734><section class="result-panel" data-v-80bef734><h3 data-v-80bef734><span class="panel-title-main" data-v-80bef734><i class="fa-solid fa-list-check panel-heading-icon" aria-hidden="true" data-v-80bef734></i> Details</span><span class="panel-head-badges" data-v-80bef734>`);
      if (props.result.cached) {
        _push(`<span class="head-badge head-badge-cached" data-v-80bef734><i class="fa-solid fa-database" aria-hidden="true" data-v-80bef734></i> Cached </span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<span class="head-badge head-badge-time" data-v-80bef734><i class="fa-regular fa-clock" aria-hidden="true" data-v-80bef734></i> ${ssrInterpolate(unref(timestampText))}</span></span></h3><div class="result-rows result-table" data-v-80bef734><!--[-->`);
      ssrRenderList(unref(detailRows), (row) => {
        _push(`<div class="${ssrRenderClass([{ "result-row-target": row.label === "Target" }, "result-row"])}" data-v-80bef734><span data-v-80bef734>${ssrInterpolate(row.label)}</span><strong data-v-80bef734>${ssrInterpolate(row.value)}</strong></div>`);
      });
      _push(`<!--]--><div class="result-row" data-v-80bef734><span data-v-80bef734>Status</span><span class="status-badge" data-v-80bef734><i class="fa-solid fa-circle-check" aria-hidden="true" data-v-80bef734></i> ok</span></div></div><div class="result-link result-table" data-v-80bef734><span class="result-link-text" data-v-80bef734>API URL</span><span class="result-link-url" role="button" tabindex="0"${ssrRenderAttr("title", unref(apiDisplayUrl))} data-v-80bef734>${ssrInterpolate(unref(apiDisplayUrl))}</span><div class="result-actions" data-v-80bef734>`);
      _push(ssrRenderComponent(_component_CopyIconButton, {
        class: "copy-btn icon-only-btn",
        copied: unref(copiedKey) === "api-url",
        "copy-title": "Copy API URL",
        "aria-label": "Copy api url",
        onClick: copyApiUrl
      }, null, _parent));
      _push(`<button type="button" class="copy-btn icon-only-btn"${ssrRenderAttr("aria-label", unref(showRawJson) ? "Collapse raw json" : "Expand raw json")} data-v-80bef734><i class="${ssrRenderClass(["fa-solid", unref(showRawJson) ? "fa-compress" : "fa-expand"])}" aria-hidden="true" data-v-80bef734></i></button></div></div>`);
      if (unref(showRawJson)) {
        _push(`<div class="raw-json-wrap" data-v-80bef734><div class="raw-json-actions" data-v-80bef734>`);
        _push(ssrRenderComponent(_component_CopyIconButton, {
          class: "copy-btn icon-only-btn",
          copied: unref(copiedKey) === "raw-json",
          "copy-title": "Copy raw json",
          "aria-label": "Copy raw json",
          onClick: copyRawJson
        }, null, _parent));
        _push(`<button type="button" class="copy-btn icon-only-btn" aria-label="Download json" data-v-80bef734><i class="fa-solid fa-download" aria-hidden="true" data-v-80bef734></i></button></div><pre class="raw-json" data-v-80bef734><code class="raw-json-code" data-v-80bef734>${unref(rawJsonHighlighted) ?? ""}</code></pre></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</section><section class="result-panel" data-v-80bef734><h3 data-v-80bef734><span class="panel-title-main" data-v-80bef734><i class="fa-solid fa-table-list panel-heading-icon" aria-hidden="true" data-v-80bef734></i> Records</span><span class="record-total-badge" data-v-80bef734>Total ${ssrInterpolate(unref(totalRecordCount))}</span></h3><div class="record-grid" style="${ssrRenderStyle(unref(recordGridStyle))}" data-v-80bef734><!--[-->`);
      ssrRenderList(unref(countRows), (row) => {
        _push(`<div class="record-cell" data-v-80bef734><span class="record-name" data-v-80bef734>${ssrInterpolate(row.label)}</span><strong class="record-count" data-v-80bef734>${ssrInterpolate(row.value)}</strong></div>`);
      });
      _push(`<!--]--></div></section><section class="result-panel" data-v-80bef734><h3 data-v-80bef734><span class="panel-title-main" data-v-80bef734><i class="fa-solid fa-layer-group panel-heading-icon" aria-hidden="true" data-v-80bef734></i> Values</span></h3><div class="value-grid" data-v-80bef734><!--[-->`);
      ssrRenderList(unref(valueGroups), (group) => {
        _push(`<div class="value-group" data-v-80bef734><div class="value-title result-meta-title" data-v-80bef734><span class="value-title-left" data-v-80bef734><i class="${ssrRenderClass(["fa-solid", iconForGroup(group.title)])}" aria-hidden="true" data-v-80bef734></i> ${ssrInterpolate(group.title)}</span><span class="value-title-count" data-v-80bef734>${ssrInterpolate(group.items.length)}</span></div><div class="${ssrRenderClass([{ "value-tags-compact": isCompactInlineGroup(group.title) }, "value-tags"])}" data-v-80bef734><!--[-->`);
        ssrRenderList(visibleGroupItems(group.title, group.items), (item, index) => {
          _push(`<div class="${ssrRenderClass([{ "value-item-compact": isCompactInlineGroup(group.title) }, "value-item"])}" data-v-80bef734>`);
          if (group.title === "SOA") {
            _push(`<div class="value-text-row" data-v-80bef734><span class="value-text" data-v-80bef734>${ssrInterpolate(formatSoaItem(item))}</span><span class="value-note" data-v-80bef734>${ssrInterpolate(soaCommentText(item))}</span></div>`);
          } else {
            _push(`<span class="value-text" data-v-80bef734>${ssrInterpolate(item)}</span>`);
          }
          if (canCopy(group.title)) {
            _push(ssrRenderComponent(_component_CopyIconButton, {
              class: "copy-btn",
              copied: unref(copiedKey) === `${group.title}-${index}`,
              "copy-title": `Copy ${group.title} record`,
              "aria-label": `Copy ${group.title} record`,
              onClick: ($event) => copyValue(group.title)
            }, null, _parent));
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        });
        _push(`<!--]-->`);
        if (canCollapseGroup(group.title, group.items.length)) {
          _push(`<button type="button" class="group-toggle-btn" data-v-80bef734>${ssrInterpolate(isGroupExpanded(group.title) ? "Collapse" : `Expand (${group.items.length - 3} more)`)}</button>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div>`);
      });
      _push(`<!--]--></div></section></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/DnsResultCard.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const __nuxt_component_3 = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main, [["__scopeId", "data-v-80bef734"]]), { __name: "DnsResultCard" });
const IPV4_OCTET = "(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)";
const IPV4_RE = new RegExp(`^(${IPV4_OCTET}\\.){3}${IPV4_OCTET}$`);
const IPV4_CIDR_RE = new RegExp(`^(${IPV4_OCTET}\\.){3}${IPV4_OCTET}\\/([0-9]|[12][0-9]|3[0-2])$`);
const IPV6_LIKE_RE = /^[0-9a-f:.]+$/i;
const DOMAIN_LABEL_RE = new RegExp("^(?!-)[a-z0-9-]{1,63}(?<!-)$", "i");
const isIpLikeTarget = (value) => {
  const v = value.trim();
  return IPV4_RE.test(v) || IPV4_CIDR_RE.test(v) || v.includes(":") && IPV6_LIKE_RE.test(v);
};
const isDomainTarget = (value) => {
  const v = value.trim().toLowerCase().replace(/\.$/, "");
  if (!v || v.length > 253) return false;
  if (isIpLikeTarget(v)) return false;
  if (!v.includes(".")) return false;
  const labels = v.split(".");
  return labels.every((label) => DOMAIN_LABEL_RE.test(label));
};
const useDnsLookup = () => {
  const localFetch = useRequestFetch();
  const lookup = async (target, type) => {
    const params = { type };
    if (isIpLikeTarget(target)) {
      params.ip = target;
    } else {
      params.domain = target;
    }
    return await localFetch("/api/v1/dns", {
      query: params,
      headers: { "x-nuxt-internal": "1" }
    });
  };
  return { lookup };
};
const useDnsStore = defineStore("dns", {
  state: () => ({
    result: null,
    loading: false,
    error: null
  }),
  actions: {
    async fetchLookup(target, type) {
      const normalized = String(target || "").trim().toLowerCase();
      if (!isDomainTarget(normalized)) {
        this.result = null;
        this.loading = false;
        this.error = "DNS Lookup only supports domain names. Please use rDNS or Reverse IP for IP/CIDR.";
        return;
      }
      this.loading = true;
      this.error = null;
      try {
        const { lookup } = useDnsLookup();
        this.result = await lookup(normalized, type);
      } catch (err) {
        const e = err;
        this.error = e.response?.data?.message || e.message || "Request failed";
      } finally {
        this.loading = false;
      }
    }
  }
});

export { ElSkeleton as E, __nuxt_component_3 as _, useDnsStore as u };
//# sourceMappingURL=dnsStore-Nq9lE_-W.mjs.map
