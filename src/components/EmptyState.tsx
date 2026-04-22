interface Props {
  type: 'loading' | 'empty' | 'no-results' | 'error';
  onRetry?: () => void;
  onClearSearch?: () => void;
}

export function EmptyState({ type, onRetry, onClearSearch }: Props) {
  switch (type) {
    case 'loading':
      return (
        <div className="empty-state">
          <div className="spinner" />
          <p>Loading files...</p>
        </div>
      );
    case 'empty':
      return (
        <div className="empty-state">
          <p>This item has no files attached.</p>
        </div>
      );
    case 'no-results':
      return (
        <div className="empty-state">
          <p>No files match your search.</p>
          {onClearSearch && (
            <button className="empty-state-btn" onClick={onClearSearch}>Clear search</button>
          )}
        </div>
      );
    case 'error':
      return (
        <div className="empty-state">
          <p>Failed to load files. Check permissions.</p>
          {onRetry && (
            <button className="empty-state-btn" onClick={onRetry}>Retry</button>
          )}
        </div>
      );
  }
}
