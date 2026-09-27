function BadgeGallery({ xp, hasSevenDayStreak }) {
  return (
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
  );
}

export default BadgeGallery;
