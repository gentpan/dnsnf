import { listApiTokens, publicTokenView } from "../../utils/api-access";

export default defineEventHandler(async () => {
  const rows = await listApiTokens();
  return {
    code: 0,
    data: {
      total: rows.length,
      tokens: rows.map(publicTokenView),
    },
    timestamp: Math.floor(Date.now() / 1000),
  };
});
