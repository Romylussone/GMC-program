function Filter({
  titleFilter,
  ratingFilter,
  onTitleFilterChange,
  onRatingFilterChange,
}) {
  return (
    <aside className="filter-panel">
      <h2>Filter</h2>
      <label>
        Title
        <input
          type="search"
          value={titleFilter}
          onChange={(event) => onTitleFilterChange(event.target.value)}
          placeholder="Search by title"
        />
      </label>

      <label>
        Minimum rating
        <input
          type="range"
          min="0"
          max="10"
          value={ratingFilter}
          onChange={(event) => onRatingFilterChange(Number(event.target.value))}
        />
      </label>

      <div className="rating-readout">{ratingFilter}/10</div>
    </aside>
  );
}

export default Filter;
