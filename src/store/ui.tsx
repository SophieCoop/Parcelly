import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

interface Toast {
  id: number;
  message: string;
}

interface UIValue {
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toasts: Toast[];
  toast: (message: string) => void;
}

const UIContext = createContext<UIValue | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message }]);
    setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), 2600);
  }, []);

  const value = useMemo<UIValue>(
    () => ({
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
      toasts,
      toast,
    }),
    [drawerOpen, toasts, toast],
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI(): UIValue {
  const context = useContext(UIContext);
  if (!context) throw new Error('useUI must be used inside <UIProvider>');
  return context;
}
