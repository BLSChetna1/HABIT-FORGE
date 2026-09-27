import HabitCard from "./HabitCard";

function HabitList({
  habits,
  search,
  filterCategory,
  onCompleteHabit,
  onEditHabit,
  onDeleteHabit,
  processingHabitId
}) {
  const filteredHabits = habits
    .filter((habit) =>
      habit.name.toLowerCase().includes(search.toLowerCase())
    )
    .filter((habit) =>
      filterCategory === "All" ||
      (habit.category || "Personal") === filterCategory
    );

  if (filteredHabits.length === 0) {
    return (
      <div className="empty-habits">
        {habits.length === 0 ? (
          <p>🌱 You haven't added any habits yet. Click "+ Add Habit" below to get started!</p>
        ) : (
          <p>🔍 No habits match your search or filter criteria.</p>
        )}
      </div>
    );
  }

  return (
    <div className="habit-list">
      {filteredHabits.map((habit) => (
        <HabitCard
          key={habit.id}
          habit={habit}
          onComplete={onCompleteHabit}
          onEdit={onEditHabit}
          onDelete={onDeleteHabit}
          isProcessing={processingHabitId === habit.id}
        />
      ))}
    </div>
  );
}

export default HabitList;
