function XPLevelCard({ level, currentLevelXP, xp }) {
  return (
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
  );
}

export default XPLevelCard;
