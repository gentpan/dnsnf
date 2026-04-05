import { d as defineEventHandler, i as readAnalyticsOverview } from '../../../nitro/nitro.mjs';
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

const QUERY_PROJECTS_COUNT = 8;
const overview_get = defineEventHandler(async () => {
  const data = await readAnalyticsOverview();
  return {
    code: 0,
    data: {
      query_projects: QUERY_PROJECTS_COUNT,
      today_requests: data.today_requests,
      total_queries: data.queries_total,
      today_visitors: data.today_visitors,
      updated_at: data.updated_at
    },
    cached: false,
    timestamp: Math.floor(Date.now() / 1e3)
  };
});

export { overview_get as default };
//# sourceMappingURL=overview.get.mjs.map
