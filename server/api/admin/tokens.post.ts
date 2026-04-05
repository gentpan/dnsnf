import {
  createApiToken,
  revokeApiToken,
  tokenPreview,
} from "../../utils/api-access";

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    action?: "create" | "revoke";
    id?: string;
    name?: string;
    perMinuteLimit?: number;
  }>(event);

  const action = String(body?.action || "create").trim().toLowerCase();
  if (action === "revoke") {
    const id = String(body?.id || "").trim();
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
        id: row.id,
      },
      timestamp: Math.floor(Date.now() / 1000),
    };
  }

  const name = String(body?.name || "default").trim();
  const perMinuteLimit = Math.max(1, Math.min(10000, Number(body?.perMinuteLimit) || 300));
  const created = await createApiToken(name, perMinuteLimit);

  return {
    code: 0,
    data: {
      token: created.token,
      token_preview: tokenPreview(created.token),
      id: created.record.id,
      name: created.record.name,
      perMinuteLimit: created.record.perMinuteLimit,
      createdAt: created.record.createdAt,
    },
    timestamp: Math.floor(Date.now() / 1000),
  };
});
