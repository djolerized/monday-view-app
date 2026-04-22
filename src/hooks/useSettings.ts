import { useState, useEffect, useCallback } from 'react';
import monday from '../api/monday';
import { AppSettings, DEFAULT_SETTINGS, ViewMode, SortOption, ThumbnailSize } from '../types';

const STORAGE_KEYS: Record<keyof AppSettings, string> = {
  includeUpdates: 'fileviewer_include_updates',
  defaultView: 'fileviewer_default_view',
  defaultSort: 'fileviewer_default_sort',
  showEmptyGroups: 'fileviewer_show_empty_groups',
  thumbnailSize: 'fileviewer_thumb_size',
};

async function loadSettings(): Promise<AppSettings> {
  const settings = { ...DEFAULT_SETTINGS };
  try {
    const results = await Promise.all(
      Object.entries(STORAGE_KEYS).map(async ([key, storageKey]) => {
        const { data } = await monday.storage.instance.getItem(storageKey);
        return [key, data.value] as const;
      })
    );
    for (const [key, value] of results) {
      if (value === null) continue;
      switch (key) {
        case 'includeUpdates':
        case 'showEmptyGroups':
          (settings as Record<string, unknown>)[key] = value === 'true';
          break;
        case 'defaultView':
          settings.defaultView = value as ViewMode;
          break;
        case 'defaultSort':
          settings.defaultSort = value as SortOption;
          break;
        case 'thumbnailSize':
          settings.thumbnailSize = value as ThumbnailSize;
          break;
      }
    }
  } catch (err) {
    console.error('Failed to load settings:', err);
  }
  return settings;
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadSettings().then(s => {
      setSettings(s);
      setLoaded(true);
    });
  }, []);

  const updateSetting = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    const storageKey = STORAGE_KEYS[key];
    monday.storage.instance.setItem(storageKey, String(value)).catch(err => {
      console.error(`Failed to persist setting ${key}:`, err);
    });
  }, []);

  return { settings, loaded, updateSetting };
}
