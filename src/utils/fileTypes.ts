import { FileGroup } from '../types';

export const EXT_TO_GROUP: Record<string, FileGroup> = {
  // Images
  jpg: 'image', jpeg: 'image', png: 'image', gif: 'image',
  webp: 'image', svg: 'image', bmp: 'image', ico: 'image', avif: 'image',
  // PDFs
  pdf: 'pdf',
  // Documents
  doc: 'document', docx: 'document',
  xls: 'document', xlsx: 'document',
  ppt: 'document', pptx: 'document',
  txt: 'document', rtf: 'document', csv: 'document', odt: 'document',
  // Videos
  mp4: 'video', mov: 'video', avi: 'video', mkv: 'video', webm: 'video',
  // Audio
  mp3: 'audio', wav: 'audio', ogg: 'audio', m4a: 'audio',
  // Archives
  zip: 'archive', rar: 'archive', tar: 'archive',
  gz: 'archive', '7z': 'archive', bz2: 'archive',
};

export const GROUP_LABELS: Record<FileGroup, string> = {
  image: 'Images',
  pdf: 'PDFs',
  document: 'Documents',
  video: 'Videos',
  audio: 'Audio',
  archive: 'Archives',
  other: 'Other',
};

export const GROUP_ORDER: FileGroup[] = [
  'image', 'pdf', 'document', 'video', 'audio', 'archive', 'other',
];

export const GROUP_ICONS: Record<FileGroup, string> = {
  image: '🖼',
  pdf: '📄',
  document: '📝',
  video: '🎬',
  audio: '🎵',
  archive: '📦',
  other: '📋',
};

export const GROUP_COLORS: Record<FileGroup, string> = {
  image: '#00c875',
  pdf: '#e2445c',
  document: '#0086c0',
  video: '#fdab3d',
  audio: '#a25ddc',
  archive: '#c4c4c4',
  other: '#999999',
};

function guessFromMime(mime?: string): FileGroup | undefined {
  if (!mime) return undefined;
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime === 'application/pdf') return 'pdf';
  if (mime.includes('zip') || mime.includes('tar') || mime.includes('gzip')) return 'archive';
  if (mime.startsWith('text/')) return 'document';
  return undefined;
}

export function getGroup(ext: string, mime?: string): FileGroup {
  const normalized = ext.toLowerCase().replace(/^\./, '');
  return EXT_TO_GROUP[normalized] ?? guessFromMime(mime) ?? 'other';
}
