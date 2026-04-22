import { Download, Copy, Check } from 'lucide-react';
import { FileItem } from '../types';
import { FileTypeIcon } from './FileTypeIcon';
import { formatBytes, formatDate } from '../utils/formatters';
import { downloadFile } from '../utils/download';
import { copyFileLink } from '../utils/clipboard';

interface Props {
  file: FileItem;
  selected?: boolean;
  onSelect?: (id: string) => void;
  onPreview?: (file: FileItem) => void;
}

export function FileRow({ file, selected, onSelect, onPreview }: Props) {
  const handleClick = () => {
    if (file.group === 'image' || file.group === 'pdf') {
      onPreview?.(file);
    } else {
      window.open(file.url, '_blank', 'noopener');
    }
  };

  const handleCheckbox = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.(file.id);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    downloadFile(file);
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    copyFileLink(file);
  };

  return (
    <div className={`file-row ${selected ? 'selected' : ''}`} onClick={handleClick} title={file.name}>
      {onSelect && (
        <div className={`file-row-checkbox ${selected ? 'visible' : ''}`} onClick={handleCheckbox}>
          {selected ? <Check size={14} /> : <div className="checkbox-empty" />}
        </div>
      )}
      <FileTypeIcon group={file.group} size={28} />
      <span className="file-row-name">{file.name}</span>
      <span className="file-row-size">{formatBytes(file.size)}</span>
      <span className="file-row-date">{formatDate(file.createdAt)}</span>
      <span className="file-row-source">{file.source}</span>
      {file.url && (
        <button className="file-row-action" onClick={handleCopy} title="Copy link">
          <Copy size={14} />
        </button>
      )}
      {file.url && (
        <button className="file-row-action" onClick={handleDownload} title="Download">
          <Download size={14} />
        </button>
      )}
    </div>
  );
}
