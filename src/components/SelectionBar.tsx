import { Download, X } from 'lucide-react';
import { ZipProgress } from '../utils/download';

interface Props {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClear: () => void;
  onDownloadZip: () => void;
  zipProgress: ZipProgress | null;
}

export function SelectionBar({
  selectedCount,
  totalCount,
  onSelectAll,
  onClear,
  onDownloadZip,
  zipProgress,
}: Props) {
  if (selectedCount === 0) return null;

  const isBusy = zipProgress && (zipProgress.status === 'fetching' || zipProgress.status === 'zipping');

  return (
    <div className="selection-bar">
      <label className="selection-bar-all">
        <input
          type="checkbox"
          checked={selectedCount === totalCount}
          onChange={() => {
            if (selectedCount === totalCount) onClear();
            else onSelectAll();
          }}
        />
        {selectedCount === totalCount ? 'All selected' : 'Select all'}
      </label>

      <span className="selection-bar-count">
        {selectedCount} file{selectedCount !== 1 ? 's' : ''} selected
      </span>

      <button
        className="selection-bar-zip"
        onClick={onDownloadZip}
        disabled={!!isBusy}
      >
        {isBusy ? (
          <>
            <div className="spinner-sm" />
            {zipProgress!.status === 'fetching'
              ? `Preparing ${zipProgress!.fetched}/${zipProgress!.total}...`
              : 'Zipping...'}
          </>
        ) : (
          <>
            <Download size={14} />
            Download ZIP
          </>
        )}
      </button>

      <button className="selection-bar-clear" onClick={onClear}>
        <X size={14} /> Clear
      </button>
    </div>
  );
}
