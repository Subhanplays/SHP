const Pagination = ({ page, pages, onPage }) => {
  if (!pages || pages <= 1) return null;

  const range = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(pages, page + 2);
  for (let i = start; i <= end; i++) range.push(i);

  const btnStyle = (active) => ({
    padding: '0.5rem 0.85rem',
    borderRadius: 'var(--radius-sm)',
    border: `1px solid ${active ? 'var(--primary-color)' : 'var(--glass-border)'}`,
    background: active ? 'var(--primary-color)' : 'transparent',
    color: active ? '#fff' : 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '0.85rem',
    transition: 'all var(--transition-fast)',
  });

  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
      {page > 1 && (
        <button style={btnStyle(false)} onClick={() => onPage(page - 1)}>
          Prev
        </button>
      )}
      {range.map((p) => (
        <button key={p} style={btnStyle(p === page)} onClick={() => onPage(p)}>
          {p}
        </button>
      ))}
      {page < pages && (
        <button style={btnStyle(false)} onClick={() => onPage(page + 1)}>
          Next
        </button>
      )}
    </div>
  );
};

export default Pagination;
