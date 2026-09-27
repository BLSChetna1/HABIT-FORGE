function HabitFilters({
  search,
  onSearchChange,
  filterCategory,
  onFilterCategoryChange
}) {
  return (
    <div className="search-filter">
      <input
        type="text"
        placeholder="🔎 Search habits..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      <select
        value={filterCategory}
        onChange={(e) => onFilterCategoryChange(e.target.value)}
      >
        <option value="All">All Categories</option>
        <option value="Personal">🌱 Personal</option>
        <option value="Study">📚 Study</option>
        <option value="Health">💪 Health</option>
        <option value="Mindfulness">🧘 Mindfulness</option>
        <option value="Productivity">💼 Productivity</option>
      </select>
    </div>
  );
}

export default HabitFilters;
