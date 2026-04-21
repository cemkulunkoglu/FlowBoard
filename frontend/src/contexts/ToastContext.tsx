import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

type ToastVariant = 'success' | 'error' | 'info';

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastOptions {
  variant?: ToastVariant;
  duration?: number;
  action?: ToastAction;
}

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
  duration: number;
  action?: ToastAction;
}

interface ToastContextValue {
  toast: (message: string, options?: ToastOptions) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  undoable: (message: string, onUndo: () => void, durationMs?: number) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, options: ToastOptions = {}) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [
      ...prev,
      {
        id,
        message,
        variant: options.variant ?? 'info',
        duration: options.duration ?? 4000,
        action: options.action,
      },
    ]);
  }, []);

  const success = useCallback(
    (message: string) => toast(message, { variant: 'success' }),
    [toast],
  );
  const error = useCallback(
    (message: string) => toast(message, { variant: 'error' }),
    [toast],
  );
  const info = useCallback(
    (message: string) => toast(message, { variant: 'info' }),
    [toast],
  );

  const undoable = useCallback(
    (message: string, onUndo: () => void, durationMs = 5000) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [
        ...prev,
        {
          id,
          message,
          variant: 'info',
          duration: durationMs,
          action: {
            label: 'Geri al',
            onClick: () => {
              onUndo();
              setToasts((p) => p.filter((t) => t.id !== id));
            },
          },
        },
      ]);
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ toast, success, error, info, undoable }}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast ToastProvider içinde kullanılmalı.');
  return ctx;
}

function Toaster({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-80 flex-col gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const timeout = setTimeout(() => onDismiss(toast.id), toast.duration);
    return () => clearTimeout(timeout);
  }, [toast.id, toast.duration, onDismiss]);

  const styles: Record<ToastVariant, string> = {
    success:
      'border-success-200 bg-success-50 text-success-800 dark:border-success-900 dark:bg-success-950/40 dark:text-success-300',
    error:
      'border-danger-200 bg-danger-50 text-danger-800 dark:border-danger-900 dark:bg-danger-950/40 dark:text-danger-300',
    info: 'border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200',
  };

  const icons: Record<ToastVariant, string> = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
  };

  return (
    <div
      className={`pointer-events-auto flex items-start gap-2 rounded-lg border px-4 py-3 text-sm shadow-md ${styles[toast.variant]}`}
    >
      <span className="mt-0.5 font-bold">{icons[toast.variant]}</span>
      <span className="flex-1">{toast.message}</span>
      {toast.action && (
        <button
          onClick={toast.action.onClick}
          className="text-xs font-semibold underline underline-offset-2 hover:opacity-80"
        >
          {toast.action.label}
        </button>
      )}
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-xs opacity-60 hover:opacity-100"
        aria-label="Kapat"
      >
        ✕
      </button>
    </div>
  );
}
