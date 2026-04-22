import { useEffect, useState, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { FileItem, PreviewState } from '../types';
import { formatBytes, formatDate } from '../utils/formatters';
import { downloadFile } from '../utils/download';

interface Props {
  preview: PreviewState;
  onClose: () => void;
  onNavigate: (file: FileItem) => void;
}

export function PreviewOverlay({ preview, onClose, onNavigate }: Props) {
  const { file, navigableFiles } = preview;
  if (!file) return null;

  const isImage = file.group === 'image';
  const isPdf = file.group === 'pdf';

  if (isImage) {
    return (
      <ImagePreview
        file={file}
        navigableFiles={navigableFiles}
        onClose={onClose}
        onNavigate={onNavigate}
      />
    );
  }

  if (isPdf) {
    return (
      <PdfPreview file={file} onClose={onClose} />
    );
  }

  return null;
}

/* ─── Image Preview ─── */

function ImagePreview({
  file,
  navigableFiles,
  onClose,
  onNavigate,
}: {
  file: FileItem;
  navigableFiles: FileItem[];
  onClose: () => void;
  onNavigate: (file: FileItem) => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const currentIndex = navigableFiles.findIndex(f => f.id === file.id);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) onNavigate(navigableFiles[currentIndex - 1]);
  }, [currentIndex, navigableFiles, onNavigate]);

  const goNext = useCallback(() => {
    if (currentIndex < navigableFiles.length - 1) onNavigate(navigableFiles[currentIndex + 1]);
  }, [currentIndex, navigableFiles, onNavigate]);

  useEffect(() => {
    setLoaded(false);
  }, [file.id]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, goPrev, goNext]);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    downloadFile(file);
  };

  return (
    <div className="preview-overlay" onClick={onClose}>
      <div className="preview-topbar">
        <span className="preview-filename">{file.name}</span>
        <button className="preview-close" onClick={onClose}><X size={20} /></button>
      </div>

      <div className="preview-body" onClick={e => e.stopPropagation()}>
        {currentIndex > 0 && (
          <button className="preview-nav preview-nav-left" onClick={goPrev}>
            <ChevronLeft size={28} />
          </button>
        )}

        <div className="preview-image-wrap">
          {!loaded && <div className="spinner" />}
          <img
            src={file.url}
            alt={file.name}
            className={`preview-image ${loaded ? 'loaded' : 'hidden'}`}
            onLoad={() => setLoaded(true)}
          />
        </div>

        {currentIndex < navigableFiles.length - 1 && (
          <button className="preview-nav preview-nav-right" onClick={goNext}>
            <ChevronRight size={28} />
          </button>
        )}
      </div>

      <div className="preview-bottombar" onClick={e => e.stopPropagation()}>
        <span>{formatBytes(file.size)}</span>
        <span>{formatDate(file.createdAt)}</span>
        <span>{file.source}</span>
        {navigableFiles.length > 1 && (
          <span>{currentIndex + 1} / {navigableFiles.length}</span>
        )}
        <button className="preview-download-btn" onClick={handleDownload}>
          <Download size={14} /> Download
        </button>
      </div>
    </div>
  );
}

/* ─── PDF Preview ─── */
/* Strategy: Option A (native iframe) tried first. If CSP blocks it, falls back to
   Option C (open in new tab button). PDF.js (Option B) not bundled to keep size small. */

function PdfPreview({
  file,
  onClose,
}: {
  file: FileItem;
  onClose: () => void;
}) {
  const [iframeError, setIframeError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Detect iframe load failure via a timeout — if contentDocument is inaccessible after load
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const iframe = iframeRef.current;
        if (iframe && !iframe.contentDocument?.body?.childElementCount) {
          setIframeError(true);
        }
      } catch {
        // Cross-origin — means it loaded (the PDF viewer is on a different origin)
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [file.url]);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    downloadFile(file);
  };

  return (
    <div className="preview-overlay" onClick={onClose}>
      <div className="preview-topbar">
        <span className="preview-filename">{file.name}</span>
        <button className="preview-close" onClick={onClose}><X size={20} /></button>
      </div>

      <div className="preview-pdf-body" onClick={e => e.stopPropagation()}>
        {iframeError ? (
          <div className="preview-pdf-fallback">
            <p>Inline PDF preview is not available.</p>
            <button
              className="preview-pdf-open-btn"
              onClick={() => window.open(file.url, '_blank', 'noopener')}
            >
              Open PDF in New Tab
            </button>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            src={file.url}
            className="preview-pdf-iframe"
            title={file.name}
          />
        )}
      </div>

      <div className="preview-bottombar" onClick={e => e.stopPropagation()}>
        <span>{formatBytes(file.size)}</span>
        <span>{formatDate(file.createdAt)}</span>
        <span>{file.source}</span>
        <button className="preview-download-btn" onClick={handleDownload}>
          <Download size={14} /> Download
        </button>
      </div>
    </div>
  );
}
