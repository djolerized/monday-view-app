import { useState, useRef, useEffect } from 'react';
import { Filter, X } from 'lucide-react';

interface Props {
  sources: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export function SourceFilter({ sources, selected, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const toggle = (source: string) => {
    if (selected.includes(source)) {
      onChange(selected.filter(s => s !== source));
    } else {
      onChange([...selected, source]);
    }
  };

  if (sources.length <= 1) return null;

  return (
    <div className="source-filter" ref={ref}>
      <button
        className={`source-filter-btn ${selected.length > 0 ? 'active' : ''}`}
        onClick={() => setOpen(!open)}
        title="Filter by source"
      >
        <Filter size={14} />
        {selected.length > 0 && (
          <span className="source-filter-badge">{selected.length}</span>
        )}
      </button>

      {open && (
        <div className="source-filter-dropdown">
          <div className="source-filter-header">
            <span>Filter by source</span>
            {selected.length > 0 && (
              <button className="source-filter-clear" onClick={() => onChange([])}>
                Clear
              </button>
            )}
          </div>
          {sources.map(source => (
            <label key={source} className="source-filter-option">
              <input
                type="checkbox"
                checked={selected.includes(source)}
                onChange={() => toggle(source)}
              />
              <span>{source}</span>
            </label>
          ))}
        </div>
      )}

      {selected.length > 0 && (
        <div className="source-filter-chips">
          {selected.map(s => (
            <span key={s} className="source-filter-chip">
              {s}
              <button onClick={() => toggle(s)} className="source-filter-chip-remove">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
