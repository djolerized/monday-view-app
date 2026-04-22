import { useState, useEffect, useRef, useCallback } from 'react';
import monday from '../api/monday';
import { GET_BOARD_COLUMNS, GET_ITEM_FILES, GET_ITEM_UPDATES, GET_ITEM_ASSETS } from '../api/queries';
import { FileItem, BoardColumn, MondayUpdate } from '../types';
import { getGroup } from '../utils/fileTypes';

interface AssetData {
  id: string;
  name: string;
  url: string;
  public_url: string | null;
  file_size: number;
  created_at: string;
  file_extension: string;
}

interface FileAssetValue {
  asset: AssetData;
  column_id: string;
}

interface ColumnValue {
  id: string;
  type: string;
  files?: FileAssetValue[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiData = any;

async function fetchColumnFiles(boardId: number, itemId: number): Promise<FileItem[]> {
  const columnsRes = await monday.api(GET_BOARD_COLUMNS, {
    variables: { boardId },
  });
  console.log('[FileViewer] raw board columns response:', JSON.stringify(columnsRes, null, 2));
  const boards = (columnsRes.data as ApiData).boards as { columns: BoardColumn[] }[];
  const columns: BoardColumn[] = boards[0]?.columns ?? [];
  console.log('[FileViewer] column types found:', columns.map(c => ({ id: c.id, title: c.title, type: c.type })));
  const fileColumnMap = new Map<string, string>();
  for (const col of columns) {
    if (col.type === 'file') fileColumnMap.set(col.id, col.title);
  }

  const itemRes = await monday.api(GET_ITEM_FILES, {
    variables: { itemId },
  });
  console.log('[FileViewer] raw item column_values response:', JSON.stringify(itemRes, null, 2));
  const items = (itemRes.data as ApiData).items as { column_values: ColumnValue[] }[];
  const columnValues: ColumnValue[] = items[0]?.column_values ?? [];
  console.log('[FileViewer] column_values summary:', columnValues.map(cv => ({ id: cv.id, type: cv.type, hasFiles: !!cv.files, fileCount: cv.files?.length ?? 0 })));

  const result: FileItem[] = [];
  for (const cv of columnValues) {
    if (cv.type !== 'file' || !cv.files) continue;
    for (const fileAsset of cv.files) {
      const asset = fileAsset.asset;
      const ext = (asset.file_extension || '').toLowerCase().replace(/^\./, '');
      result.push({
        id: asset.id,
        name: asset.name,
        url: asset.url,
        publicUrl: asset.public_url ?? undefined,
        size: asset.file_size,
        createdAt: asset.created_at,
        extension: ext,
        source: fileColumnMap.get(fileAsset.column_id) ?? fileAsset.column_id,
        columnId: fileAsset.column_id,
        group: getGroup(ext),
      });
    }
  }
  return result;
}

async function fetchItemAssets(itemId: number): Promise<FileItem[]> {
  console.log('[FileViewer] fetching item assets (Files gallery) for itemId:', itemId);
  const res = await monday.api(GET_ITEM_ASSETS, {
    variables: { itemId },
  });
  console.log('[FileViewer] raw item assets response:', JSON.stringify(res, null, 2));
  const items = (res.data as ApiData).items as { assets: AssetData[] }[];
  const assets: AssetData[] = items[0]?.assets ?? [];

  const result = assets.map(a => {
    const ext = (a.file_extension || '').toLowerCase().replace(/^\./, '');
    return {
      id: a.id,
      name: a.name,
      url: a.url,
      publicUrl: a.public_url ?? undefined,
      size: a.file_size ?? 0,
      createdAt: a.created_at,
      extension: ext,
      source: 'Files gallery',
      group: getGroup(ext),
    };
  });
  console.log('[FileViewer] item assets normalized file count:', result.length);
  return result;
}

async function fetchUpdateFiles(itemId: number): Promise<FileItem[]> {
  console.log('[FileViewer] fetching updates for itemId:', itemId);
  const res = await monday.api(GET_ITEM_UPDATES, {
    variables: { itemId },
  });
  console.log('[FileViewer] raw updates response:', JSON.stringify(res, null, 2));
  const items = (res.data as ApiData).items as { updates: MondayUpdate[] }[];
  const updates: MondayUpdate[] = items[0]?.updates ?? [];

  const result = updates.flatMap(u =>
    (u.assets ?? []).map(a => {
      const ext = (a.file_extension || '').toLowerCase().replace(/^\./, '');
      return {
        id: a.id,
        name: a.name,
        url: a.url,
        publicUrl: a.public_url ?? undefined,
        size: a.file_size ?? 0,
        createdAt: a.created_at,
        extension: ext,
        source: 'Updates',
        group: getGroup(ext),
      };
    })
  );
  console.log('[FileViewer] updates normalized file count:', result.length);
  return result;
}

export function useItemFiles(itemId?: number, boardId?: number) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatesWarning, setUpdatesWarning] = useState<string | null>(null);
  const lastFetchKey = useRef<string | undefined>();

  const doFetch = useCallback(async (bid: number, iid: number) => {
    setLoading(true);
    setError(null);
    setUpdatesWarning(null);
    try {
      console.log('[FileViewer] doFetch starting — calling updates + column files + item assets in parallel, iid:', iid, 'bid:', bid);
      const [updateFilesResult, columnFiles, itemAssets] = await Promise.all([
        fetchUpdateFiles(iid).then(r => {
          console.log('[FileViewer] updates fetch resolved — count:', r.length);
          return { ok: true as const, files: r };
        }).catch(err => {
          console.error('[FileViewer] updates fetch failed:', err);
          return { ok: false as const, files: [] as FileItem[] };
        }),
        fetchColumnFiles(bid, iid).catch(err => {
          console.error('Failed to fetch column files:', err);
          return [] as FileItem[];
        }),
        fetchItemAssets(iid).catch(err => {
          console.error('[FileViewer] item assets fetch failed:', err);
          return [] as FileItem[];
        }),
      ]);
      console.log('[FileViewer] doFetch complete — updates:', updateFilesResult.files.length, 'column:', columnFiles.length, 'itemAssets:', itemAssets.length);
      if (!updateFilesResult.ok) {
        setUpdatesWarning('Updates files could not be loaded');
      }
      setFiles([...itemAssets, ...updateFilesResult.files, ...columnFiles]);
    } catch (err) {
      console.error('Failed to fetch files:', err);
      setError('Failed to load files. Check permissions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!itemId || !boardId) return;
    const key = `${itemId}-${boardId}`;
    if (lastFetchKey.current === key) return;
    lastFetchKey.current = key;
    doFetch(boardId, itemId);
  }, [itemId, boardId, doFetch]);

  const retry = useCallback(() => {
    lastFetchKey.current = undefined;
    if (itemId && boardId) doFetch(boardId, itemId);
  }, [itemId, boardId, doFetch]);

  return { files, loading, error, updatesWarning, retry };
}
