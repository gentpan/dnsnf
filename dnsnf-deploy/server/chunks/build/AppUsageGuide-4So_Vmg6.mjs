import { ref, defineComponent, mergeProps, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderList, ssrRenderClass } from 'vue/server-renderer';
import { _ as _export_sfc } from './server.mjs';

const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "CopyIconButton",
  __ssrInlineRender: true,
  props: {
    copied: { type: Boolean, default: false },
    copyTitle: { default: "Copy" },
    copiedTitle: { default: "Copied" },
    ariaLabel: { default: "Copy" },
    disabled: { type: Boolean, default: false }
  },
  emits: ["click"],
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<button${ssrRenderAttrs(mergeProps({
        type: "button",
        class: "dns-copy-btn",
        title: __props.copied ? __props.copiedTitle : __props.copyTitle,
        "aria-label": __props.ariaLabel,
        disabled: __props.disabled
      }, _attrs))}><span class="${ssrRenderClass([{ "is-visible": __props.copied }, "dns-copy-tip"])}">${ssrInterpolate(__props.copiedTitle)}</span><i class="${ssrRenderClass(__props.copied ? "fa-solid fa-check" : "fa-regular fa-clipboard")}" aria-hidden="true"></i></button>`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/CopyIconButton.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_1 = Object.assign(_sfc_main$1, { __name: "CopyIconButton" });
const useCopyState = (durationMs = 1200) => {
  const copiedKey = ref("");
  const clearCopied = () => {
    copiedKey.value = "";
  };
  const copyText = async (value, key = "default") => {
    return false;
  };
  return {
    copiedKey,
    copyText,
    clearCopied
  };
};
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "AppUsageGuide",
  __ssrInlineRender: true,
  props: {
    title: {},
    description: { default: "" },
    points: {},
    tags: { default: () => [] }
  },
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<section${ssrRenderAttrs(mergeProps({ class: "usage-guide" }, _attrs))} data-v-5227365a><div class="usage-guide-head" data-v-5227365a><i class="fa-solid fa-circle-info" aria-hidden="true" data-v-5227365a></i><strong data-v-5227365a>${ssrInterpolate(__props.title)}</strong></div>`);
      if (__props.description) {
        _push(`<p class="usage-guide-desc" data-v-5227365a>${ssrInterpolate(__props.description)}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<ul class="usage-guide-list" data-v-5227365a><!--[-->`);
      ssrRenderList(__props.points, (point, idx) => {
        _push(`<li class="usage-guide-item" data-v-5227365a><span class="usage-guide-index" data-v-5227365a>${ssrInterpolate(idx + 1)}</span><span class="usage-guide-text" data-v-5227365a>${ssrInterpolate(point)}</span></li>`);
      });
      _push(`<!--]--></ul>`);
      if (__props.tags.length > 0) {
        _push(`<div class="usage-guide-tags" data-v-5227365a><!--[-->`);
        ssrRenderList(__props.tags, (tag) => {
          _push(`<span class="usage-guide-tag" data-v-5227365a>${ssrInterpolate(tag)}</span>`);
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</section>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/AppUsageGuide.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const __nuxt_component_2 = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main, [["__scopeId", "data-v-5227365a"]]), { __name: "AppUsageGuide" });

export { __nuxt_component_2 as _, __nuxt_component_1 as a, useCopyState as u };
//# sourceMappingURL=AppUsageGuide-4So_Vmg6.mjs.map
