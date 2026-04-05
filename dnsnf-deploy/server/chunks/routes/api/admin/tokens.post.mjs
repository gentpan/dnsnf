import { d as defineEventHandler, r as readBody, c as createError, a as revokeApiToken, b as createApiToken, t as tokenPreview } from '../../../nitro/nitro.mjs';
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

const tokens_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  const action = String((body == null ? void 0 : body.action) || "create").trim().toLowerCase();
  if (action === "revoke") {
    const id = String((body == null ? void 0 : body.id) || "").trim();
    if (!id) {
      throw createError({ statusCode: 400, statusMessage: "id is required for revoke" });
    }
    const row = await revokeApiToken(id);
    if (!row) {
      throw createError({ statusCode: 404, statusMessage: "token not found" });
    }
    return {
      code: 0,
      data: {
        revoked: true,
        id: row.id
      },
      timestamp: Math.floor(Date.now() / 1e3)
    };
  }
  const name = String((body == null ? void 0 : body.name) || "default").trim();
  const perMinuteLimit = Math.max(1, Math.min(1e4, Number(body == null ? void 0 : body.perMinuteLimit) || 300));
  const created = await createApiToken(name, perMinuteLimit);
  return {
    code: 0,
    data: {
      token: created.token,
      token_preview: tokenPreview(created.token),
      id: created.record.id,
      name: created.record.name,
      perMinuteLimit: created.record.perMinuteLimit,
      createdAt: created.record.createdAt
    },
    timestamp: Math.floor(Date.now() / 1e3)
  };
});

export { tokens_post as default };
//# sourceMappingURL=tokens.post.mjs.map
