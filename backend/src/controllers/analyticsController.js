import * as analyticsService from "../services/analyticsService.js";

export async function getWeekly(req, res, next) {
  try {
    const todayStr = req.query.today;
    const analytics = await analyticsService.getWeeklyAnalytics(req.userId, todayStr);
    return res.status(200).json(analytics);
  } catch (err) {
    next(err);
  }
}
