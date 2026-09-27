import { query } from "../config/database.js";
import { getTodayDateString, getDaysDifference } from "../utils/dateUtils.js";

/**
 * Formats a raw database habit row and its completion records for frontend consumption
 */
function formatHabit(habitRow, completionDates = [], todayStr = getTodayDateString()) {
  const lastCompleted = habitRow.last_completed || "";
  const isDone = Boolean(lastCompleted && lastCompleted === todayStr);

  let effectiveStreak = 0;
  if (lastCompleted) {
    const diff = getDaysDifference(todayStr, lastCompleted);
    if (diff === 0 || diff === 1) {
      effectiveStreak = Number(habitRow.streak) || 0;
    }
  }

  return {
    id: habitRow.id,
    name: habitRow.name,
    icon: habitRow.icon || "⭐",
    category: habitRow.category || "Personal",
    streak: effectiveStreak,
    done: isDone,
    lastCompleted: lastCompleted,
    completionHistory: completionDates,
    createdAt: habitRow.created_at,
    updatedAt: habitRow.updated_at
  };
}

export async function getUserHabits(userId, todayStr = getTodayDateString()) {
  const habitsResult = await query(
    "SELECT * FROM habits WHERE user_id = $1 ORDER BY id ASC",
    [userId]
  );

  const habits = [];
  for (const habitRow of habitsResult.rows) {
    const completionsResult = await query(
      "SELECT completion_date FROM habit_completions WHERE habit_id = $1 ORDER BY completion_date ASC",
      [habitRow.id]
    );

    const completionDates = completionsResult.rows.map((r) => r.completion_date);
    habits.push(formatHabit(habitRow, completionDates, todayStr));
  }

  return habits;
}

export async function getHabitById(id, userId, todayStr = getTodayDateString()) {
  const result = await query(
    "SELECT * FROM habits WHERE id = $1 AND user_id = $2",
    [id, userId]
  );

  if (result.rows.length === 0) {
    const error = new Error("Habit not found");
    error.statusCode = 404;
    throw error;
  }

  const habitRow = result.rows[0];
  const completionsResult = await query(
    "SELECT completion_date FROM habit_completions WHERE habit_id = $1 ORDER BY completion_date ASC",
    [habitRow.id]
  );

  const completionDates = completionsResult.rows.map((r) => r.completion_date);
  return formatHabit(habitRow, completionDates, todayStr);
}

export async function createHabit({ userId, name, icon = "⭐", category = "Personal" }) {
  const result = await query(
    "INSERT INTO habits (user_id, name, icon, category, streak, last_completed) VALUES ($1, $2, $3, $4, 0, NULL) RETURNING *",
    [userId, name.trim(), icon || "⭐", category || "Personal"]
  );

  const habitRow = result.rows[0];
  return formatHabit(habitRow, [], getTodayDateString());
}

export async function updateHabit({ id, userId, name, icon, category, todayStr = getTodayDateString() }) {
  // Check ownership
  const existing = await query(
    "SELECT * FROM habits WHERE id = $1 AND user_id = $2",
    [id, userId]
  );

  if (existing.rows.length === 0) {
    const error = new Error("Habit not found or unauthorized");
    error.statusCode = 404;
    throw error;
  }

  const currentHabit = existing.rows[0];
  const updatedName = name !== undefined ? name.trim() : currentHabit.name;
  const updatedIcon = icon !== undefined ? icon : currentHabit.icon;
  const updatedCategory = category !== undefined ? category : currentHabit.category;

  const result = await query(
    "UPDATE habits SET name = $1, icon = $2, category = $3 WHERE id = $4 AND user_id = $5 RETURNING *",
    [updatedName, updatedIcon, updatedCategory, id, userId]
  );

  const completionsResult = await query(
    "SELECT completion_date FROM habit_completions WHERE habit_id = $1 ORDER BY completion_date ASC",
    [id]
  );

  const completionDates = completionsResult.rows.map((r) => r.completion_date);
  return formatHabit(result.rows[0], completionDates, todayStr);
}

export async function deleteHabit(id, userId) {
  const result = await query(
    "DELETE FROM habits WHERE id = $1 AND user_id = $2 RETURNING *",
    [id, userId]
  );

  if (result.rows.length === 0) {
    const error = new Error("Habit not found or unauthorized");
    error.statusCode = 404;
    throw error;
  }

  return { success: true, id: Number(id) };
}

export async function completeHabit(id, userId, customDate) {
  const todayStr = customDate || getTodayDateString();

  // 1. Fetch habit ensuring ownership
  const habitResult = await query(
    "SELECT * FROM habits WHERE id = $1 AND user_id = $2",
    [id, userId]
  );

  if (habitResult.rows.length === 0) {
    const error = new Error("Habit not found or unauthorized");
    error.statusCode = 404;
    throw error;
  }

  const habit = habitResult.rows[0];

  // 2. Fetch current user total XP
  const userResult = await query(
    "SELECT id, total_xp FROM users WHERE id = $1",
    [userId]
  );
  let totalXp = userResult.rows.length > 0 ? Number(userResult.rows[0].total_xp) : 0;

  // 3. Check if habit was already completed on this date
  const checkCompletion = await query(
    "SELECT * FROM habit_completions WHERE habit_id = $1 AND completion_date = $2",
    [id, todayStr]
  );

  const isAlreadyCompleted = checkCompletion.rows.length > 0 || habit.last_completed === todayStr;

  if (isAlreadyCompleted) {
    const completionsResult = await query(
      "SELECT completion_date FROM habit_completions WHERE habit_id = $1 ORDER BY completion_date ASC",
      [id]
    );
    const completionDates = completionsResult.rows.map((r) => r.completion_date);
    const formattedHabit = formatHabit(habit, completionDates, todayStr);

    return {
      updatedHabit: formattedHabit,
      xpGained: 0,
      totalXp,
      currentStreak: formattedHabit.streak,
      newlyRecorded: false,
      message: "Habit already completed today"
    };
  }

  // 4. Calculate new streak
  const prevLastCompleted = habit.last_completed;
  let newStreak = 1;

  if (prevLastCompleted) {
    const diff = getDaysDifference(todayStr, prevLastCompleted);
    if (diff === 1) {
      newStreak = (Number(habit.streak) || 0) + 1;
    } else if (diff === 0) {
      newStreak = Number(habit.streak) || 1;
    } else {
      newStreak = 1;
    }
  }

  // 5. Insert completion record
  await query(
    "INSERT INTO habit_completions (habit_id, user_id, completion_date) VALUES ($1, $2, $3)",
    [id, userId, todayStr]
  );

  // 6. Update habit streak and last_completed
  const updatedHabitResult = await query(
    "UPDATE habits SET streak = $1, last_completed = $2 WHERE id = $3 RETURNING *",
    [newStreak, todayStr, id]
  );

  // 7. Update user total_xp (+10 XP)
  const updatedUserResult = await query(
    "UPDATE users SET total_xp = total_xp + $1 WHERE id = $2 RETURNING total_xp",
    [10, userId]
  );

  if (updatedUserResult.rows.length > 0) {
    totalXp = Number(updatedUserResult.rows[0].total_xp);
  }

  // 8. Fetch updated completion history
  const completionsResult = await query(
    "SELECT completion_date FROM habit_completions WHERE habit_id = $1 ORDER BY completion_date ASC",
    [id]
  );
  const completionDates = completionsResult.rows.map((r) => r.completion_date);

  const formattedHabit = formatHabit(
    updatedHabitResult.rows[0],
    completionDates,
    todayStr
  );

  return {
    updatedHabit: formattedHabit,
    xpGained: 10,
    totalXp,
    currentStreak: newStreak,
    newlyRecorded: true
  };
}

export async function getHabitCompletions(id, userId) {
  // Check ownership
  const habitResult = await query(
    "SELECT id FROM habits WHERE id = $1 AND user_id = $2",
    [id, userId]
  );

  if (habitResult.rows.length === 0) {
    const error = new Error("Habit not found or unauthorized");
    error.statusCode = 404;
    throw error;
  }

  const result = await query(
    "SELECT * FROM habit_completions WHERE habit_id = $1 ORDER BY completion_date DESC",
    [id]
  );

  return result.rows;
}
