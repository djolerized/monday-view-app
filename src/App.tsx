import { useState, useCallback, useEffect } from 'react';
import { useMonday } from './hooks/useMonday';
import { useItemFiles } from './hooks/useItemFiles';
import { useFileFilters } from './hooks/useFileFilters';
import { useSettings } from './hooks/useSettings';
import { FileItem, PreviewState } from './types';
import { Toolbar } from './components/Toolbar';
import { MetaSummary } from './components/MetaSummary';
import { FileGroup } from './components/FileGroup';
import { EmptyState } from './components/EmptyState';
import { SettingsPanel } from './components/SettingsPanel';
import { SelectionBar } from './components/SelectionBar';
import { PreviewOverlay } from './components/PreviewOverlay';
import { ToastContainer, showToast } from './components/Toast';
import { downloadZip, ZipProgress } from './utils/download';

export default function App() {
  const { context, loading: ctxLoading } = useMonday();
  const { settings, loaded: settingsLoaded, updateSetting } = useSettings();
  const { files, loading: filesLoading, error, updatesWarning, retry } = useItemFiles(
    context.itemId,
    context.boardId,
  );
  const {
    search, setSearch,
    sortBy, setSortBy,
    viewMode, setViewMode,
    selectedSources, setSelectedSources,
    availableSources,
    filtered, grouped, groupCounts, totalCount,
    groupSorts, setGroupSort,
  } = useFileFilters(files, settings.defaultView, settings.defaultSort, settings.showEmptyGroups);

  // ── Selection state ──
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [zipProgress, setZipProgress] = useState<ZipProgress | null>(null);

  // Reset selection on item change or search/filter change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [files, search, selectedSources]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(filtered.map(f => f.id)));
  }, [filtered]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleDownloadZip = useCallback(async () => {
    const selected = filtered.filter(f => selectedIds.has(f.id) && f.url);
    if (selected.length === 0) return;
    try {
      await downloadZip(selected, setZipProgress);
      const skipped = zipProgress?.skipped ?? 0;
      if (skipped > 0) {
        showToast(`${skipped} file${skipped !== 1 ? 's' : ''} could not be included.`);
      }
    } catch {
      showToast('Failed to create ZIP file.');
    }
    setZipProgress(null);
  }, [filtered, selectedIds]);

  // ── Preview state ──
  const [preview, setPreview] = useState<PreviewState>({ file: null, navigableFiles: [] });

  const openPreview = useCallback((file: FileItem) => {
    const navigable = filtered.filter(f => f.group === file.group);
    setPreview({ file, navigableFiles: navigable });
  }, [filtered]);

  const closePreview = useCallback(() => {
    setPreview({ file: null, navigableFiles: [] });
  }, []);

  const navigatePreview = useCallback((file: FileItem) => {
    setPreview(prev => ({ ...prev, file }));
  }, []);

  const loading = ctxLoading || filesLoading || !settingsLoaded;

  if (loading) return <EmptyState type="loading" />;
  if (error) return <EmptyState type="error" onRetry={retry} />;

  return (
    <div id="app-root" className="app" style={{ position: 'relative', minHeight: '100vh' }}>
      <div className="app-header">
        <Toolbar
          search={search}
          onSearchChange={setSearch}
          sortBy={sortBy}
          onSortChange={setSortBy}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          includeUpdates={settings.includeUpdates}
          onIncludeUpdatesChange={v => updateSetting('includeUpdates', v)}
          availableSources={availableSources}
          selectedSources={selectedSources}
          onSelectedSourcesChange={setSelectedSources}
        />
        <SettingsPanel settings={settings} onUpdate={updateSetting} />
      </div>

      {updatesWarning && (
        <div className="toast-warning">{updatesWarning}</div>
      )}

      <SelectionBar
        selectedCount={selectedIds.size}
        totalCount={filtered.length}
        onSelectAll={selectAll}
        onClear={clearSelection}
        onDownloadZip={handleDownloadZip}
        zipProgress={zipProgress}
      />

      {files.length === 0 ? (
        <EmptyState type="empty" />
      ) : totalCount === 0 ? (
        <EmptyState type="no-results" onClearSearch={() => setSearch('')} />
      ) : (
        <>
          <MetaSummary totalCount={totalCount} groupCounts={groupCounts} />
          {grouped.map(({ group, files: groupFiles }) => (
            <FileGroup
              key={group}
              group={group}
              files={groupFiles}
              viewMode={viewMode}
              thumbnailSize={settings.thumbnailSize}
              groupSort={groupSorts[group]}
              onGroupSortChange={setGroupSort}
              selectedIds={selectedIds}
              onSelect={toggleSelect}
              onPreview={openPreview}
            />
          ))}
        </>
      )}

      {preview.file && (
        <PreviewOverlay
          preview={preview}
          onClose={closePreview}
          onNavigate={navigatePreview}
        />
      )}

      <ToastContainer />
    </div>
  );
}
