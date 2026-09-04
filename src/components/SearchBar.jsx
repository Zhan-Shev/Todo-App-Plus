function SearchBar({ value, onChange }) {
  return (
    <div className="search-bar">
      <label className="search-field">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="search-icon"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>

        <span className="sr-only"></span>
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search tasks..."
          className="search-input"
        />
      </label>
    </div>
  )
}

export default SearchBar