import * as habitService from "../services/habitService.js";

export async function getHabits(req, res, next) {
  try {
    const todayStr = req.query.today;
    const habits = await habitService.getUserHabits(req.userId, todayStr);
    return res.status(200).json({ habits });
  } catch (err) {
    next(err);
  }
}

export async function getHabit(req, res, next) {
  try {
    const { id } = req.params;
    const todayStr = req.query.today;
    const habit = await habitService.getHabitById(id, req.userId, todayStr);
    return res.status(200).json({ habit });
  } catch (err) {
    next(err);
  }
}

export async function createHabit(req, res, next) {
  try {
    const { name, icon, category } = req.body;
    const habit = await habitService.createHabit({
      userId: req.userId,
      name,
      icon,
      category
    });
    return res.status(201).json({ habit });
  } catch (err) {
    next(err);
  }
}

export async function updateHabit(req, res, next) {
  try {
    const { id } = req.params;
    const { name, icon, category, today } = req.body;
    const habit = await habitService.updateHabit({
      id,
      userId: req.userId,
      name,
      icon,
      category,
      todayStr: today
    });
    return res.status(200).json({ habit });
  } catch (err) {
    next(err);
  }
}

export async function deleteHabit(req, res, next) {
  try {
    const { id } = req.params;
    const result = await habitService.deleteHabit(id, req.userId);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function completeHabit(req, res, next) {
  try {
    const { id } = req.params;
    const { date } = req.body || {};
    const result = await habitService.completeHabit(id, req.userId, date);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getHabitCompletions(req, res, next) {
  try {
    const { id } = req.params;
    const completions = await habitService.getHabitCompletions(id, req.userId);
    return res.status(200).json({ completions });
  } catch (err) {
    next(err);
  }
}
