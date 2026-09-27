function HabitCard({
  habit,
  onComplete,
  onEdit,
  onDelete,
  isProcessing
}) {
  return (
    <div className="habit-card">
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

      <div className="habit-card-actions">
        <button
          className={`complete-btn ${habit.done ? "completed" : ""}`}
          onClick={() => onComplete(habit.id)}
          disabled={habit.done || isProcessing}
        >
          {habit.done ? "✓ Completed" : "✓ Complete"}
        </button>
        <button
          className="edit-btn"
          onClick={() => onEdit(habit)}
          disabled={isProcessing}
        >
          ✏️ Edit
        </button>
        <button
          className="delete-btn"
          onClick={() => onDelete(habit.id)}
          disabled={isProcessing}
        >
          🗑 Delete
        </button>
      </div>
    </div>
  );
}

export default HabitCard;
