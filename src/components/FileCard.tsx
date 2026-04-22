import { useState, useRef, useEffect } from 'react';
import { Download, Copy, Check } from 'lucide-react';
import { FileItem, ThumbnailSize } from '../types';
import { FileTypeIcon } from './FileTypeIcon';
import { formatBytes, formatDate } from '../utils/formatters';
import { downloadFile } from '../utils/download';
import { copyFileLink } from '../utils/clipboard';

const THUMB_ASPECT: Record<ThumbnailSize, string> = {
  small: '1 / 1',
  medium: '16 / 9',
  large: '4 / 3',
};

interface Props {
  file: FileItem;
  thumbnailSize?: ThumbnailSize;
  selected?: boolean;
  onSelect?: (id: string) => void;
  onPreview?: (file: FileItem) => void;
}

function ThumbnailOrIcon({ file, thumbnailSize = 'medium' }: { file: FileItem; thumbnailSize?: ThumbnailSize }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (file.group !== 'image') return;
    const img = imgRef.current;
    if (!img) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && imgRef.current) {
          imgRef.current.src = file.url;
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );
    observer.observe(img);
    return () => observer.disconnect();
  }, [file.url, file.group]);

  if (file.group !== 'image' || error) return <FileTypeIcon group={file.group} size={40} />;

  return (
    <div className="thumb-wrap" style={{ aspectRatio: THUMB_ASPECT[thumbnailSize] }}>
      {!loaded && <FileTypeIcon group={file.group} size={40} />}
      <img
        ref={imgRef}
        alt={file.name}
        className={`thumb ${loaded ? 'loaded' : 'hidden'}`}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </div>
  );
}

export function FileCard({ file, thumbnailSize, selected, onSelect, onPreview }: Props) {
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
    <div className={`file-card ${selected ? 'selected' : ''}`} onClick={handleClick} title={file.name}>
      {onSelect && (
        <div className={`file-card-checkbox ${selected ? 'visible' : ''}`} onClick={handleCheckbox}>
          {selected ? <Check size={14} /> : <div className="checkbox-empty" />}
        </div>
      )}
      <ThumbnailOrIcon file={file} thumbnailSize={thumbnailSize} />
      <div className={`file-card-actions ${selected ? 'visible' : ''}`}>
        {file.url && (
          <button className="file-card-action-btn" onClick={handleCopy} title="Copy link">
            <Copy size={14} />
          </button>
        )}
        {file.url && (
          <button className="file-card-action-btn" onClick={handleDownload} title="Download">
            <Download size={14} />
          </button>
        )}
      </div>
      <div className="file-card-name">{file.name}</div>
      <div className="file-card-meta">
        <span>{formatBytes(file.size)}</span>
        <span>{formatDate(file.createdAt)}</span>
      </div>
      <span className="file-card-source">{file.source}</span>
    </div>
  );
}
