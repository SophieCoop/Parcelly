import { useEffect, type ReactNode } from 'react';
import { Icon } from './Icon';

interface SheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** Bottom sheet, aligned to the phone-sized column the app renders in. */
export function Sheet({ open, title, onClose, children }: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] mx-auto flex max-w-[460px] flex-col justify-end">
      <button
        type="button"
        className="absolute inset-0 animate-fade-in bg-brand-900/40"
        onClick={onClose}
        aria-label="סגירה"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative max-h-[85%] animate-slide-in overflow-y-auto rounded-t-3xl bg-white pb-6 shadow-sheet [animation-name:pop-in]"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-brand-50 bg-white px-4 pb-3 pt-4">
          <h2 className="text-[17px] font-bold text-brand-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-brand-400 transition active:bg-brand-50"
            aria-label="סגירה"
          >
            <Icon name="close" size={20} />
          </button>
        </div>
        <div className="px-4 pt-3">{children}</div>
      </div>
    </div>
  );
}
