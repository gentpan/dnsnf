import { d as defineEventHandler, l as listApiTokens, p as publicTokenView } from '../../../nitro/nitro.mjs';
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

const tokens_get = defineEventHandler(async () => {
  const rows = await listApiTokens();
  return {
    code: 0,
    data: {
      total: rows.length,
      tokens: rows.map(publicTokenView)
    },
    timestamp: Math.floor(Date.now() / 1e3)
  };
});

export { tokens_get as default };
//# sourceMappingURL=tokens.get.mjs.map
