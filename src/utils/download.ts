import { zip } from 'fflate';
import { FileItem } from '../types';

export async function downloadFile(file: FileItem) {
  if (!file.url) return;
  try {
    const response = await fetch(file.url);
    if (!response.ok) throw new Error('Failed to fetch');
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(blobUrl);
  } catch {
    window.open(file.url, '_blank', 'noopener');
  }
}

export interface ZipProgress {
  status: 'fetching' | 'zipping' | 'done' | 'error';
  fetched: number;
  total: number;
  skipped: number;
}

export async function downloadZip(
  files: FileItem[],
  onProgress?: (progress: ZipProgress) => void,
): Promise<void> {
  const total = files.length;
  let fetched = 0;
  let skipped = 0;

  onProgress?.({ status: 'fetching', fetched: 0, total, skipped: 0 });

  const results = await Promise.allSettled(
    files.map(async f => {
      const res = await fetch(f.url);
      if (!res.ok) throw new Error(`Failed to fetch ${f.name}`);
      const buf = await res.arrayBuffer();
      fetched++;
      onProgress?.({ status: 'fetching', fetched, total, skipped });
      return { name: f.name, data: new Uint8Array(buf) };
    }),
  );

  const fetched_files: { name: string; data: Uint8Array }[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') {
      fetched_files.push(r.value);
    } else {
      skipped++;
    }
  }

  if (fetched_files.length === 0) {
    onProgress?.({ status: 'error', fetched, total, skipped });
    return;
  }

  onProgress?.({ status: 'zipping', fetched, total, skipped });

  const input: Record<string, Uint8Array> = {};
  const nameCounts: Record<string, number> = {};

  for (const f of fetched_files) {
    const count = nameCounts[f.name] ?? 0;
    nameCounts[f.name] = count + 1;
    const key = count === 0 ? f.name : f.name.replace(/(\.[^.]+)$/, `_${count}$1`);
    input[key] = f.data;
  }

  return new Promise<void>((resolve, reject) => {
    zip(input, (err, data) => {
      if (err) {
        onProgress?.({ status: 'error', fetched, total, skipped });
        reject(err);
        return;
      }
      const blob = new Blob([data as unknown as BlobPart], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'monday-files.zip';
      a.click();
      URL.revokeObjectURL(url);
      onProgress?.({ status: 'done', fetched, total, skipped });
      resolve();
    });
  });
}
