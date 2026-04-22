export type FileGroup = 'image' | 'pdf' | 'document' | 'video' | 'audio' | 'archive' | 'other';

export interface FileItem {
  id: string;
  name: string;
  url: string;
  publicUrl?: string;
  size: number;
  createdAt: string;
  extension: string;
  mimeType?: string;
  source: string;
  columnId?: string;
  group: FileGroup;
}

export type SortOption = 'name' | 'date' | 'size' | 'type';
export type ViewMode = 'grid' | 'list';

export type ThumbnailSize = 'small' | 'medium' | 'large';

export interface AppSettings {
  includeUpdates: boolean;
  defaultView: ViewMode;
  defaultSort: SortOption;
  showEmptyGroups: boolean;
  thumbnailSize: ThumbnailSize;
}

export const DEFAULT_SETTINGS: AppSettings = {
  includeUpdates: true,
  defaultView: 'grid',
  defaultSort: 'date',
  showEmptyGroups: false,
  thumbnailSize: 'medium',
};

export interface MondayContext {
  itemId?: number;
  boardId?: number;
}

export interface BoardColumn {
  id: string;
  title: string;
  type: string;
}

export interface MondayUpdateAsset {
  id: string;
  name: string;
  url: string;
  public_url: string | null;
  file_size: number;
  created_at: string;
  file_extension: string;
}

export interface MondayUpdate {
  id: string;
  created_at: string;
  assets: MondayUpdateAsset[];
}

export interface SortConfig {
  by: SortOption;
  dir: 'asc' | 'desc';
}

export interface PreviewState {
  file: FileItem | null;
  navigableFiles: FileItem[];
}
