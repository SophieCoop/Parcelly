import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/store';
import { useUI } from '../store/ui';
import { BottomNav } from './BottomNav';
import { Icon } from './Icon';

/** Home header: menu, wordmark, notification bell. */
export function TopBar({ title }: { title?: string }) {
  const { openDrawer } = useUI();
  const { unreadCount } = useStore();
  const navigate = useNavigate();

  return (
    <header className="safe-top z-20 shrink-0 bg-canvas px-4 pb-2 pt-3">
      <div dir="ltr" className="flex items-center justify-between">
        <button
          type="button"
          onClick={openDrawer}
          className="rounded-xl p-1.5 text-brand-700 transition active:bg-brand-100"
          aria-label="פתיחת התפריט"
        >
          <Icon name="menu" size={24} />
        </button>
        <span dir="ltr" className="text-[21px] font-bold tracking-tight text-brand-700">
          Parcelly
        </span>
        <button
          type="button"
          onClick={() => navigate('/notifications')}
          className="relative rounded-xl p-1.5 text-brand-700 transition active:bg-brand-100"
          aria-label="הודעות"
        >
          <Icon name="bell" size={23} />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-canvas" />
          )}
        </button>
      </div>
      {title && (
        <h1 className="pt-3 text-center text-[22px] font-extrabold text-brand-ink">{title}</h1>
      )}
    </header>
  );
}

interface PageHeaderProps {
  title: string;
  /** Optional control rendered on the far side of the back button. */
  action?: ReactNode;
  onBack?: () => void;
  subtle?: boolean;
}

/** Header for pushed pages: back arrow, centred title, optional action. */
export function PageHeader({ title, action, onBack, subtle = false }: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <header
      className={`safe-top z-20 shrink-0 px-3 pb-3 pt-3 ${
        subtle ? 'bg-canvas' : 'border-b border-brand-100 bg-white'
      }`}
    >
      <div dir="ltr" className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => (onBack ? onBack() : navigate(-1))}
          className="rounded-xl p-1.5 text-brand-700 transition active:bg-brand-100"
          aria-label="חזרה"
        >
          <Icon name="forward" size={24} />
        </button>
        <h1 className="truncate text-center text-[17px] font-bold text-brand-ink">{title}</h1>
        <span className="flex min-w-[40px] justify-end">{action}</span>
      </div>
    </header>
  );
}

interface ScreenProps {
  header?: ReactNode;
  children: ReactNode;
  /** Show the bottom tab bar (main tabs only). */
  tabs?: boolean;
  /** Extra element pinned above the tab bar, e.g. a floating action button. */
  floating?: ReactNode;
}

export function Screen({ header, children, tabs = false, floating }: ScreenProps) {
  return (
    <>
      {header}
      <main className="no-scrollbar relative flex-1 overflow-y-auto overflow-x-hidden">
        {children}
      </main>
      {floating}
      {tabs && <BottomNav />}
    </>
  );
}
