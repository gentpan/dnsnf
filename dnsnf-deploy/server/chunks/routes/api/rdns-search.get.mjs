import { d as defineEventHandler, g as getQuery, c as createError, u as useRuntimeConfig, $ as $fetch } from '../../nitro/nitro.mjs';
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

const rdnsSearch_get = defineEventHandler(async (event) => {
  var _a;
  const query = getQuery(event);
  const keyword = String(query.keyword || "").trim();
  if (!keyword || keyword.length < 2) {
    throw createError({ statusCode: 400, statusMessage: "keyword too short (min 2 chars)" });
  }
  const rawMode = String(query.mode || "").trim().toLowerCase();
  const mode = rawMode === "left" || rawMode === "right" ? rawMode : "middle";
  const limit = Math.max(1, Math.min(1e3, Number(query.limit) || 200));
  const config = useRuntimeConfig(event);
  const apiBase = String(
    config.apiInternalBase || ((_a = config.public) == null ? void 0 : _a.apiBase) || "http://localhost:8080"
  ).replace(/\/$/, "");
  const internalToken = String(config.internalToken || "").trim();
  const headers = {};
  if (internalToken) headers["X-Internal-Token"] = internalToken;
  const resp = await $fetch(`${apiBase}/v1/dns/rdns`, {
    query: { keyword, mode, limit },
    headers
  });
  return resp;
});

export { rdnsSearch_get as default };
//# sourceMappingURL=rdns-search.get.mjs.map
