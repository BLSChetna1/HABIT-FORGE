import { AVAILABLE_ICONS, AVAILABLE_CATEGORIES } from "../utils/constants";

function HabitForm({
  showForm,
  onToggleForm,
  name,
  onNameChange,
  icon,
  onIconChange,
  category,
  onCategoryChange,
  onSubmit,
  isSubmitting
}) {
  function handleFormSubmit(e) {
    e.preventDefault();
    onSubmit();
  }

  return (
    <>
      <button
        className="add-button"
        onClick={onToggleForm}
        type="button"
      >
        {showForm ? "✕ Cancel" : "+ Add Habit"}
      </button>

      {showForm && (
        <form className="habit-form" onSubmit={handleFormSubmit}>
          <h2>Add New Habit</h2>
          <div>
            <p>Choose an icon:</p>

            <div className="icon-selector">
              {AVAILABLE_ICONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => onIconChange(emoji)}
                  disabled={isSubmitting}
                  className={`icon-btn ${icon === emoji ? "selected" : ""}`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            <div>
              <p>Choose a category:</p>

              <select
                value={category}
                onChange={(e) => onCategoryChange(e.target.value)}
                disabled={isSubmitting}
              >
                {AVAILABLE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <input
            type="text"
            placeholder="Habit name (e.g. Drink 2L water)"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            disabled={isSubmitting}
            required
            autoFocus
          />

          <button type="submit" disabled={isSubmitting || !name.trim()}>
            {isSubmitting ? "Adding..." : "Add Habit"}
          </button>
        </form>
      )}
    </>
  );
}

export default HabitForm;
