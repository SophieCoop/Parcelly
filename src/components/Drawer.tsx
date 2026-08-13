import { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useStore } from '../store/store';
import { useUI } from '../store/ui';
import { Icon, type IconName } from './Icon';
import { LogoMark } from './Logo';

interface MenuEntry {
  to: string;
  label: string;
  icon: IconName;
  badge?: number;
}

export function Drawer() {
  const { drawerOpen, closeDrawer, toast } = useUI();
  const { settings, unreadCount, parcels } = useStore();
  const navigate = useNavigate();

  const actionCount = parcels.filter((p) => p.action && !p.action.resolvedAt && !p.archived).length;

  const entries: MenuEntry[] = [
    { to: '/', label: 'החבילות שלי', icon: 'box' },
    { to: '/notifications', label: 'הודעות', icon: 'bell', badge: unreadCount },
    { to: '/action-required', label: 'דורש פעולה', icon: 'alert', badge: actionCount },
    { to: '/history', label: 'היסטוריית הזמנות', icon: 'clock' },
    { to: '/addresses', label: 'כתובות שלי', icon: 'pin' },
    { to: '/settings', label: 'הגדרות', icon: 'settings' },
    { to: '/sources', label: 'חיבור מקורות', icon: 'link' },
    { to: '/paste', label: 'הדבק טקסט (SMS)', icon: 'chat' },
    { to: '/help', label: 'עזרה ותמיכה', icon: 'help' },
  ];

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeDrawer();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [closeDrawer]);

  return (
    <>
      <div
        className={`absolute inset-0 z-40 bg-brand-900/40 transition-opacity duration-200 ${
          drawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={closeDrawer}
        aria-hidden="true"
      />
      <aside
        className={`absolute inset-y-0 left-0 z-50 flex w-[84%] max-w-[320px] flex-col bg-white shadow-2xl transition-transform duration-250 ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-hidden={!drawerOpen}
      >
        <div className="safe-top bg-brand-900 px-5 pb-5 pt-5 text-white">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <LogoMark size={26} />
              <span dir="ltr" className="text-[19px] font-bold">
                Parcelly
              </span>
            </span>
            <button
              type="button"
              onClick={closeDrawer}
              className="rounded-full p-1.5 text-white/80 transition active:bg-white/10"
              aria-label="סגירת התפריט"
            >
              <Icon name="close" size={20} />
            </button>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-white/15 text-[18px] font-bold">
              {settings.userName.slice(0, 1)}
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] font-semibold">שלום, {settings.userName}</span>
              <span dir="ltr" className="block truncate text-right text-[12px] text-white/70">
                {settings.userEmail}
              </span>
            </span>
          </div>
        </div>

        <nav className="no-scrollbar flex-1 overflow-y-auto py-2">
          {entries.map((entry) => (
            <NavLink
              key={entry.to}
              to={entry.to}
              end={entry.to === '/'}
              onClick={closeDrawer}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-3.5 text-[15px] transition ${
                  isActive
                    ? 'bg-brand-50 font-semibold text-brand-700'
                    : 'text-brand-ink active:bg-brand-50'
                }`
              }
            >
              <Icon name={entry.icon} size={20} />
              <span className="flex-1">{entry.label}</span>
              {entry.badge ? (
                <span className="min-w-[20px] rounded-full bg-brand-600 px-1.5 py-0.5 text-center text-[11px] font-bold text-white">
                  {entry.badge}
                </span>
              ) : null}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => {
            closeDrawer();
            toast('התנתקת מהחשבון (הדגמה)');
            navigate('/welcome');
          }}
          className="safe-bottom flex items-center gap-3 border-t border-brand-100 px-5 py-4 text-[15px] text-brand-ink transition active:bg-brand-50"
        >
          <Icon name="logout" size={20} />
          <span>התנתקות</span>
        </button>
      </aside>
    </>
  );
}
