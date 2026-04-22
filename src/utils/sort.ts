import { FileItem, SortOption, SortConfig } from '../types';

export function sortFiles(files: FileItem[], sortBy: SortOption): FileItem[] {
  return sortFilesWithConfig(files, { by: sortBy, dir: getDefaultDir(sortBy) });
}

export function sortFilesWithConfig(files: FileItem[], config: SortConfig): FileItem[] {
  const sorted = [...files];
  const dir = config.dir === 'asc' ? 1 : -1;
  switch (config.by) {
    case 'name':
      return sorted.sort((a, b) => dir * a.name.localeCompare(b.name));
    case 'date':
      return sorted.sort((a, b) => dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
    case 'size':
      return sorted.sort((a, b) => dir * (a.size - b.size));
    case 'type':
      return sorted.sort((a, b) => dir * a.extension.localeCompare(b.extension));
  }
}

export function getDefaultDir(sortBy: SortOption): 'asc' | 'desc' {
  switch (sortBy) {
    case 'name': return 'asc';
    case 'date': return 'desc';
    case 'size': return 'desc';
    case 'type': return 'asc';
  }
}
