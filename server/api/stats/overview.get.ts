import { readAnalyticsOverview } from "../../utils/analytics";

const QUERY_PROJECTS_COUNT = 8;

export default defineEventHandler(async () => {
  const data = await readAnalyticsOverview();
  return {
    code: 0,
    data: {
      query_projects: QUERY_PROJECTS_COUNT,
      today_requests: data.today_requests,
      total_queries: data.queries_total,
      today_visitors: data.today_visitors,
      updated_at: data.updated_at,
    },
    cached: false,
    timestamp: Math.floor(Date.now() / 1000),
  };
});
