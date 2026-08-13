import { NavLink } from 'react-router-dom';
import { useStore } from '../store/store';
import { Icon, type IconName } from './Icon';

const TABS: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'בית', icon: 'home' },
  { to: '/notifications', label: 'הודעות', icon: 'bell' },
  { to: '/history', label: 'היסטוריה', icon: 'clock' },
  { to: '/settings', label: 'הגדרות', icon: 'settings' },
];

export function BottomNav() {
  const { unreadCount } = useStore();

  return (
    <nav className="safe-bottom z-30 shrink-0 border-t border-brand-100 bg-white/95 px-2 pt-1.5 backdrop-blur">
      <ul className="flex items-stretch justify-around">
        {TABS.map((tab) => (
          <li key={tab.to} className="flex-1">
            <NavLink
              to={tab.to}
              end={tab.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-medium transition ${
                  isActive ? 'text-brand-600' : 'text-brand-300'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className="relative">
                    <Icon name={tab.icon} size={22} filled={isActive} />
                    {tab.to === '/notifications' && unreadCount > 0 && (
                      <span className="absolute -top-0.5 left-0 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
                    )}
                  </span>
                  <span>{tab.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
