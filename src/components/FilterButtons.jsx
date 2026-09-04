function FilterButtons({ current, onChange }) {
  const filters = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' },
  ]

  return (
    <div className="flex gap-2">
      {filters.map((f) => (
        <button
          key={f.key}
          type="button"
          onClick={() => onChange(f.key)}
          className={`filter-button ${current === f.key ? 'is-active' : ''}`}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}

export default FilterButtons