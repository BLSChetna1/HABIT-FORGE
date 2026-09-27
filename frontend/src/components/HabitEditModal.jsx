import { useState } from "react";
import { AVAILABLE_ICONS, AVAILABLE_CATEGORIES } from "../utils/constants";

function HabitEditModal({ habit, isOpen, onClose, onSave, isSaving }) {
  const [name, setName] = useState(habit?.name || "");
  const [icon, setIcon] = useState(habit?.icon || "⭐");
  const [category, setCategory] = useState(habit?.category || "Personal");
  const [error, setError] = useState("");

  if (!isOpen || !habit) {
    return null;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a habit name");
      return;
    }

    onSave({
      id: habit.id,
      name: name.trim(),
      icon,
      category
    });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>✏️ Edit Habit</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Habit Name</label>
            <input
              type="text"
              placeholder="e.g. Morning Jog"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError("");
              }}
              disabled={isSaving}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Choose Icon</label>
            <div className="icon-selector">
              {AVAILABLE_ICONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  disabled={isSaving}
                  className={`icon-btn ${icon === emoji ? "selected" : ""}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isSaving}
            >
              {AVAILABLE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="save-button"
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default HabitEditModal;
