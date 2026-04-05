import { isArray, hasOwn, isObject, isString, NOOP } from '@vue/shared';
import { fromPairs, isPlainObject } from 'lodash-unified';
import { defineComponent, computed, openBlock, createElementBlock, mergeProps, unref, renderSlot, useSlots, ref, createBlock, Transition, withCtx, withDirectives, createElementVNode, normalizeClass, resolveDynamicComponent, createCommentVNode, createTextVNode, toDisplayString, Fragment, createVNode, vShow, warn, isVNode, Comment, getCurrentInstance, inject } from 'vue';

const isUndefined = (val) => val === void 0;
const isNumber = (val) => typeof val === "number";
const isStringNumber = (val) => {
  if (!isString(val)) return false;
  return !Number.isNaN(Number(val));
};
var ElementPlusError = class extends Error {
  constructor(m) {
    super(m);
    this.name = "ElementPlusError";
  }
};
function debugWarn(scope, message) {
  {
    const error = isString(scope) ? new ElementPlusError(`[${scope}] ${message}`) : scope;
    console.warn(error);
  }
}
const defaultNamespace = "el";
const statePrefix = "is-";
const _bem = (namespace, block, blockSuffix, element, modifier) => {
  let cls = `${namespace}-${block}`;
  if (blockSuffix) cls += `-${blockSuffix}`;
  if (element) cls += `__${element}`;
  if (modifier) cls += `--${modifier}`;
  return cls;
};
const namespaceContextKey = /* @__PURE__ */ Symbol("namespaceContextKey");
const useGetDerivedNamespace = (namespaceOverrides) => {
  const derivedNamespace = getCurrentInstance() ? inject(namespaceContextKey, ref(defaultNamespace)) : ref(defaultNamespace);
  return computed(() => {
    return unref(derivedNamespace) || defaultNamespace;
  });
};
const useNamespace = (block, namespaceOverrides) => {
  const namespace = useGetDerivedNamespace();
  const b = (blockSuffix = "") => _bem(namespace.value, block, blockSuffix, "", "");
  const e = (element) => element ? _bem(namespace.value, block, "", element, "") : "";
  const m = (modifier) => modifier ? _bem(namespace.value, block, "", "", modifier) : "";
  const be = (blockSuffix, element) => blockSuffix && element ? _bem(namespace.value, block, blockSuffix, element, "") : "";
  const em = (element, modifier) => element && modifier ? _bem(namespace.value, block, "", element, modifier) : "";
  const bm = (blockSuffix, modifier) => blockSuffix && modifier ? _bem(namespace.value, block, blockSuffix, "", modifier) : "";
  const bem = (blockSuffix, element, modifier) => blockSuffix && element && modifier ? _bem(namespace.value, block, blockSuffix, element, modifier) : "";
  const is = (name, ...args) => {
    const state = args.length >= 1 ? args[0] : true;
    return name && state ? `${statePrefix}${name}` : "";
  };
  const cssVar = (object) => {
    const styles = {};
    for (const key in object) if (object[key]) styles[`--${namespace.value}-${key}`] = object[key];
    return styles;
  };
  const cssVarBlock = (object) => {
    const styles = {};
    for (const key in object) if (object[key]) styles[`--${namespace.value}-${block}-${key}`] = object[key];
    return styles;
  };
  const cssVarName = (name) => `--${namespace.value}-${name}`;
  const cssVarBlockName = (name) => `--${namespace.value}-${block}-${name}`;
  return {
    namespace,
    b,
    e,
    m,
    be,
    em,
    bm,
    bem,
    is,
    cssVar,
    cssVarName,
    cssVarBlock,
    cssVarBlockName
  };
};
const withPropsDefaultsSetter = (target) => {
  const _p = target.props;
  const props = isArray(_p) ? fromPairs(_p.map((key) => [key, {}])) : _p;
  target.setPropsDefaults = (defaults) => {
    if (!props) return;
    for (const [key, value] of Object.entries(defaults)) {
      const prop = props[key];
      if (!hasOwn(props, key)) continue;
      if (isPlainObject(prop)) {
        props[key] = {
          ...prop,
          default: value
        };
        continue;
      }
      props[key] = {
        type: prop,
        default: value
      };
    }
    target.props = props;
  };
};
const withInstall = (main, extra) => {
  main.install = (app) => {
    for (const comp of [main, ...Object.values(extra ?? {})]) app.component(comp.name, comp);
  };
  if (extra) for (const [key, comp] of Object.entries(extra)) main[key] = comp;
  withPropsDefaultsSetter(main);
  return main;
};
const withNoopInstall = (component) => {
  component.install = NOOP;
  withPropsDefaultsSetter(component);
  return component;
};
const keysOf = (arr) => Object.keys(arr);
const epPropKey = "__epPropKey";
const definePropType = (val) => val;
const isEpProp = (val) => isObject(val) && !!val[epPropKey];
const buildProp = (prop, key) => {
  if (!isObject(prop) || isEpProp(prop)) return prop;
  const { values, required, default: defaultValue, type, validator } = prop;
  const epProp = {
    type,
    required: !!required,
    validator: values || validator ? (val) => {
      let valid = false;
      let allowedValues = [];
      if (values) {
        allowedValues = Array.from(values);
        if (hasOwn(prop, "default")) allowedValues.push(defaultValue);
        valid ||= allowedValues.includes(val);
      }
      if (validator) valid ||= validator(val);
      if (!valid && allowedValues.length > 0) {
        const allowValuesText = [...new Set(allowedValues)].map((value) => JSON.stringify(value)).join(", ");
        warn(`Invalid prop: validation failed${key ? ` for prop "${key}"` : ""}. Expected one of [${allowValuesText}], got value ${JSON.stringify(val)}.`);
      }
      return valid;
    } : void 0,
    [epPropKey]: true
  };
  if (hasOwn(prop, "default")) epProp.default = defaultValue;
  return epProp;
};
const buildProps = (props) => fromPairs(Object.entries(props).map(([key, option]) => [key, buildProp(option, key)]));
var _sfc_main50 = /* @__PURE__ */ defineComponent({
  name: "CircleCloseFilled",
  __name: "circle-close-filled",
  setup(__props) {
    return (_ctx, _cache) => (openBlock(), createElementBlock("svg", {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 1024 1024"
    }, [
      createElementVNode("path", {
        fill: "currentColor",
        d: "M512 64a448 448 0 1 1 0 896 448 448 0 0 1 0-896m0 393.664L407.936 353.6a38.4 38.4 0 1 0-54.336 54.336L457.664 512 353.6 616.064a38.4 38.4 0 1 0 54.336 54.336L512 566.336 616.064 670.4a38.4 38.4 0 1 0 54.336-54.336L566.336 512 670.4 407.936a38.4 38.4 0 1 0-54.336-54.336z"
      })
    ]));
  }
}), circle_close_filled_default = _sfc_main50;
var _sfc_main56 = /* @__PURE__ */ defineComponent({
  name: "Close",
  __name: "close",
  setup(__props) {
    return (_ctx, _cache) => (openBlock(), createElementBlock("svg", {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 1024 1024"
    }, [
      createElementVNode("path", {
        fill: "currentColor",
        d: "M764.288 214.592 512 466.88 259.712 214.592a31.936 31.936 0 0 0-45.12 45.12L466.752 512 214.528 764.224a31.936 31.936 0 1 0 45.12 45.184L512 557.184l252.288 252.288a31.936 31.936 0 0 0 45.12-45.12L557.12 512.064l252.288-252.352a31.936 31.936 0 1 0-45.12-45.184z"
      })
    ]));
  }
}), close_default = _sfc_main56;
var _sfc_main143 = /* @__PURE__ */ defineComponent({
  name: "InfoFilled",
  __name: "info-filled",
  setup(__props) {
    return (_ctx, _cache) => (openBlock(), createElementBlock("svg", {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 1024 1024"
    }, [
      createElementVNode("path", {
        fill: "currentColor",
        d: "M512 64a448 448 0 1 1 0 896.064A448 448 0 0 1 512 64m67.2 275.072c33.28 0 60.288-23.104 60.288-57.344s-27.072-57.344-60.288-57.344c-33.28 0-60.16 23.104-60.16 57.344s26.88 57.344 60.16 57.344M590.912 699.2c0-6.848 2.368-24.64 1.024-34.752l-52.608 60.544c-10.88 11.456-24.512 19.392-30.912 17.28a12.99 12.99 0 0 1-8.256-14.72l87.68-276.992c7.168-35.136-12.544-67.2-54.336-71.296-44.096 0-108.992 44.736-148.48 101.504 0 6.784-1.28 23.68.064 33.792l52.544-60.608c10.88-11.328 23.552-19.328 29.952-17.152a12.8 12.8 0 0 1 7.808 16.128L388.48 728.576c-10.048 32.256 8.96 63.872 55.04 71.04 67.84 0 107.904-43.648 147.456-100.416z"
      })
    ]));
  }
}), info_filled_default = _sfc_main143;
var _sfc_main195 = /* @__PURE__ */ defineComponent({
  name: "PictureFilled",
  __name: "picture-filled",
  setup(__props) {
    return (_ctx, _cache) => (openBlock(), createElementBlock("svg", {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 1024 1024"
    }, [
      createElementVNode("path", {
        fill: "currentColor",
        d: "M96 896a32 32 0 0 1-32-32V160a32 32 0 0 1 32-32h832a32 32 0 0 1 32 32v704a32 32 0 0 1-32 32zm315.52-228.48-68.928-68.928a32 32 0 0 0-45.248 0L128 768.064h778.688l-242.112-290.56a32 32 0 0 0-49.216 0L458.752 665.408a32 32 0 0 1-47.232 2.112M256 384a96 96 0 1 0 192.064-.064A96 96 0 0 0 256 384"
      })
    ]));
  }
}), picture_filled_default = _sfc_main195;
var _sfc_main249 = /* @__PURE__ */ defineComponent({
  name: "SuccessFilled",
  __name: "success-filled",
  setup(__props) {
    return (_ctx, _cache) => (openBlock(), createElementBlock("svg", {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 1024 1024"
    }, [
      createElementVNode("path", {
        fill: "currentColor",
        d: "M512 64a448 448 0 1 1 0 896 448 448 0 0 1 0-896m-55.808 536.384-99.52-99.584a38.4 38.4 0 1 0-54.336 54.336l126.72 126.72a38.27 38.27 0 0 0 54.336 0l262.4-262.464a38.4 38.4 0 1 0-54.272-54.336z"
      })
    ]));
  }
}), success_filled_default = _sfc_main249;
var _sfc_main287 = /* @__PURE__ */ defineComponent({
  name: "WarningFilled",
  __name: "warning-filled",
  setup(__props) {
    return (_ctx, _cache) => (openBlock(), createElementBlock("svg", {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 1024 1024"
    }, [
      createElementVNode("path", {
        fill: "currentColor",
        d: "M512 64a448 448 0 1 1 0 896 448 448 0 0 1 0-896m0 192a58.43 58.43 0 0 0-58.24 63.744l23.36 256.384a35.072 35.072 0 0 0 69.76 0l23.296-256.384A58.43 58.43 0 0 0 512 256m0 512a51.2 51.2 0 1 0 0-102.4 51.2 51.2 0 0 0 0 102.4"
      })
    ]));
  }
}), warning_filled_default = _sfc_main287;
const TypeComponents = {
  Close: close_default
};
const TypeComponentsMap = {
  primary: info_filled_default,
  success: success_filled_default,
  warning: warning_filled_default,
  error: circle_close_filled_default,
  info: info_filled_default
};
const alertEffects = ["light", "dark"];
const alertProps = buildProps({
  title: {
    type: String,
    default: ""
  },
  description: {
    type: String,
    default: ""
  },
  type: {
    type: String,
    values: keysOf(TypeComponentsMap),
    default: "info"
  },
  closable: {
    type: Boolean,
    default: true
  },
  closeText: {
    type: String,
    default: ""
  },
  showIcon: Boolean,
  center: Boolean,
  effect: {
    type: String,
    values: alertEffects,
    default: "light"
  }
});
const alertEmits = { close: (evt) => evt instanceof MouseEvent };
function isComment(node) {
  return isVNode(node) && node.type === Comment;
}
const flattedChildren = (children) => {
  const vNodes = isArray(children) ? children : [children];
  const result = [];
  vNodes.forEach((child) => {
    if (isArray(child)) result.push(...flattedChildren(child));
    else if (isVNode(child) && child.component?.subTree) result.push(child, ...flattedChildren(child.component.subTree));
    else if (isVNode(child) && isArray(child.children)) result.push(...flattedChildren(child.children));
    else if (isVNode(child) && child.shapeFlag === 2) result.push(...flattedChildren(child.type()));
    else result.push(child);
  });
  return result;
};
const iconProps = buildProps({
  size: { type: definePropType([Number, String]) },
  color: { type: String }
});
const SCOPE = "utils/dom/style";
function addUnit(value, defaultUnit = "px") {
  if (!value && value !== 0) return "";
  if (isNumber(value) || isStringNumber(value)) return `${value}${defaultUnit}`;
  else if (isString(value)) return value;
  debugWarn(SCOPE, "binding value must be a string or number");
}
var icon_vue_vue_type_script_setup_true_lang_default = /* @__PURE__ */ defineComponent({
  name: "ElIcon",
  inheritAttrs: false,
  __name: "icon",
  props: iconProps,
  setup(__props) {
    const props = __props;
    const ns = useNamespace("icon");
    const style = computed(() => {
      const { size, color } = props;
      const fontSize = addUnit(size);
      if (!fontSize && !color) return {};
      return {
        fontSize,
        "--color": color
      };
    });
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("i", mergeProps({
        class: unref(ns).b(),
        style: style.value
      }, _ctx.$attrs), [renderSlot(_ctx.$slots, "default")], 16);
    };
  }
});
var icon_default = icon_vue_vue_type_script_setup_true_lang_default;
const ElIcon = withInstall(icon_default);
var alert_vue_vue_type_script_setup_true_lang_default = /* @__PURE__ */ defineComponent({
  name: "ElAlert",
  __name: "alert",
  props: alertProps,
  emits: alertEmits,
  setup(__props, { emit: __emit }) {
    const { Close } = TypeComponents;
    const props = __props;
    const emit = __emit;
    const slots = useSlots();
    const ns = useNamespace("alert");
    const visible = ref(true);
    const iconComponent = computed(() => TypeComponentsMap[props.type]);
    const hasDesc = computed(() => {
      if (props.description) return true;
      const slotContent = slots.default?.();
      if (!slotContent) return false;
      return flattedChildren(slotContent).some((child) => !isComment(child));
    });
    const close = (evt) => {
      visible.value = false;
      emit("close", evt);
    };
    return (_ctx, _cache) => {
      return openBlock(), createBlock(Transition, {
        name: unref(ns).b("fade"),
        persisted: ""
      }, {
        default: withCtx(() => [withDirectives(createElementVNode("div", {
          class: normalizeClass([
            unref(ns).b(),
            unref(ns).m(__props.type),
            unref(ns).is("center", __props.center),
            unref(ns).is(__props.effect)
          ]),
          role: "alert"
        }, [__props.showIcon && (_ctx.$slots.icon || iconComponent.value) ? (openBlock(), createBlock(unref(ElIcon), {
          key: 0,
          class: normalizeClass([unref(ns).e("icon"), unref(ns).is("big", hasDesc.value)])
        }, {
          default: withCtx(() => [renderSlot(_ctx.$slots, "icon", {}, () => [(openBlock(), createBlock(resolveDynamicComponent(iconComponent.value)))])]),
          _: 3
        }, 8, ["class"])) : createCommentVNode("v-if", true), createElementVNode("div", { class: normalizeClass(unref(ns).e("content")) }, [
          __props.title || _ctx.$slots.title ? (openBlock(), createElementBlock("span", {
            key: 0,
            class: normalizeClass([unref(ns).e("title"), { "with-description": hasDesc.value }])
          }, [renderSlot(_ctx.$slots, "title", {}, () => [createTextVNode(toDisplayString(__props.title), 1)])], 2)) : createCommentVNode("v-if", true),
          hasDesc.value ? (openBlock(), createElementBlock("p", {
            key: 1,
            class: normalizeClass(unref(ns).e("description"))
          }, [renderSlot(_ctx.$slots, "default", {}, () => [createTextVNode(toDisplayString(__props.description), 1)])], 2)) : createCommentVNode("v-if", true),
          __props.closable ? (openBlock(), createElementBlock(Fragment, { key: 2 }, [__props.closeText ? (openBlock(), createElementBlock("div", {
            key: 0,
            class: normalizeClass([unref(ns).e("close-btn"), unref(ns).is("customed")]),
            onClick: close
          }, toDisplayString(__props.closeText), 3)) : (openBlock(), createBlock(unref(ElIcon), {
            key: 1,
            class: normalizeClass(unref(ns).e("close-btn")),
            onClick: close
          }, {
            default: withCtx(() => [createVNode(unref(Close))]),
            _: 1
          }, 8, ["class"]))], 64)) : createCommentVNode("v-if", true)
        ], 2)], 2), [[vShow, visible.value]])]),
        _: 3
      }, 8, ["name"]);
    };
  }
});
var alert_default = alert_vue_vue_type_script_setup_true_lang_default;
const ElAlert = withInstall(alert_default);

export { ElAlert as E, withNoopInstall as a, buildProps as b, isUndefined as c, definePropType as d, isNumber as i, picture_filled_default as p, useNamespace as u, withInstall as w };
//# sourceMappingURL=el-alert-evJ2M_PZ.mjs.map
