import { useState } from 'react';
import { ChevronDown, ChevronRight, ArrowUpDown } from 'lucide-react';
import { FileItem, FileGroup as FileGroupType, ViewMode, ThumbnailSize, SortConfig, SortOption } from '../types';
import { GROUP_LABELS, GROUP_COLORS } from '../utils/fileTypes';
import { sortFilesWithConfig, getDefaultDir } from '../utils/sort';
import { FileCard } from './FileCard';
import { FileRow } from './FileRow';

const SORT_CYCLE: SortOption[] = ['name', 'date', 'size', 'type'];
const SORT_LABELS: Record<SortOption, string> = {
  name: 'Name',
  date: 'Date',
  size: 'Size',
  type: 'Type',
};

interface Props {
  group: FileGroupType;
  files: FileItem[];
  viewMode: ViewMode;
  thumbnailSize?: ThumbnailSize;
  groupSort?: SortConfig;
  onGroupSortChange?: (group: FileGroupType, sort: SortConfig | undefined) => void;
  selectedIds?: Set<string>;
  onSelect?: (id: string) => void;
  onPreview?: (file: FileItem) => void;
}

export function FileGroup({
  group, files, viewMode, thumbnailSize,
  groupSort, onGroupSortChange,
  selectedIds, onSelect, onPreview,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);

  const sortedFiles = groupSort ? sortFilesWithConfig(files, groupSort) : files;

  const handleGroupSort = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onGroupSortChange) return;

    if (!groupSort) {
      // Start cycling from the first option
      onGroupSortChange(group, { by: 'name', dir: 'asc' });
      return;
    }

    const currentIdx = SORT_CYCLE.indexOf(groupSort.by);
    // Second click on same field flips direction
    // But we track this via cycling: clicking the sort button advances to next field
    const nextIdx = (currentIdx + 1) % SORT_CYCLE.length;
    const nextBy = SORT_CYCLE[nextIdx];
    onGroupSortChange(group, { by: nextBy, dir: getDefaultDir(nextBy) });
  };

  const handleDirToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!groupSort || !onGroupSortChange) return;
    onGroupSortChange(group, {
      by: groupSort.by,
      dir: groupSort.dir === 'asc' ? 'desc' : 'asc',
    });
  };

  if (files.length === 0) {
    return (
      <div className="file-group">
        <button className="file-group-header" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
          <span className="file-group-label" style={{ color: GROUP_COLORS[group] }}>
            {GROUP_LABELS[group]}
          </span>
          <span className="file-group-count">0</span>
        </button>
      </div>
    );
  }

  return (
    <div className="file-group">
      <div className="file-group-header-row">
        <button className="file-group-header" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
          <span className="file-group-label" style={{ color: GROUP_COLORS[group] }}>
            {GROUP_LABELS[group]}
          </span>
          <span className="file-group-count">{files.length}</span>
        </button>

        {onGroupSortChange && (
          <div className="group-sort">
            <button
              className={`group-sort-btn ${groupSort ? 'active' : ''}`}
              onClick={handleGroupSort}
              title="Cycle sort field"
            >
              <ArrowUpDown size={12} />
              {groupSort ? SORT_LABELS[groupSort.by] : 'Sort'}
            </button>
            {groupSort && (
              <button
                className="group-sort-dir"
                onClick={handleDirToggle}
                title="Toggle direction"
              >
                {groupSort.dir === 'asc' ? '↑' : '↓'}
              </button>
            )}
          </div>
        )}
      </div>

      {!collapsed && (
        <div className={viewMode === 'grid' ? 'file-grid' : 'file-list'}>
          {sortedFiles.map(file =>
            viewMode === 'grid'
              ? <FileCard
                  key={file.id}
                  file={file}
                  thumbnailSize={thumbnailSize}
                  selected={selectedIds?.has(file.id)}
                  onSelect={onSelect}
                  onPreview={onPreview}
                />
              : <FileRow
                  key={file.id}
                  file={file}
                  selected={selectedIds?.has(file.id)}
                  onSelect={onSelect}
                  onPreview={onPreview}
                />
          )}
        </div>
      )}
    </div>
  );
}
