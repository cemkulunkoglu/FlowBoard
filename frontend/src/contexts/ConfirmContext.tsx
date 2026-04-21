import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger';
}

type Resolver = (result: boolean) => void;

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | undefined>(undefined);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolver, setResolver] = useState<Resolver | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setOptions(opts);
      setResolver(() => resolve);
    });
  }, []);

  const handleClose = useCallback(
    (result: boolean) => {
      resolver?.(result);
      setResolver(null);
      setOptions(null);
    },
    [resolver],
  );

  useEffect(() => {
    if (!options) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose(false);
      if (e.key === 'Enter') handleClose(true);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [options, handleClose]);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {options && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
          onClick={() => handleClose(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white shadow-xl dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal
          >
            <div className="px-5 py-4">
              {options.title && (
                <h2 className="mb-1 text-base font-semibold text-slate-900 dark:text-slate-100">
                  {options.title}
                </h2>
              )}
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {options.message}
              </p>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3 dark:border-slate-800">
              <button
                type="button"
                onClick={() => handleClose(false)}
                className="rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              >
                {options.cancelText ?? 'İptal'}
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => handleClose(true)}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium text-white ${
                  options.variant === 'danger'
                    ? 'bg-danger-600 hover:bg-danger-700'
                    : 'bg-primary-600 hover:bg-primary-700'
                }`}
              >
                {options.confirmText ?? 'Tamam'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm ConfirmProvider içinde kullanılmalı.');
  return ctx.confirm;
}
