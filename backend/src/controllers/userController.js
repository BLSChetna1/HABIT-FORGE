import * as authService from "../services/authService.js";

export async function getMe(req, res, next) {
  try {
    const user = await authService.getUserById(req.userId);
    return res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
}
