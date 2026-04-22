# Monday.com Item View — File Browser App

## Project Overview

Custom Monday.com Item View app that displays all files attached to an item (from File columns and optionally from Update section) in a structured, searchable, sortable UI grouped by file type.

Goal: Better UX than native Files tab — group by MIME type, search, sort, open — all without leaving monday.com.

---

## Tech Stack

- **Framework**: React 18 + TypeScript
- **Bundler**: Vite (CRA is deprecated; Vite is faster and simpler)
- **Monday SDK**: `monday-sdk-js` for context + API calls
- **UI**: Monday Vibe Design System (`monday-ui-react-core`) OR custom CSS (see notes below)
- **Icons**: `monday-ui-react-core/icons` or `lucide-react`
- **Linting**: ESLint + Prettier

> NOTE: monday-ui-react-core has peer dependency requirements (React 18). If version conflicts arise, fall back to plain CSS using Monday's CSS variable tokens.

---

## Project Structure

```
monday-file-viewer/
├── public/
│   └── index.html
├── src/
│   ├── main.tsx               # Entry point
│   ├── App.tsx                # Root component, context loader
│   ├── api/
│   │   ├── monday.ts          # monday-sdk-js instance (singleton)
│   │   └── queries.ts         # All GraphQL query strings
│   ├── hooks/
│   │   ├── useMonday.ts       # Context subscription hook
│   │   ├── useItemFiles.ts    # Main data fetching hook
│   │   └── useFileFilters.ts  # Search + sort + group logic
│   ├── components/
│   │   ├── Toolbar.tsx        # Search input, sort select, view toggle
│   │   ├── MetaSummary.tsx    # File count chips per type
│   │   ├── FileGroup.tsx      # Collapsible group container
│   │   ├── FileCard.tsx       # Grid card for a single file
│   │   ├── FileRow.tsx        # List row for a single file
│   │   ├── FileTypeIcon.tsx   # Icon + color based on mime/ext
│   │   └── EmptyState.tsx     # No files / loading / error states
│   ├── utils/
│   │   ├── fileTypes.ts       # MIME → group mapping, icons, colors
│   │   ├── formatters.ts      # formatBytes, formatDate
│   │   └── sort.ts            # Sort functions by name/date/size/type
│   ├── types/
│   │   └── index.ts           # TypeScript interfaces
│   └── styles/
│       └── main.css           # Global styles using Monday CSS vars
├── vite.config.ts
├── tsconfig.json
├── package.json
└── CLAUDE.md                  # This file
```

---

## Monday App Setup

### App Type
- **Board View**: No — this is an **Item View** (opens when user clicks an item row)
- In Monday Developer Center: App > Features > Item View
- Tunnel during dev: `npx monday-tunnel` or `ngrok http 5173`

### Required Scopes (OAuth)
```
me:read
boards:read
assets:read
updates:read   (only if Updates files enabled)
```

### monday-sdk-js initialization

```typescript
// src/api/monday.ts
import mondaySdk from 'monday-sdk-js';
const monday = mondaySdk();
monday.setApiVersion("2024-01");
export default monday;
```

---

## Data Flow

### 1. Get context on mount

```typescript
monday.listen("context", (res) => {
  const { itemId, boardId } = res.data;
  // trigger data fetch
});
```

### 2. Fetch board columns (find File columns)

```graphql
query GetBoardColumns($boardId: ID!) {
  boards(ids: [$boardId]) {
    columns {
      id
      title
      type  # filter for type == "file"
    }
  }
}
```

### 3. Fetch item column values for file columns

```graphql
query GetItemFiles($itemId: ID!) {
  items(ids: [$itemId]) {
    column_values {
      id
      type
      ... on FileValue {
        files {
          ... on FileAssetValue {
            asset {
              id
              name
              url
              public_url
              file_size
              created_at
              file_extension
            }
            column_id
          }
        }
      }
    }
  }
}
```

### 4. (Optional) Fetch files from Updates

```graphql
query GetItemUpdates($itemId: ID!) {
  items(ids: [$itemId]) {
    updates(limit: 100) {
      id
      created_at
      assets {
        id
        name
        url
        public_url
        file_size
        created_at
        file_extension
      }
    }
  }
}
```

### 5. Normalize to unified FileItem type

```typescript
// src/types/index.ts
export interface FileItem {
  id: string;
  name: string;
  url: string;         // authenticated download URL
  publicUrl?: string;  // if available
  size: number;        // bytes
  createdAt: string;   // ISO string
  extension: string;   // 'pdf', 'jpg', etc. (lowercase, no dot)
  mimeType?: string;   // if available from API
  source: string;      // column title or 'Updates'
  columnId?: string;
  group: FileGroup;    // derived from extension/mime
}

export type FileGroup = 'image' | 'pdf' | 'document' | 'video' | 'audio' | 'archive' | 'other';
```

---

## File Type Grouping Logic

```typescript
// src/utils/fileTypes.ts

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
  image:    'Images',
  pdf:      'PDFs',
  document: 'Documents',
  video:    'Videos',
  audio:    'Audio',
  archive:  'Archives',
  other:    'Other',
};

// Ordered display sequence (groups without files are hidden)
export const GROUP_ORDER: FileGroup[] = [
  'image', 'pdf', 'document', 'video', 'audio', 'archive', 'other',
];

export function getGroup(ext: string, mime?: string): FileGroup {
  const normalized = ext.toLowerCase().replace(/^\./, '');
  return EXT_TO_GROUP[normalized] ?? guessFromMime(mime) ?? 'other';
}

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
```

---

## UI Components

### Toolbar
- Search: text input, debounced 200ms, filters by filename
- Sort: select with options: Name (A-Z), Date (newest first), Size (largest first), Type (extension A-Z)
- View toggle: Grid | List (persist to localStorage)
- Toggle: "Include Updates files" checkbox (persist to localStorage)

### MetaSummary
- Shows total count + colored chips per group (only groups with files)
- e.g. `12 files  [3 Images]  [2 PDFs]  [4 Documents]  [1 Video]`

### FileGroup
- Collapsible section with group label + file count badge
- Chevron icon rotates on collapse
- Collapse state persists per group in component state (not localStorage)

### FileCard (Grid view)
- File icon (emoji or SVG icon based on group/ext)
- Colored icon background per group
- Filename (truncated with ellipsis, full name on title attr)
- File size + date (short format)
- Source badge (column title or "Updates")
- Hover state: slightly elevated border
- Click: open file (see File Opening section)

### FileRow (List view)
- Same info as card but horizontal layout
- Columns: Icon | Name | Size | Date | Source | Actions

### FileTypeIcon
- Map group to emoji + background color:
  - image → 🖼 + green bg
  - pdf → 📄 + red bg
  - document → 📝 + blue bg
  - video → 🎬 + amber bg
  - audio → 🎵 + purple bg
  - archive → 📦 + gray bg
  - other → 📋 + muted bg

### EmptyState
- Loading: spinner (use monday-ui Loader or CSS spinner)
- No files on item: "This item has no files attached."
- No results for search: "No files match your search." with clear button
- Error: "Failed to load files. Check permissions." with retry button

---

## File Opening

Monday API returns a `url` (authenticated, short-lived) and optionally `public_url`.

**Strategy**:
```typescript
function openFile(file: FileItem) {
  // Prefer monday's native dialog if available
  if (window.monday?.openFilesDialog) {
    monday.execute("openFilesDialog", { assetId: file.id });
    return;
  }
  // Fallback: open in new tab
  window.open(file.url, '_blank', 'noopener');
}
```

> NOTE: `monday.execute("openFilesDialog")` may not be available in all contexts. Test both paths.

---

## Settings Panel (optional, phase 2)

Monday Item View can have a Settings panel. Expose:
- **Include Updates files** toggle (default: on)
- **Default view** (Grid / List)
- **Default sort** (Name / Date / Size / Type)
- **Show empty groups** toggle (default: off)

Persist using `monday.storage.instance.setItem(key, value)`.

---

## Error Handling

- Wrap all API calls in try/catch
- Show user-friendly error states (not raw error messages)
- Log errors to console with context for debugging
- Handle empty `column_values` gracefully (item may have no file columns)
- Handle rate limiting (monday API: 60 req/min for most plans) — cache results per itemId for session

---

## Performance Considerations

- Debounce search input (200ms)
- Memoize filtered/sorted file list with useMemo
- Don't re-fetch if itemId hasn't changed (cache in useRef)
- Lazy load thumbnails for images (use IntersectionObserver or `loading="lazy"`)
- If item has >100 updates, paginate Updates query (cursor-based)

---

## Dev Commands

```bash
npm install
npm run dev          # starts Vite dev server on :5173
npx monday-tunnel    # or: ngrok http 5173
```

Set tunnel URL in Monday Developer Center under the Feature's URL field.

---

## Environment

No `.env` needed for monday-sdk-js — the SDK handles auth automatically when running inside monday.com iframe. The API token is injected by the platform.

For local dev outside the iframe, set:
```
VITE_MONDAY_API_TOKEN=your_dev_token
```
And add a check in `api/monday.ts` to use it only in dev mode.

---

## Constraints & Gotchas

1. **Asset URLs expire**: `url` from monday API is signed and expires in ~1 hour. Don't cache them long-term. Re-fetch if user sees 403.
2. **File column GraphQL fragment**: Use inline fragment `... on FileValue` — not all column_values are file type. Failing to filter will cause type errors.
3. **Updates pagination**: monday limits updates to 100 by default. Use `page` param or cursor for items with many updates.
4. **iframe height**: Monday Item View iframes auto-resize. Use `monday.execute("valueCreatedForUser")` if you need to signal the frame is ready.
5. **CSP**: monday.com allows loading assets from their CDN. External font/icon CDNs may be blocked — bundle icons instead.
6. **Vibe component versions**: `monday-ui-react-core` v2 and v3 have breaking changes. Pick one and stick to it.
7. **No `window.open` in some browsers**: If popup blockers prevent file opening, show a direct download link instead.

---

## Phased Delivery

### Phase 1 — Core (MVP)
- [x] Monday context + item ID
- [x] Fetch file columns + file values
- [x] Normalize to FileItem[]
- [x] Group by type
- [x] Grid + List view
- [x] Search (filename)
- [x] Sort (name, date, size, type)
- [x] Open file in new tab

### Phase 2 — Enhanced
- [ ] Include files from Updates (toggle)
- [ ] Settings panel (persisted preferences)
- [ ] Image thumbnails (lazy loaded)
- [ ] Download button per file
- [ ] Column filter (show only files from specific column)

---

## Phase 2 — Detailed Spec

### 2.1 — Include files from Updates (toggle)

**Where**: Toolbar, right side. Checkbox or toggle labeled "Include Updates".

**Behavior**:
- When ON: fetch item updates alongside column files, normalize assets to `FileItem[]` with `source: 'Updates'`, merge into main file list
- When OFF: only column files shown (default: ON)
- Persist preference to `monday.storage.instance` under key `fileviewer_include_updates`

**GraphQL query** (already defined above in Data Flow §4 — wire it up now):
```graphql
query GetItemUpdates($itemId: ID!) {
  items(ids: [$itemId]) {
    updates(limit: 100) {
      id
      created_at
      assets {
        id
        name
        url
        public_url
        file_size
        created_at
        file_extension
      }
    }
  }
}
```

**Normalization**:
```typescript
function normalizeUpdateAssets(updates: MondayUpdate[]): FileItem[] {
  return updates.flatMap(u =>
    (u.assets ?? []).map(a => ({
      id: a.id,
      name: a.name,
      url: a.url,
      publicUrl: a.public_url,
      size: a.file_size ?? 0,
      createdAt: a.created_at,
      extension: a.file_extension?.toLowerCase().replace(/^\./, '') ?? '',
      source: 'Updates',
      group: getGroup(a.file_extension ?? '', undefined),
    }))
  );
}
```

**Loading state**: fetch Updates in parallel with column files using `Promise.all`. Show spinner only if both are still loading. If Updates fetch fails, show non-blocking warning toast ("Updates files could not be loaded") and continue showing column files.

---

### 2.2 — Settings Panel

Monday Item View supports a Settings panel triggered by the gear icon in the item view header.

**Register in monday-sdk-js**:
```typescript
monday.listen("settings", (res) => {
  // res.data contains saved settings values
  applySettings(res.data);
});
```

**Settings to expose** (all persisted via monday Storage API):

| Setting | Type | Default | Storage key |
|---|---|---|---|
| Include Updates files | toggle | true | `fileviewer_include_updates` |
| Default view | radio (Grid/List) | Grid | `fileviewer_default_view` |
| Default sort | select | Date | `fileviewer_default_sort` |
| Show empty groups | toggle | false | `fileviewer_show_empty_groups` |
| Thumbnail size | select (Small/Medium/Large) | Medium | `fileviewer_thumb_size` |

**Storage pattern**:
```typescript
// Write
await monday.storage.instance.setItem('fileviewer_default_view', 'list');

// Read on mount
const { data } = await monday.storage.instance.getItem('fileviewer_default_view');
const view = data.value ?? 'grid';
```

**Settings component**: Create `src/components/SettingsPanel.tsx`. Render only when `monday.listen("settings")` fires. If monday doesn't fire settings event (local dev), show a floating gear button that opens a modal instead.

---

### 2.3 — Image Thumbnails (lazy loaded)

**Where**: Grid view only. Replace the emoji icon for `group === 'image'` with an actual `<img>` thumbnail.

**Implementation**:
```typescript
// src/components/FileCard.tsx
function ThumbnailOrIcon({ file }: { file: FileItem }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (file.group !== 'image') return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && imgRef.current) {
          imgRef.current.src = file.url;
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );
    if (imgRef.current) observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [file.url, file.group]);

  if (file.group !== 'image' || error) return <FileTypeIcon file={file} />;

  return (
    <div className="thumb-wrap">
      {!loaded && <FileTypeIcon file={file} />}
      <img
        ref={imgRef}
        alt={file.name}
        className={`thumb ${loaded ? 'loaded' : 'hidden'}`}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </div>
  );
}
```

**CSS**:
```css
.thumb-wrap { position: relative; width: 100%; aspect-ratio: 16/9; overflow: hidden; border-radius: 4px; background: var(--color-background-secondary); }
.thumb { width: 100%; height: 100%; object-fit: cover; }
.thumb.hidden { position: absolute; opacity: 0; }
.thumb.loaded { opacity: 1; transition: opacity 0.2s; }
```

**Thumbnail size variants** (from Settings):
- Small: `aspect-ratio: 1/1`, `object-fit: cover` — square crop
- Medium: `aspect-ratio: 16/9` — default
- Large: `aspect-ratio: 4/3`

**Note**: Monday asset URLs are authenticated. Thumbnails will only load inside monday.com iframe. In local dev, images will 403 — show icon fallback silently.

---

### 2.4 — Download Button

**Where**: Per file — visible on hover in grid (top-right corner overlay), always visible in list view as last column action.

**Implementation**:
```typescript
async function downloadFile(file: FileItem) {
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
    // Fallback: open in new tab (browser will prompt download for most types)
    window.open(file.url, '_blank', 'noopener');
  }
}
```

**UI**: Small download icon button (`lucide-react`: `Download` icon, 14px). In grid: absolute positioned overlay, `opacity: 0` → `opacity: 1` on `.file-card:hover`. In list: always visible in actions column.

**Do not show download button for files where `file.url` is empty** — guard with `if (!file.url) return null`.

---

### 2.5 — Column Filter

**Where**: Toolbar, between sort and view toggle. A multi-select dropdown showing all column names that have files.

**Behavior**:
- "All sources" is the default (no filter)
- User can select one or more sources (column titles + "Updates")
- Filtering is client-side (no re-fetch)
- Selected filters shown as removable chips below toolbar, or inline in dropdown

**Data**:
```typescript
// Derive available sources from loaded files
const availableSources = useMemo(() => {
  const sources = new Set(files.map(f => f.source));
  return ['All', ...Array.from(sources).sort()];
}, [files]);
```

**Component**: `src/components/SourceFilter.tsx`

```typescript
interface SourceFilterProps {
  sources: string[];
  selected: string[];          // empty = all
  onChange: (selected: string[]) => void;
}
```

**Filter logic** (in `useFileFilters.ts`):
```typescript
const filtered = useMemo(() => {
  let result = files;
  if (selectedSources.length > 0) {
    result = result.filter(f => selectedSources.includes(f.source));
  }
  if (searchQuery) {
    result = result.filter(f =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
  return sortFiles(result, sortBy);
}, [files, selectedSources, searchQuery, sortBy]);
```

**Persist selected sources**: Do NOT persist to storage — column filter is a per-session UI state only. Reset on item change.

---

### Phase 2 Checklist

Before marking Phase 2 complete, verify:
- [ ] Updates toggle persists across page reload (monday Storage API)
- [ ] Images show thumbnail in grid, icon fallback on error/load
- [ ] Download works for both column files and Updates files
- [ ] Column filter correctly resets when switching to a different item
- [ ] Settings panel values apply immediately without page reload
- [ ] `Promise.all` for parallel fetching — column files + updates load together
- [ ] Non-blocking error if Updates fetch fails (column files still show)

### Phase 3 — Polish
- [ ] Drag-to-select multi-file download (zip)
- [ ] Preview overlay for images
- [ ] Preview overlay for PDFs (iframe or PDF.js)
- [ ] "Copy link" action per file
- [ ] Sort per group independently

---

## Phase 3 — Detailed Spec

### 3.1 — Multi-file selection + ZIP download

**Selection UX**:
- Checkbox appears on hover (grid) or always visible (list) per file card
- Click checkbox to toggle selection; clicking the card body still opens the file
- "Select all" checkbox in toolbar (visible when any file is selected)
- Toolbar shows: "3 files selected" + "Download ZIP" button + "Clear" link
- Selection resets on item change or search/filter change

**State**:
```typescript
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

function toggleSelect(id: string) {
  setSelectedIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
}
```

**ZIP generation** — use `fflate` (pure JS, ~50KB gzipped):
```bash
npm install fflate
```

```typescript
import { zip } from 'fflate';

async function downloadZip(files: FileItem[]) {
  const fetched = await Promise.all(
    files.map(async f => {
      const res = await fetch(f.url);
      const buf = await res.arrayBuffer();
      return { name: f.name, data: new Uint8Array(buf) };
    })
  );

  const input: Record<string, Uint8Array> = {};
  const nameCounts: Record<string, number> = {};

  for (const f of fetched) {
    // Deduplicate filenames
    const count = nameCounts[f.name] ?? 0;
    nameCounts[f.name] = count + 1;
    const key = count === 0
      ? f.name
      : f.name.replace(/(\.[^.]+)$/, `_${count}$1`);
    input[key] = f.data;
  }

  zip(input, (err, data) => {
    if (err) { console.error(err); return; }
    const blob = new Blob([data], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'monday-files.zip';
    a.click();
    URL.revokeObjectURL(url);
  });
}
```

**Loading state**: While fetching + zipping show in toolbar: "Preparing 3 files..." + spinner. Disable button during operation.

**Error handling**: If any individual file fetch fails, skip it and show a warning after download completes: "1 file could not be included."

---

### 3.2 — Image Preview Overlay

**Trigger**: Click on image file card body (not checkbox, not download button).

**Component**: `src/components/PreviewOverlay.tsx`

> CRITICAL: `position: fixed` does NOT work inside monday.com iframes — the iframe collapses to min-height. Use `position: absolute` relative to the app root div instead.

```typescript
// App.tsx root:
// <div id="app-root" style={{ position: 'relative', minHeight: '100vh' }}>

// PreviewOverlay.tsx:
// position: absolute; inset: 0; z-index: 100; background: rgba(0,0,0,0.85)
```

**Layout**:
- Top bar: filename (left) + close button × (right)
- Center: `<img>` with `max-width: 90%; max-height: calc(100% - 96px); object-fit: contain`
- Bottom bar: file size, date, source, download button
- Left/right arrows for navigating prev/next image within the current visible group

**Keyboard**: `Escape` closes, `ArrowLeft`/`ArrowRight` navigates.

**Navigation state**:
```typescript
interface PreviewState {
  file: FileItem | null;
  imageFiles: FileItem[];  // all visible images for navigation
}
```

**Image load**: Show spinner while loading, fade in on load.

---

### 3.3 — PDF Preview Overlay

**Trigger**: Click on PDF file card body.

**Strategy — try in order**:

**Option A: Native iframe** (try first):
```typescript
<iframe
  src={file.url}
  style={{ width: '100%', height: 'calc(100% - 48px)', border: 'none' }}
  title={file.name}
/>
```

**Option B: PDF.js** (if iframe is CSP-blocked):
```bash
npm install pdfjs-dist
```

```typescript
import * as pdfjsLib from 'pdfjs-dist';
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url
).toString();
// Render pages to <canvas>, add Prev/Next + page counter
```

**Option C fallback**: If both fail, show an "Open PDF" button that opens in a new tab, with a note explaining why inline preview isn't available.

Check browser console for CSP errors to determine which option to use. Document which was used in a comment at the top of the component.

**PDF overlay features**:
- Page counter: "Page 2 of 14"
- Prev / Next page buttons
- Zoom select: 75% / 100% / 125% / Fit width
- Download button (reuse Phase 2 implementation)

---

### 3.4 — Copy Link

**Where**: Hover action bar per file (grid) + actions column (list), alongside download button.

**What gets copied**: `file.publicUrl ?? file.url`

```typescript
async function copyLink(file: FileItem) {
  const url = file.publicUrl ?? file.url;
  try {
    await navigator.clipboard.writeText(url);
  } catch {
    // Clipboard API may be blocked in monday iframe — fallback
    const input = document.createElement('input');
    input.value = url;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
  }
  showToast(
    file.publicUrl
      ? 'Link copied'
      : 'Link copied — expires in ~1 hour'
  );
}
```

**Toast component** (`src/components/Toast.tsx`):
- `position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%)`  — no `fixed`
- Auto-dismiss after 2s
- Queue multiple toasts if triggered rapidly

---

### 3.5 — Sort per Group

**Where**: Small sort control in each group header, next to the group label.

**Behavior**:
- Each group tracks its own sort independently
- Default: inherits global toolbar sort
- Changing global sort resets all group-level overrides
- Clicking the group sort button cycles: name → date → size → type → (back to name); second click on same field toggles asc/desc

**State**:
```typescript
interface SortConfig {
  by: 'name' | 'date' | 'size' | 'type';
  dir: 'asc' | 'desc';
}

const [groupSorts, setGroupSorts] = useState<Partial<Record<FileGroup, SortConfig>>>({});

// Reset group sorts when global sort changes
useEffect(() => { setGroupSorts({}); }, [globalSort]);
```

**In `useFileFilters.ts`**:
```typescript
const groupFiles = allFiles
  .filter(f => f.group === group.key)
  .sort(getSortFn(groupSorts[group.key] ?? globalSort));
```

**UI**: Small button showing current sort + direction arrow: `↑ Date`. Click cycles field, double-click (or second click same field) flips direction.

---

### Phase 3 Checklist

Before marking Phase 3 complete, verify:
- [ ] ZIP download handles 5+ files and deduplicates filenames
- [ ] ZIP shows progress and reports skipped files on error
- [ ] Image preview navigates prev/next through all visible images
- [ ] Keyboard navigation works: Escape closes, arrows navigate
- [ ] PDF preview works — document which fallback (A/B/C) was used
- [ ] Copy link shows correct toast (expiry warning if no publicUrl)
- [ ] Clipboard fallback works inside monday.com iframe
- [ ] Group sort overrides global and resets when global changes
- [ ] `position: fixed` is NOT used anywhere — all overlays use `position: absolute`
- [ ] All overlays close on Escape key
