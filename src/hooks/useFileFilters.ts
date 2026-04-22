import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { FileItem, FileGroup, SortOption, SortConfig, ViewMode } from '../types';
import { sortFiles } from '../utils/sort';
import { GROUP_ORDER } from '../utils/fileTypes';

export function useFileFilters(files: FileItem[], defaultView: ViewMode = 'grid', defaultSort: SortOption = 'date', showEmptyGroups = false) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>(defaultSort);
  const [viewMode, setViewMode] = useState<ViewMode>(defaultView);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [groupSorts, setGroupSorts] = useState<Partial<Record<FileGroup, SortConfig>>>({});
  const prevItemFiles = useRef(files);

  // Reset source filter when the file list identity changes (new item)
  useEffect(() => {
    if (prevItemFiles.current !== files) {
      prevItemFiles.current = files;
      setSelectedSources([]);
    }
  }, [files]);

  // Reset group sorts when global sort changes
  useEffect(() => {
    setGroupSorts({});
  }, [sortBy]);

  const handleSetViewMode = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('fileViewer:viewMode', mode);
    } catch { /* ignore */ }
  }, []);

  const setGroupSort = useCallback((group: FileGroup, sort: SortConfig | undefined) => {
    setGroupSorts(prev => {
      const next = { ...prev };
      if (sort) next[group] = sort;
      else delete next[group];
      return next;
    });
  }, []);

  const availableSources = useMemo(() => {
    const sources = new Set(files.map(f => f.source));
    return Array.from(sources).sort();
  }, [files]);

  const filtered = useMemo(() => {
    let result = files;
    if (selectedSources.length > 0) {
      result = result.filter(f => selectedSources.includes(f.source));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(f => f.name.toLowerCase().includes(q));
    }
    return sortFiles(result, sortBy);
  }, [files, selectedSources, search, sortBy]);

  const grouped = useMemo(() => {
    const map = new Map<FileGroup, FileItem[]>();
    for (const file of filtered) {
      const list = map.get(file.group);
      if (list) list.push(file);
      else map.set(file.group, [file]);
    }
    return GROUP_ORDER
      .filter(g => showEmptyGroups || map.has(g))
      .map(g => ({ group: g, files: map.get(g) ?? [] }));
  }, [filtered, showEmptyGroups]);

  const groupCounts = useMemo(() => {
    const counts: Partial<Record<FileGroup, number>> = {};
    for (const file of filtered) {
      counts[file.group] = (counts[file.group] ?? 0) + 1;
    }
    return counts;
  }, [filtered]);

  return {
    search,
    setSearch,
    sortBy,
    setSortBy,
    viewMode,
    setViewMode: handleSetViewMode,
    selectedSources,
    setSelectedSources,
    availableSources,
    filtered,
    grouped,
    groupCounts,
    totalCount: filtered.length,
    groupSorts,
    setGroupSort,
  };
}
