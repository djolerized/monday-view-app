# Monday.com File Browser — Custom Item View

A custom monday.com Item View app that displays all files attached to an item in a structured, searchable, and sortable interface grouped by file type. Built as a more powerful alternative to the native Files tab.

---

## Problem

Monday.com's native Files tab shows all files in a flat chronological list. For items with many attachments (documents, images, contracts, media), finding a specific file is slow and tedious. There is no grouping, no type filtering, and no way to quickly distinguish between file types.

## Solution

A custom Item View app that:
- Fetches files from all **File columns** and **Updates attachments**
- Groups them by type: Images, PDFs, Documents, Videos, Archives, Other
- Supports **search** by filename, **sorting** by name/date/size/type, and **grid/list** view toggle
- Allows opening files directly without leaving monday.com
- Provides image **thumbnails**, **download** per file, **copy link**, and **multi-file ZIP download**

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Bundler | Vite |
| Monday integration | monday-sdk-js |
| UI components | monday-ui-react-core (Vibe) + custom CSS |
| Icons | lucide-react |
| ZIP generation | fflate |
| PDF preview | pdfjs-dist |
| Linting | ESLint + Prettier |

---

## Project Structure

```
src/
├── api/
│   ├── monday.ts          # monday-sdk-js singleton
│   └── queries.ts         # GraphQL query strings
├── components/
│   ├── Toolbar.tsx        # Search, sort, view toggle
│   ├── MetaSummary.tsx    # File count chips per type
│   ├── FileGroup.tsx      # Collapsible group section
│   ├── FileCard.tsx       # Grid card (with thumbnail for images)
│   ├── FileRow.tsx        # List row
│   ├── FileTypeIcon.tsx   # Icon + color per file type
│   ├── PreviewOverlay.tsx # Image + PDF preview
│   ├── SourceFilter.tsx   # Filter by column source
│   ├── SettingsPanel.tsx  # Persisted user preferences
│   ├── Toast.tsx          # Non-blocking notifications
│   └── EmptyState.tsx     # Loading / no files / error states
├── hooks/
│   ├── useMonday.ts       # Context subscription
│   ├── useItemFiles.ts    # Data fetching (columns + updates + assets)
│   └── useFileFilters.ts  # Search, sort, group logic
├── utils/
│   ├── fileTypes.ts       # Extension → group mapping
│   ├── formatters.ts      # formatBytes, formatDate
│   └── sort.ts            # Sort functions
└── types/
    └── index.ts           # FileItem, FileGroup, SortConfig types
```

---

## Features

### Phase 1 — Core
- Monday context integration (itemId, boardId)
- Fetch files from File columns via GraphQL
- Normalize to unified `FileItem` type
- Group by file type (Images, PDFs, Documents, Videos, Archives, Other)
- Grid and List view
- Search by filename (debounced)
- Sort by name, date, size, or type
- Open file in monday native dialog or new tab

### Phase 2 — Enhanced
- Files from Updates attachments (toggle)
- Settings panel with persisted preferences (monday Storage API)
- Lazy-loaded image thumbnails (IntersectionObserver)
- Per-file download button
- Column source filter (multi-select)

### Phase 3 — Polish
- Multi-file selection + ZIP download (fflate)
- Image preview overlay with prev/next navigation and keyboard support
- PDF preview (native iframe → PDF.js fallback)
- Copy link per file (with expiry warning for signed URLs)
- Independent sort per file group

---

## Getting Started

### Prerequisites

- Node.js 18+
- A monday.com account with Developer access
- ngrok or monday tunnel for local development

### Install

```bash
npm install
```

### Run locally

```bash
# Terminal 1 — dev server
npm run dev

# Terminal 2 — tunnel
npx @mondaycom/tunnel --port 5173
# or: ngrok http 5173
```

### Configure vite.config.ts

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    allowedHosts: true,
    headers: {
      'ngrok-skip-browser-warning': 'true'
    }
  }
});
```

### Monday Developer Center setup

1. Go to [monday Developer Center](https://monday.com/developers)
2. Open your app → **Build → Features → Item View**
3. Set **Deployment URL** to your tunnel URL
4. Under **Build → OAuth & permissions**, enable:
   - `me:read`
   - `boards:read`
   - `assets:read`
   - `updates:read`
5. Create a new app version if the live version is locked
6. Install the app on your account

---

## Deploy to production

```bash
npm run build
npx vercel
```

Paste the Vercel URL into the monday Developer Center Feature URL field. No environment variables needed — monday-sdk-js handles auth automatically inside the iframe.

---

## Important limitations

**Files gallery is not accessible via API.** Files added through monday's drag-and-drop Files gallery UI are stored internally and not exposed through the GraphQL API. This app works with files added through explicit **File columns** on the board. If your board uses Files gallery, add a dedicated File column for files you want to browse through this app.

---

## Development notes

- Asset URLs from the monday API are signed and expire in ~1 hour. Do not cache them long-term.
- All overlays use `position: absolute` (not `fixed`) — fixed positioning collapses the iframe height inside monday.com.
- monday-sdk-js context (itemId, boardId) is only available inside the monday iframe. For local testing outside the iframe, set `VITE_DEV_ITEM_ID` and `VITE_DEV_BOARD_ID` in `.env.local`.
