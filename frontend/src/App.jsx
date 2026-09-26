import { useState, useEffect } from "react";
import "./App.css";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function App() {
  const [habits, setHabits] = useState(() => {
    const savedHabits = localStorage.getItem("habits");

    if (savedHabits) {
      return JSON.parse(savedHabits);
    }

    return [
      {
        id: 1,
        name: "Drink Water",
        icon: "💧",
        streak: 0,
        done: false,
        lastCompleted: "",
        completionHistory: []
      },
      {
        id: 2,
        name: "Read 30 Minutes",
        icon: "📚",
        streak: 0,
        done: false,
        lastCompleted: "",
        completionHistory: []
      },
      {
        id: 3,
        name: "Exercise",
        icon: "🏃",
        streak: 0,
        done: false,
        lastCompleted: "",
        completionHistory: []
      }
    ];
  });

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("⭐");
  const [category, setCategory] = useState("Personal");
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");

  const [xp, setXp] = useState(() => {
    const savedXP = localStorage.getItem("xp");
    return savedXP ? Number(savedXP) : 0;
  });

  useEffect(() => {
    localStorage.setItem("habits", JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem("xp", xp);
  }, [xp]);

  function completeHabit(id) {
    const today = new Date().toISOString().split("T")[0];

    setHabits(
      habits.map((habit) => {
        if (habit.id !== id) {
          return habit;
        }

        if (habit.lastCompleted === today) {
          return habit;
        }

        let newStreak = 1;

        if (habit.lastCompleted) {
          const lastDate = new Date(habit.lastCompleted);
          const todayDate = new Date(today);

          const difference =
            (todayDate - lastDate) /
            (1000 * 60 * 60 * 24);

          if (difference === 1) {
            newStreak = habit.streak + 1;
          }
        }

        setXp((oldXp) => oldXp + 10);

        return {
          ...habit,
          done: true,
          streak: newStreak,
          lastCompleted: today,
          completionHistory: [
            ...(habit.completionHistory || []),
            today
          ]
        };
      })
    );
  }

  function resetToday() {
    setHabits(
      habits.map((habit) => ({
        ...habit,
        done: false
      }))
    );
  }

  function addHabit() {
    if (!name.trim()) {
      alert("Enter a habit name");
      return;
    }

    const newHabit = {
      id: Date.now(),
      name: name,
      icon: icon,
      category: category,
      streak: 0,
      done: false,
      lastCompleted: "",
      completionHistory: []
    };

    setHabits([...habits, newHabit]);
    setName("");
    setIcon("⭐");
    setCategory("Personal");
    setShowForm(false);
  }
  function editHabit(id) {
  const habit = habits.find((habit) => habit.id === id);

  if (!habit) {
    return;
  }

  const newName = prompt(
    "Enter the new habit name:",
    habit.name
  );

  if (!newName || !newName.trim()) {
    return;
  }

  setHabits(
    habits.map((habit) =>
      habit.id === id
        ? {
            ...habit,
            name: newName.trim()
          }
        : habit
    )
  );
}
  function deleteHabit(id) {
    setHabits(
      habits.filter((habit) => habit.id !== id)
    );
  }

  const level = Math.floor(xp / 100) + 1;
  const currentLevelXP = xp % 100;

  const completedHabits = habits.filter(
    (habit) => habit.done
  ).length;

  const totalHabits = habits.length;

  const progress =
    totalHabits === 0
      ? 0
      : Math.round(
          (completedHabits / totalHabits) * 100
        );
  const motivationalMessages = [
  "🌱 Small steps every day lead to big changes.",
  "🔥 Keep going! You're building something great.",
  "💪 Consistency is your superpower.",
  "✨ One good habit can change your entire day.",
  "🚀 You're closer than yesterday. Keep moving!",
  "🌟 Progress, not perfection.",
  "🏆 Every completed habit is a win!"
];

const message =
  motivationalMessages[
    completedHabits % motivationalMessages.length
  ];

  const hasSevenDayStreak = habits.some(
    (habit) => habit.streak >= 7
  );

  const today = new Date();
  const last7Days = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);

    last7Days.push(
      date.toISOString().split("T")[0]
    );
  }

  const chartLabels = last7Days.map((date) => {
    const parts = date.split("-");
    return `${parts[2]}/${parts[1]}`;
  });

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

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: "Habits Completed",
        data: chartValues
      }
    ]
  };

  const chartOptions = {
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

  return (
    <div className="app">

      <header>
        <h1>HabitForge</h1>
        <p>Build better habits. Every day.</p>
      </header>

      <main>

        <div className="progress-card">
          <h2>🏆 Level {level}</h2>

          <p>
            {currentLevelXP} / 100 XP
          </p>

          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: currentLevelXP + "%"
              }}
            ></div>
          </div>

          <p>Total XP: {xp}</p>
        </div>

        <div className="progress-card">
          <h2>📊 Today's Progress</h2>
          <p>🎯 Daily Goal: Complete all {totalHabits} habits</p>
          <p>{message}</p>

          <p>
            {completedHabits} / {totalHabits} habits completed
          </p>

          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: progress + "%"
              }}
            ></div>
          </div>

          <p>{progress}% Complete</p>
          <div className="progress-circle">
  <div
    className="progress-circle-fill"
    style={{
      width: `${progress}%`
    }}
  ></div>
</div>
          {progress === 100 && (
  <p>
    🎉 Amazing! You completed all your habits today!
  </p>
)}
        </div>

        <div className="progress-card">
          <h2>🏅 Badges</h2>

          {xp >= 50 && <p>🌟 Rising Star</p>}
          {xp >= 100 && <p>🏆 XP Master</p>}
          {xp >= 200 && <p>👑 Habit Champion</p>}

          {hasSevenDayStreak && (
            <p>
              🔥 Consistency King — 7 Day Streak
            </p>
          )}

          {xp < 50 && !hasSevenDayStreak && (
            <p>
              Complete habits to unlock badges!
            </p>
          )}
        </div>

        <div className="progress-card">
          <h2>📈 Analytics</h2>

          <Bar
            data={chartData}
            options={chartOptions}
          />
        </div>

        <h2>My Habits</h2>
        <input
  type="text"
  placeholder="🔎 Search habits..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
/>
<select
  value={filterCategory}
  onChange={(e) => setFilterCategory(e.target.value)}
>
  <option value="All">All Categories</option>
  <option value="Personal">🌱 Personal</option>
  <option value="Study">📚 Study</option>
  <option value="Health">💪 Health</option>
  <option value="Mindfulness">🧘 Mindfulness</option>
  <option value="Productivity">💼 Productivity</option>
</select>

        <div className="habit-list">

          {habits
  .filter((habit) =>
    habit.name.toLowerCase().includes(search.toLowerCase())
  )
  .filter((habit) =>
    filterCategory === "All" ||
    (habit.category || "Personal") === filterCategory
  )
  .map((habit) => (
            <div
              className="habit-card"
              key={habit.id}
            >

              <div>
                <h3>
                  {habit.icon} {habit.name}
                </h3>
                <p className={`category ${habit.category || "Personal"}`}>
  🏷️ {habit.category || "Personal"}
</p>

                <span>
                  🔥 {habit.streak} day streak
                </span>
              </div>

              <div>

                <button
                  onClick={() =>
                    completeHabit(habit.id)
                  }
                  disabled={habit.done}
                >
                  {habit.done
                    ? "✓ Completed"
                    : "✓ Complete"}
                </button>
                <button
  onClick={() =>
    editHabit(habit.id)
  }
>
  ✏️ Edit
</button>

                <button
                  onClick={() =>
                    deleteHabit(habit.id)
                  }
                >
                  🗑 Delete
                </button>

              </div>

            </div>
          ))}

        </div>

        <button
          className="add-button"
          onClick={() =>
            setShowForm(!showForm)
          }
        >
          + Add Habit
        </button>

        {showForm && (
          <div className="habit-form">

            <h2>Add Habit</h2>
            <div>
  <p>Choose an icon:</p>

  {["⭐", "💧", "📚", "🏃", "🧘", "🎯", "💪", "🍎"].map(
    (emoji) => (
      <button
        key={emoji}
        type="button"
        onClick={() => setIcon(emoji)}
        style={{
          fontSize: "24px",
          margin: "4px",
          border:
            icon === emoji
              ? "2px solid black"
              : "1px solid #ccc"
        }}
      >
        {emoji}
      </button>
    )
  )}
  <div>
  <p>Choose a category:</p>

  <select
    value={category}
    onChange={(e) => setCategory(e.target.value)}
  >
    <option value="Personal">🌱 Personal</option>
    <option value="Study">📚 Study</option>
    <option value="Health">💪 Health</option>
    <option value="Mindfulness">🧘 Mindfulness</option>
    <option value="Productivity">💼 Productivity</option>
  </select>
</div>
</div>

            <input
              type="text"
              placeholder="Habit name"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
            />

            <button onClick={addHabit}>
              Add Habit
            </button>

          </div>
        )}

        <br />

        <button onClick={resetToday}>
          🔄 Reset Today
        </button>

      </main>

    </div>
  );
}

export default App;