import { useState, useEffect } from 'react';
import monday from '../api/monday';
import { MondayContext } from '../types';

export function useMonday() {
  const [context, setContext] = useState<MondayContext>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    monday.listen('context', (res: { data: Record<string, unknown> }) => {
      setContext({
        itemId: res.data.itemId as number | undefined,
        boardId: res.data.boardId as number | undefined,
      });
      setLoading(false);
    });
  }, []);

  return { context, loading };
}
