import { useState, useEffect } from "react";
import "./App.css";

import Header from "./components/Header";
import UserBar from "./components/UserBar";
import AuthScreen from "./components/AuthScreen";
import XPLevelCard from "./components/XPLevelCard";
import DailyProgressCard from "./components/DailyProgressCard";
import BadgeGallery from "./components/BadgeGallery";
import AnalyticsSection from "./components/AnalyticsSection";
import HabitFilters from "./components/HabitFilters";
import HabitList from "./components/HabitList";
import HabitForm from "./components/HabitForm";
import HabitEditModal from "./components/HabitEditModal";

import {
  authApi,
  habitsApi,
  analyticsApi,
  setUnauthorizedHandler,
  getToken,
  setToken,
  removeToken
} from "./services/api";

import { getTodayDateString, getLast7Days, formatDateToDayMonth } from "./utils/dateUtils";
import {
  calculateLevel,
  calculateCurrentLevelXP,
  calculateProgress,
  getMotivationalMessage,
  checkSevenDayStreak,
  getChartOptions
} from "./utils/habitUtils";

function App() {
  const [user, setUser] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(() => Boolean(getToken()));
  const [habits, setHabits] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [migrationCandidate, setMigrationCandidate] = useState(null);
  const [isMigrating, setIsMigrating] = useState(false);

  // Form & modal states
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("⭐");
  const [category, setCategory] = useState("Personal");
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");

  const [editingHabit, setEditingHabit] = useState(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
  const [processingHabitId, setProcessingHabitId] = useState(null);

  // Fetch habits and analytics for current user
  async function loadUserData() {
    setIsLoading(true);
    setApiError("");
    const today = getTodayDateString();

    try {
      const [habitsRes, analyticsRes, userRes] = await Promise.all([
        habitsApi.getAll(today),
        analyticsApi.getWeekly(today),
        authApi.getMe()
      ]);

      if (habitsRes && habitsRes.habits) {
        setHabits(habitsRes.habits);
      }
      if (analyticsRes) {
        setAnalytics(analyticsRes);
      }
      if (userRes && userRes.user) {
        setUser(userRes.user);
      }
    } catch (err) {
      setApiError(err.message || "Failed to load habit data from server.");
    } finally {
      setIsLoading(false);
    }
  }

  // Check initial authentication on mount
  useEffect(() => {
    setUnauthorizedHandler((msg) => {
      setUser(null);
      setHabits([]);
      setAnalytics(null);
      setApiError(msg || "Your session has expired. Please sign in again.");
    });

    const token = getToken();
    if (!token) {
      return;
    }

    let isMounted = true;

    async function verifyAndLoad() {
      try {
        const today = getTodayDateString();
        const [userRes, habitsRes, analyticsRes] = await Promise.all([
          authApi.getMe(),
          habitsApi.getAll(today),
          analyticsApi.getWeekly(today)
        ]);

        if (isMounted && userRes && userRes.user) {
          setUser(userRes.user);
          if (habitsRes && habitsRes.habits) setHabits(habitsRes.habits);
          if (analyticsRes) setAnalytics(analyticsRes);

          // Check if anonymous localStorage habits exist
          const savedHabits = localStorage.getItem("habits");
          if (savedHabits) {
            try {
              const parsed = JSON.parse(savedHabits);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setMigrationCandidate(parsed);
              }
            } catch {
              // ignore
            }
          }
        } else {
          removeToken();
        }
      } catch {
        removeToken();
      } finally {
        if (isMounted) {
          setIsAuthChecking(false);
        }
      }
    }

    verifyAndLoad();

    return () => {
      isMounted = false;
    };
  }, []);

  // Re-sync habits daily status on focus/visibility change
  useEffect(() => {
    if (!user) return;

    function handleVisibilityOrFocus() {
      const today = getTodayDateString();
      habitsApi
        .getAll(today)
        .then((res) => {
          if (res && res.habits) {
            setHabits(res.habits);
          }
        })
        .catch(() => {});
    }

    window.addEventListener("focus", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);

    return () => {
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
    };
  }, [user]);

  async function handleAuthSuccess(authenticatedUser, token) {
    setToken(token);
    setUser(authenticatedUser);
    setApiError("");
    setSuccessMessage(`Welcome, ${authenticatedUser.name}!`);
    setTimeout(() => setSuccessMessage(""), 4000);

    // Check if anonymous localStorage habits exist
    const savedHabits = localStorage.getItem("habits");
    if (savedHabits) {
      try {
        const parsed = JSON.parse(savedHabits);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMigrationCandidate(parsed);
        }
      } catch {
        // ignore
      }
    }

    const today = getTodayDateString();
    try {
      const [habitsRes, analyticsRes] = await Promise.all([
        habitsApi.getAll(today),
        analyticsApi.getWeekly(today)
      ]);
      if (habitsRes && habitsRes.habits) setHabits(habitsRes.habits);
      if (analyticsRes) setAnalytics(analyticsRes);
    } catch (err) {
      setApiError(err.message || "Failed to load habits.");
    }
  }

  function handleLogout() {
    removeToken();
    setUser(null);
    setHabits([]);
    setAnalytics(null);
    setMigrationCandidate(null);
    setApiError("");
    setSuccessMessage("");
  }

  // Safe migration of anonymous localStorage habits to database
  async function handleMigrateLocalData() {
    if (!migrationCandidate || migrationCandidate.length === 0) return;
    setIsMigrating(true);
    setApiError("");

    try {
      for (const item of migrationCandidate) {
        // Create habit
        const createdRes = await habitsApi.create({
          name: item.name || "Habit",
          icon: item.icon || "⭐",
          category: item.category || "Personal"
        });

        // If it was completed today, complete it on the server
        if (item.done && createdRes && createdRes.habit) {
          await habitsApi.complete(createdRes.habit.id, getTodayDateString());
        }
      }

      // Clear anonymous habits after successful migration
      localStorage.removeItem("habits");
      localStorage.removeItem("xp");
      setMigrationCandidate(null);
      setSuccessMessage("✅ Successfully imported your local habits into your account!");
      setTimeout(() => setSuccessMessage(""), 5000);

      await loadUserData();
    } catch (err) {
      setApiError(`Migration issue: ${err.message || "Could not complete import."}`);
    } finally {
      setIsMigrating(false);
    }
  }

  function handleDismissMigration() {
    localStorage.removeItem("habits");
    localStorage.removeItem("xp");
    setMigrationCandidate(null);
  }

  async function completeHabit(id) {
    setProcessingHabitId(id);
    setApiError("");
    const today = getTodayDateString();

    try {
      const res = await habitsApi.complete(id, today);

      if (res && res.updatedHabit) {
        setHabits((prevHabits) =>
          prevHabits.map((h) => (h.id === id ? res.updatedHabit : h))
        );

        if (res.totalXp !== undefined) {
          setUser((prev) => (prev ? { ...prev, total_xp: res.totalXp } : prev));
        }

        // Refresh analytics
        const analyticsRes = await analyticsApi.getWeekly(today);
        if (analyticsRes) {
          setAnalytics(analyticsRes);
        }
      }
    } catch (err) {
      setApiError(err.message || "Failed to complete habit.");
    } finally {
      setProcessingHabitId(null);
    }
  }

  async function addHabit() {
    if (!name.trim()) {
      setApiError("Please enter a habit name.");
      return;
    }

    setIsSubmittingAdd(true);
    setApiError("");

    try {
      const res = await habitsApi.create({
        name: name.trim(),
        icon,
        category
      });

      if (res && res.habit) {
        setHabits((prev) => [...prev, res.habit]);
        setName("");
        setIcon("⭐");
        setCategory("Personal");
        setShowForm(false);
        setSuccessMessage("Habit added successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (err) {
      setApiError(err.message || "Failed to create habit.");
    } finally {
      setIsSubmittingAdd(false);
    }
  }

  function openEditModal(habit) {
    setEditingHabit(habit);
    setApiError("");
  }

  async function handleSaveEdit(updatedData) {
    setIsSavingEdit(true);
    setApiError("");

    try {
      const res = await habitsApi.update(updatedData.id, {
        name: updatedData.name,
        icon: updatedData.icon,
        category: updatedData.category,
        today: getTodayDateString()
      });

      if (res && res.habit) {
        setHabits((prev) =>
          prev.map((h) => (h.id === updatedData.id ? res.habit : h))
        );
        setEditingHabit(null);
        setSuccessMessage("Habit updated successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (err) {
      setApiError(err.message || "Failed to update habit.");
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function deleteHabit(id) {
    if (!window.confirm("Are you sure you want to delete this habit?")) {
      return;
    }

    setProcessingHabitId(id);
    setApiError("");

    try {
      await habitsApi.delete(id);
      setHabits((prev) => prev.filter((h) => h.id !== id));

      // Refresh weekly analytics
      const today = getTodayDateString();
      const analyticsRes = await analyticsApi.getWeekly(today);
      if (analyticsRes) {
        setAnalytics(analyticsRes);
      }

      setSuccessMessage("Habit deleted.");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setApiError(err.message || "Failed to delete habit.");
    } finally {
      setProcessingHabitId(null);
    }
  }

  if (isAuthChecking) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading HabitForge...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  const xp = user.total_xp || 0;
  const level = calculateLevel(xp);
  const currentLevelXP = calculateCurrentLevelXP(xp);

  const completedHabits = habits.filter((habit) => habit.done).length;
  const totalHabits = habits.length;

  const progress = calculateProgress(completedHabits, totalHabits);
  const message = getMotivationalMessage(completedHabits);
  const hasSevenDayStreak = checkSevenDayStreak(habits);

  const last7Days = getLast7Days();
  const chartLabels = (analytics && analytics.dates ? analytics.dates : last7Days).map(
    formatDateToDayMonth
  );
  const chartValues =
    analytics && analytics.counts
      ? analytics.counts
      : last7Days.map((date) =>
          habits.filter((h) => h.completionHistory && h.completionHistory.includes(date)).length
        );

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: "Habits Completed",
        data: chartValues,
        backgroundColor: "rgba(99, 102, 241, 0.7)",
        borderColor: "rgba(99, 102, 241, 1)",
        borderWidth: 1.5,
        borderRadius: 6
      }
    ]
  };
  const chartOptions = getChartOptions();

  return (
    <div className="app">
      <UserBar user={user} onLogout={handleLogout} />
      <Header />

      <main>
        {successMessage && <div className="success-banner">{successMessage}</div>}
        {apiError && <div className="error-banner">{apiError}</div>}

        {migrationCandidate && (
          <div className="migration-banner">
            <div className="migration-text">
              <strong>📦 Local Habits Detected:</strong> We found {migrationCandidate.length} habit(s) stored locally in your browser. Would you like to import them to your account?
            </div>
            <div className="migration-buttons">
              <button
                className="import-btn"
                onClick={handleMigrateLocalData}
                disabled={isMigrating}
              >
                {isMigrating ? "Importing..." : "📥 Import Habits"}
              </button>
              <button
                className="dismiss-btn"
                onClick={handleDismissMigration}
                disabled={isMigrating}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <XPLevelCard
          level={level}
          currentLevelXP={currentLevelXP}
          xp={xp}
        />

        <DailyProgressCard
          totalHabits={totalHabits}
          completedHabits={completedHabits}
          progress={progress}
          message={message}
        />

        <BadgeGallery
          xp={xp}
          hasSevenDayStreak={hasSevenDayStreak}
        />

        <AnalyticsSection
          chartData={chartData}
          chartOptions={chartOptions}
        />

        <h2>My Habits</h2>

        <HabitFilters
          search={search}
          onSearchChange={setSearch}
          filterCategory={filterCategory}
          onFilterCategoryChange={setFilterCategory}
        />

        {isLoading ? (
          <div className="habits-loading">
            <div className="spinner-small"></div>
            <p>Syncing habits from server...</p>
          </div>
        ) : (
          <HabitList
            habits={habits}
            search={search}
            filterCategory={filterCategory}
            onCompleteHabit={completeHabit}
            onEditHabit={openEditModal}
            onDeleteHabit={deleteHabit}
            processingHabitId={processingHabitId}
          />
        )}

        <HabitForm
          showForm={showForm}
          onToggleForm={() => setShowForm(!showForm)}
          name={name}
          onNameChange={setName}
          icon={icon}
          onIconChange={setIcon}
          category={category}
          onCategoryChange={setCategory}
          onSubmit={addHabit}
          isSubmitting={isSubmittingAdd}
        />

        <HabitEditModal
          key={editingHabit ? editingHabit.id : "edit-modal"}
          habit={editingHabit}
          isOpen={Boolean(editingHabit)}
          onClose={() => setEditingHabit(null)}
          onSave={handleSaveEdit}
          isSaving={isSavingEdit}
        />
      </main>
    </div>
  );
}

export default App;