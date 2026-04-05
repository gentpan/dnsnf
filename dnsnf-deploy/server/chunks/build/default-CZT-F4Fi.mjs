import { _ as __nuxt_component_0 } from './nuxt-link-DWO_kLgr.mjs';
import { u as useRoute, a as __nuxt_component_1, _ as _export_sfc, e as useNuxtApp, b as useRequestEvent } from './server.mjs';
import { defineComponent, mergeProps, withCtx, createVNode, createTextVNode, toDisplayString, unref, watch, toRef, isRef, computed, ref, customRef, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderAttr, ssrRenderList, ssrInterpolate, ssrRenderClass, ssrRenderSlot } from 'vue/server-renderer';
import { a as useHead } from './composables-kD9ulvwD.mjs';
import { M as klona, N as getRequestHeader, O as isEqual, P as setCookie, Q as getCookie, R as deleteCookie } from '../nitro/nitro.mjs';
import 'pinia';
import 'vue-router';
import 'perfect-debounce';
import '@vue/shared';
import 'axios';
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
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/plugins';
import 'unhead/utils';

const NullObject = /* @__PURE__ */ (() => {
  const C = function() {
  };
  C.prototype = /* @__PURE__ */ Object.create(null);
  return C;
})();
function parse(str, options) {
  if (typeof str !== "string") {
    throw new TypeError("argument str must be a string");
  }
  const obj = new NullObject();
  const opt = options || {};
  const dec = opt.decode || decode;
  let index = 0;
  while (index < str.length) {
    const eqIdx = str.indexOf("=", index);
    if (eqIdx === -1) {
      break;
    }
    let endIdx = str.indexOf(";", index);
    if (endIdx === -1) {
      endIdx = str.length;
    } else if (endIdx < eqIdx) {
      index = str.lastIndexOf(";", eqIdx - 1) + 1;
      continue;
    }
    const key = str.slice(index, eqIdx).trim();
    if (opt?.filter && !opt?.filter(key)) {
      index = endIdx + 1;
      continue;
    }
    if (void 0 === obj[key]) {
      let val = str.slice(eqIdx + 1, endIdx).trim();
      if (val.codePointAt(0) === 34) {
        val = val.slice(1, -1);
      }
      obj[key] = tryDecode(val, dec);
    }
    index = endIdx + 1;
  }
  return obj;
}
function decode(str) {
  return str.includes("%") ? decodeURIComponent(str) : str;
}
function tryDecode(str, decode2) {
  try {
    return decode2(str);
  } catch {
    return str;
  }
}

const useStateKeyPrefix = "$s";
function useState(...args) {
  const autoKey = typeof args[args.length - 1] === "string" ? args.pop() : void 0;
  if (typeof args[0] !== "string") {
    args.unshift(autoKey);
  }
  const [_key, init] = args;
  if (!_key || typeof _key !== "string") {
    throw new TypeError("[nuxt] [useState] key must be a string: " + _key);
  }
  if (init !== void 0 && typeof init !== "function") {
    throw new Error("[nuxt] [useState] init must be a function: " + init);
  }
  const key = useStateKeyPrefix + _key;
  const nuxtApp = useNuxtApp();
  const state = toRef(nuxtApp.payload.state, key);
  if (init) {
    nuxtApp._state[key] ??= { _default: init };
  }
  if (state.value === void 0 && init) {
    const initialValue = init();
    if (isRef(initialValue)) {
      nuxtApp.payload.state[key] = initialValue;
      return initialValue;
    }
    state.value = initialValue;
  }
  return state;
}
function parseCookieValue(value) {
  if (value === "undefined") {
    return void 0;
  }
  try {
    const parsed = JSON.parse(value);
    if (typeof parsed === "number" && String(parsed) !== value) {
      return value;
    }
    return parsed;
  } catch {
    return value;
  }
}
const CookieDefaults = {
  path: "/",
  watch: true,
  decode: (val) => parseCookieValue(decodeURIComponent(val)),
  encode: (val) => {
    if (typeof val !== "string" || val === "undefined") {
      return encodeURIComponent(JSON.stringify(val));
    }
    try {
      if (typeof JSON.parse(val) !== "string") {
        return encodeURIComponent(JSON.stringify(val));
      }
    } catch {
    }
    return encodeURIComponent(val);
  },
  refresh: false
};
function useCookie(name, _opts) {
  const opts = { ...CookieDefaults, ..._opts };
  opts.filter ??= (key) => key === name;
  const cookies = readRawCookies(opts) || {};
  let delay;
  if (opts.maxAge !== void 0) {
    delay = opts.maxAge * 1e3;
  } else if (opts.expires) {
    delay = opts.expires.getTime() - Date.now();
  }
  const hasExpired = delay !== void 0 && delay <= 0;
  const cookieValue = klona(hasExpired ? void 0 : cookies[name] ?? opts.default?.());
  const cookie = cookieServerRef(name, cookieValue);
  {
    const nuxtApp = useNuxtApp();
    const writeFinalCookieValue = () => {
      const valueIsSame = isEqual(cookie.value, cookies[name]);
      if (opts.readonly || valueIsSame && !opts.refresh) {
        return;
      }
      nuxtApp._cookiesChanged ||= {};
      if (valueIsSame && opts.refresh && !nuxtApp._cookiesChanged[name]) {
        return;
      }
      nuxtApp._cookies ||= {};
      if (name in nuxtApp._cookies) {
        if (isEqual(cookie.value, nuxtApp._cookies[name])) {
          return;
        }
      }
      nuxtApp._cookies[name] = cookie.value;
      writeServerCookie(useRequestEvent(nuxtApp), name, cookie.value, opts);
    };
    const unhook = nuxtApp.hooks.hookOnce("app:rendered", writeFinalCookieValue);
    nuxtApp.hooks.hookOnce("app:error", () => {
      unhook();
      return writeFinalCookieValue();
    });
  }
  return cookie;
}
function readRawCookies(opts = {}) {
  {
    return parse(getRequestHeader(useRequestEvent(), "cookie") || "", opts);
  }
}
function writeServerCookie(event, name, value, opts = {}) {
  if (event) {
    if (value !== null && value !== void 0) {
      return setCookie(event, name, value, opts);
    }
    if (getCookie(event, name) !== void 0) {
      return deleteCookie(event, name, opts);
    }
  }
}
function cookieServerRef(name, value) {
  const internalRef = ref(value);
  const nuxtApp = useNuxtApp();
  return customRef((track, trigger) => {
    return {
      get() {
        track();
        return internalRef.value;
      },
      set(newValue) {
        nuxtApp._cookiesChanged ||= {};
        nuxtApp._cookiesChanged[name] = true;
        internalRef.value = newValue;
        trigger();
      }
    };
  });
}
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "AppInfoBanner",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute();
    const byPath = (path) => {
      if (path === "/rdns") {
        return {
          title: "Scan reverse DNS by IPv4 or CIDR",
          subtitle: "Run concurrent PTR lookups, filter by keyword mode, and inspect hint + score per IP.",
          pills: ["PTR", "CNAME", "CIDR", "LEFT", "MIDDLE", "RIGHT", "SCORE", "HINT"]
        };
      }
      if (path === "/reverse-ip") {
        return {
          title: "Discover domains mapped to one IPv4",
          subtitle: "Reverse IP uses public datasets plus DNS checks to return domain candidates and sources.",
          pills: ["REVERSE IP", "A", "SOURCES", "TOTAL", "EXPORT", "JSON", "CSV"]
        };
      }
      if (path === "/reverse-ns") {
        return {
          title: "Find domains sharing authoritative NS",
          subtitle: "Resolve target NS and list domains that overlap on authoritative nameservers.",
          pills: ["NS", "AUTHORITATIVE", "SHARED NS", "CANDIDATES", "MATCHED"]
        };
      }
      if (path === "/reverse-mx") {
        return {
          title: "Find domains sharing MX mail servers",
          subtitle: "Resolve target MX records and discover domains using the same mail infrastructure.",
          pills: ["MX", "MAIL", "SHARED MX", "CANDIDATES", "MATCHED"]
        };
      }
      if (path === "/subdomains") {
        return {
          title: "Discover public host records under a domain",
          subtitle: "Subdomain lookup aggregates public sources and returns exportable host records.",
          pills: ["SUBDOMAIN", "HOST", "SOURCES", "TOTAL", "EXPORT", "JSON", "CSV"]
        };
      }
      if (path === "/docs") {
        return {
          title: "Read API coverage and query rules",
          subtitle: "See endpoint parameters, limits, examples, and response structures for all DNS.NF features.",
          pills: ["API", "DNS", "RDNS", "REVERSE", "DNSSEC", "TOKENS", "LIMITS"]
        };
      }
      if (path === "/dns-lookup" || path.startsWith("/lookup/")) {
        return {
          title: "Query DNS records instantly with DNS.NF",
          subtitle: "Query A/AAAA/CNAME/MX/NS/TXT/SOA/SRV/CAA/PTR records from a single domain or IP input.",
          pills: ["A", "AAAA", "CNAME", "MX", "NS", "PTR", "TXT", "CAA", "SOA", "SRV"]
        };
      }
      if (path === "/") {
        return {
          title: "Query DNS records instantly with DNS.NF",
          subtitle: "Lookup domain and IP records with clean outputs and focused query tools.",
          pills: ["A", "AAAA", "CNAME", "MX", "NS", "PTR", "TXT", "CAA", "SOA", "SRV", "RDNS"]
        };
      }
      return {
        title: "Query DNS data with DNS.NF",
        subtitle: "Use DNS lookup, reverse tools, and API endpoints for fast diagnostics.",
        pills: ["DNS", "RDNS", "REVERSE", "API"]
      };
    };
    const banner = computed(() => byPath(route.path));
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<section${ssrRenderAttrs(mergeProps({ class: "page-container site-announce-wrap" }, _attrs))} data-v-fd45c527><div class="site-announce" data-v-fd45c527><span class="site-announce-title" data-v-fd45c527>${ssrInterpolate(unref(banner).title)}</span><span class="site-announce-subtitle" data-v-fd45c527>${ssrInterpolate(unref(banner).subtitle)}</span><div class="site-types" data-v-fd45c527><!--[-->`);
      ssrRenderList(unref(banner).pills, (pill) => {
        _push(`<span class="app-pill" data-v-fd45c527>${ssrInterpolate(pill)}</span>`);
      });
      _push(`<!--]--></div></div></section>`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/AppInfoBanner.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_2 = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$1, [["__scopeId", "data-v-fd45c527"]]), { __name: "AppInfoBanner" });
const useTheme = () => {
  const cookie = useCookie("dns_theme_v2", {
    sameSite: "lax",
    default: () => "light"
  });
  const theme = useState("dns_theme_state", () => cookie.value || "light");
  useHead(() => ({
    htmlAttrs: {
      "data-theme": theme.value
    }
  }));
  watch(
    theme,
    (value) => {
      cookie.value = value;
    },
    { immediate: true }
  );
  const toggleTheme = () => {
    theme.value = theme.value === "dark" ? "light" : "dark";
  };
  return {
    theme,
    toggleTheme
  };
};
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "default",
  __ssrInlineRender: true,
  setup(__props) {
    useHead({
      script: [
        {
          defer: true,
          src: "https://tongji.giantaccel.com/script.js",
          "data-website-id": "c3e9443d-ed69-450e-8790-9a2aedcd4371"
        }
      ]
    });
    const { theme } = useTheme();
    const route = useRoute();
    const menuItems = [
      { label: "Home", to: "/" },
      { label: "DNS Lookup", to: "/dns-lookup" },
      { label: "rDNS", to: "/rdns" },
      { label: "Reverse IP", to: "/reverse-ip" },
      { label: "Reverse NS", to: "/reverse-ns" },
      { label: "Reverse MX", to: "/reverse-mx" },
      { label: "Subdomains", to: "/subdomains" }
    ];
    const isMenuActive = (to) => {
      if (to === "/") {
        return route.path === "/" || route.path.startsWith("/lookup/");
      }
      return route.path === to || route.path.startsWith(`${to}/`);
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      const _component_ClientOnly = __nuxt_component_1;
      const _component_AppInfoBanner = __nuxt_component_2;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "app-shell" }, _attrs))}><header class="app-topbar"><div class="app-topbar-inner">`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/",
        class: "app-brand-link"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<img${ssrRenderAttr("src", "/logo.svg")} alt="DNS.NF Logo"${_scopeId}><span class="app-brand-text"${_scopeId}>DNS.NF</span>`);
          } else {
            return [
              createVNode("img", {
                src: "/logo.svg",
                alt: "DNS.NF Logo"
              }),
              createVNode("span", { class: "app-brand-text" }, "DNS.NF")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<nav class="app-topbar-nav" aria-label="Project menu"><!--[-->`);
      ssrRenderList(menuItems, (item) => {
        _push(ssrRenderComponent(_component_NuxtLink, {
          key: item.to,
          to: item.to,
          class: ["app-nav-link", { "is-active": isMenuActive(item.to) }]
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`${ssrInterpolate(item.label)}`);
            } else {
              return [
                createTextVNode(toDisplayString(item.label), 1)
              ];
            }
          }),
          _: 2
        }, _parent));
      });
      _push(`<!--]--></nav><div class="topbar-actions">`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        class: "topbar-btn",
        to: "/api",
        "aria-label": "API reference"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<i class="fa-solid fa-terminal topbar-icon" aria-hidden="true"${_scopeId}></i>`);
          } else {
            return [
              createVNode("i", {
                class: "fa-solid fa-terminal topbar-icon",
                "aria-hidden": "true"
              })
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<button type="button" class="topbar-btn theme-btn" aria-label="Toggle theme"><i class="${ssrRenderClass(["topbar-icon", "fa-solid", unref(theme) === "dark" ? "fa-sun" : "fa-moon"])}" aria-hidden="true"></i></button>`);
      _push(ssrRenderComponent(_component_ClientOnly, null, {}, _parent));
      _push(`</div></div></header><main class="app-main">`);
      if (unref(route).path !== "/") {
        _push(ssrRenderComponent(_component_AppInfoBanner, null, null, _parent));
      } else {
        _push(`<!---->`);
      }
      ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
      _push(`</main><footer class="app-footer"><div class="app-footer-inner"><div class="app-footer-meta"><span class="app-footer-line app-footer-line-main"><a class="footer-inline-link" href="https://giantaccel.com" target="_blank" rel="noopener">A GiantAccel Company</a> © 2026 <span class="brand-cairo">DNS.NF</span> All rights reserved.</span></div><div class="app-footer-social"><a class="footer-social-link" href="https://github.com/gentpan/dnsdotnf" target="_blank" rel="noopener" aria-label="GitHub"><i class="fa-brands fa-github" aria-hidden="true"></i></a><a class="footer-social-link" href="https://x.com/gentpan" target="_blank" rel="noopener" aria-label="X"><i class="fa-brands fa-x-twitter" aria-hidden="true"></i></a></div></div></footer></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("layouts/default.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=default-CZT-F4Fi.mjs.map
