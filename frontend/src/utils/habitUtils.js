import { MOTIVATIONAL_MESSAGES } from "./constants.js";
import {
  formatDateToDayMonth,
  getTodayDateString,
  getDaysDifference
} from "./dateUtils.js";

export function calculateLevel(xp) {
  return Math.floor(xp / 100) + 1;
}

export function calculateCurrentLevelXP(xp) {
  return xp % 100;
}

export function calculateProgress(completedHabits, totalHabits) {
  if (totalHabits === 0) {
    return 0;
  }
  return Math.round((completedHabits / totalHabits) * 100);
}

export function getMotivationalMessage(completedHabits) {
  return MOTIVATIONAL_MESSAGES[completedHabits % MOTIVATIONAL_MESSAGES.length];
}

export function checkSevenDayStreak(habits) {
  return habits.some((habit) => habit.streak >= 7);
}

/**
 * Calculates the active streak for a habit considering the current local calendar date.
 * If completed today (diff === 0) or yesterday (diff === 1), streak is active.
 * If last completed more than 1 day ago (diff > 1) or never, active streak is 0.
 * @param {Object} habit
 * @param {string} [todayStr=getTodayDateString()]
 * @returns {number}
 */
export function getEffectiveStreak(habit, todayStr = getTodayDateString()) {
  if (!habit.lastCompleted) {
    return 0;
  }

  const diff = getDaysDifference(todayStr, habit.lastCompleted);
  if (diff === 0 || diff === 1) {
    return habit.streak || 0;
  }

  return 0;
}

/**
 * Synchronizes a habit's daily `done` state and active streak with today's local date.
 * Does not alter historical records in `completionHistory`.
 * @param {Object} habit
 * @param {string} [todayStr=getTodayDateString()]
 * @returns {Object}
 */
export function syncHabitDailyStatus(habit, todayStr = getTodayDateString()) {
  const isDoneToday = habit.lastCompleted === todayStr;
  const effectiveStreak = getEffectiveStreak(habit, todayStr);

  return {
    ...habit,
    done: isDoneToday,
    streak: effectiveStreak
  };
}

/**
 * Processes completion of a habit on today's local calendar date.
 * Returns updated habit object and XP gained (10 if first completion today, 0 if already completed).
 * @param {Object} habit
 * @param {string} [todayStr=getTodayDateString()]
 * @returns {{ updatedHabit: Object, xpGained: number }}
 */
export function processHabitCompletion(habit, todayStr = getTodayDateString()) {
  if (habit.lastCompleted === todayStr) {
    return {
      updatedHabit: habit,
      xpGained: 0
    };
  }

  const diff = getDaysDifference(todayStr, habit.lastCompleted);
  let newStreak = 1;
  if (diff === 1) {
    newStreak = (habit.streak || 0) + 1;
  }

  const history = Array.isArray(habit.completionHistory)
    ? habit.completionHistory
    : [];

  const updatedHistory = history.includes(todayStr)
    ? history
    : [...history, todayStr];

  return {
    updatedHabit: {
      ...habit,
      done: true,
      streak: newStreak,
      lastCompleted: todayStr,
      completionHistory: updatedHistory
    },
    xpGained: 10
  };
}

export function getChartData(habits, last7Days) {
  const chartLabels = last7Days.map(formatDateToDayMonth);

  const chartValues = last7Days.map((date) => {
    let count = 0;

    habits.forEach((habit) => {
      if (
        habit.completionHistory &&
        habit.completionHistory.includes(date)
      ) {
        count++;
      }
    });

    return count;
  });

  return {
    labels: chartLabels,
    datasets: [
      {
        label: "Habits Completed",
        data: chartValues
      }
    ]
  };
}

export function getChartOptions() {
  return {
    responsive: true,
    plugins: {
      legend: {
        display: true
      },
      title: {
        display: true,
        text: "Last 7 Days"
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };
}
