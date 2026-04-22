import { Settings, X } from 'lucide-react';
import { useState } from 'react';
import { AppSettings, ViewMode, SortOption, ThumbnailSize } from '../types';

interface Props {
  settings: AppSettings;
  onUpdate: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
}

export function SettingsPanel({ settings, onUpdate }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="settings-trigger"
        onClick={() => setOpen(true)}
        title="Settings"
      >
        <Settings size={16} />
      </button>

      {open && (
        <div className="settings-overlay" onClick={() => setOpen(false)}>
          <div className="settings-panel" onClick={e => e.stopPropagation()}>
            <div className="settings-header">
              <span className="settings-title">Settings</span>
              <button className="settings-close" onClick={() => setOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="settings-body">
              <label className="settings-row">
                <span>Include Updates files</span>
                <input
                  type="checkbox"
                  checked={settings.includeUpdates}
                  onChange={e => onUpdate('includeUpdates', e.target.checked)}
                />
              </label>

              <label className="settings-row">
                <span>Show empty groups</span>
                <input
                  type="checkbox"
                  checked={settings.showEmptyGroups}
                  onChange={e => onUpdate('showEmptyGroups', e.target.checked)}
                />
              </label>

              <div className="settings-row">
                <span>Default view</span>
                <select
                  value={settings.defaultView}
                  onChange={e => onUpdate('defaultView', e.target.value as ViewMode)}
                  className="settings-select"
                >
                  <option value="grid">Grid</option>
                  <option value="list">List</option>
                </select>
              </div>

              <div className="settings-row">
                <span>Default sort</span>
                <select
                  value={settings.defaultSort}
                  onChange={e => onUpdate('defaultSort', e.target.value as SortOption)}
                  className="settings-select"
                >
                  <option value="name">Name</option>
                  <option value="date">Date</option>
                  <option value="size">Size</option>
                  <option value="type">Type</option>
                </select>
              </div>

              <div className="settings-row">
                <span>Thumbnail size</span>
                <select
                  value={settings.thumbnailSize}
                  onChange={e => onUpdate('thumbnailSize', e.target.value as ThumbnailSize)}
                  className="settings-select"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
