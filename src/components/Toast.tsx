import { useState, useEffect, useCallback, useRef } from 'react';

interface ToastMessage {
  id: number;
  text: string;
}

let nextId = 0;
let globalAddToast: ((text: string) => void) | null = null;

export function showToast(text: string) {
  globalAddToast?.(text);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const addToast = useCallback((text: string) => {
    const id = nextId++;
    setToasts(prev => [...prev, { id, text }]);
    const timer = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
      timersRef.current.delete(id);
    }, 2000);
    timersRef.current.set(id, timer);
  }, []);

  useEffect(() => {
    globalAddToast = addToast;
    return () => {
      globalAddToast = null;
      timersRef.current.forEach(t => clearTimeout(t));
    };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className="toast">{t.text}</div>
      ))}
    </div>
  );
}
