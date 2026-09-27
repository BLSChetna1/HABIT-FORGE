import { query } from "../config/database.js";
import { getLast7Days, getTodayDateString } from "../utils/dateUtils.js";

export async function getWeeklyAnalytics(userId, baseDateStr = getTodayDateString()) {
  const last7Days = getLast7Days(baseDateStr);

  const result = await query(
    "SELECT completion_date FROM habit_completions WHERE user_id = $1",
    [userId]
  );

  const userCompletions = result.rows.map((r) => r.completion_date);

  const counts = last7Days.map((date) => {
    return userCompletions.filter((cDate) => cDate === date).length;
  });

  const totalCompletions = counts.reduce((sum, count) => sum + count, 0);

  return {
    dates: last7Days,
    counts,
    totalCompletions
  };
}
