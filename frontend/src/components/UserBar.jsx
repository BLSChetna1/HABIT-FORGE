function UserBar({ user, onLogout }) {
  if (!user) return null;

  return (
    <div className="user-bar">
      <div className="user-info">
        <div className="user-avatar">
          {user.name ? user.name.charAt(0).toUpperCase() : "👤"}
        </div>
        <div>
          <span className="user-name">{user.name}</span>
          <span className="user-email">{user.email}</span>
        </div>
      </div>
      <button className="logout-button" onClick={onLogout} title="Sign Out">
        🚪 Logout
      </button>
    </div>
  );
}

export default UserBar;
