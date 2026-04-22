import { useEffect, useRef } from 'react';
import { Search, LayoutGrid, List } from 'lucide-react';
import { SortOption, ViewMode } from '../types';
import { SourceFilter } from './SourceFilter';

interface Props {
  search: string;
  onSearchChange: (value: string) => void;
  sortBy: SortOption;
  onSortChange: (value: SortOption) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  includeUpdates: boolean;
  onIncludeUpdatesChange: (value: boolean) => void;
  availableSources: string[];
  selectedSources: string[];
  onSelectedSourcesChange: (sources: string[]) => void;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'date', label: 'Date (Newest)' },
  { value: 'size', label: 'Size (Largest)' },
  { value: 'type', label: 'Type (Ext)' },
];

export function Toolbar({
  search, onSearchChange,
  sortBy, onSortChange,
  viewMode, onViewModeChange,
  includeUpdates, onIncludeUpdatesChange,
  availableSources, selectedSources, onSelectedSourcesChange,
}: Props) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleSearch = (value: string) => {
    if (inputRef.current) inputRef.current.value = value;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onSearchChange(value), 200);
  };

  return (
    <div className="toolbar-wrapper">
      <div className="toolbar">
        <div className="toolbar-search">
          <Search size={16} className="toolbar-search-icon" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search files..."
            defaultValue={search}
            onChange={e => handleSearch(e.target.value)}
            className="toolbar-search-input"
          />
        </div>

        <select
          value={sortBy}
          onChange={e => onSortChange(e.target.value as SortOption)}
          className="toolbar-select"
        >
          {SORT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <SourceFilter
          sources={availableSources}
          selected={selectedSources}
          onChange={onSelectedSourcesChange}
        />

        <div className="toolbar-view-toggle">
          <button
            className={`toolbar-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => onViewModeChange('grid')}
            title="Grid view"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            className={`toolbar-view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => onViewModeChange('list')}
            title="List view"
          >
            <List size={16} />
          </button>
        </div>

        <label className="toolbar-toggle" title="Include files from Updates">
          <input
            type="checkbox"
            checked={includeUpdates}
            onChange={e => onIncludeUpdatesChange(e.target.checked)}
          />
          <span className="toolbar-toggle-label">Updates</span>
        </label>
      </div>
    </div>
  );
}
