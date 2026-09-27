function DailyProgressCard({
  totalHabits,
  completedHabits,
  progress,
  message
}) {
  return (
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

      {progress === 100 && (
        <p>
          🎉 Amazing! You completed all your habits today!
        </p>
      )}
    </div>
  );
}

export default DailyProgressCard;
