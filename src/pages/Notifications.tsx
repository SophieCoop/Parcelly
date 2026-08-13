import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';
import { Icon, type IconName } from '../components/Icon';
import { Screen, TopBar } from '../components/Screen';
import { formatAgo } from '../lib/date';
import { useStore } from '../store/store';
import type { AppNotification } from '../types';

const KIND_STYLE: Record<AppNotification['kind'], { icon: IconName; className: string }> = {
  update: { icon: 'truck', className: 'bg-brand-50 text-brand-600' },
  action: { icon: 'alert', className: 'bg-amber-50 text-amber-600' },
  delivered: { icon: 'check', className: 'bg-emerald-50 text-emerald-600' },
  delay: { icon: 'clock', className: 'bg-rose-50 text-rose-600' },
};

export function NotificationsPage() {
  const { notifications, readNotification, readAllNotifications, unreadCount } = useStore();
  const navigate = useNavigate();

  return (
    <Screen header={<TopBar title="הודעות" />} tabs>
      <div className="px-4 pb-8">
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={readAllNotifications}
            className="mb-2 block w-full text-left text-[13px] font-medium text-brand-600"
          >
            סימון הכול כנקרא
          </button>
        )}

        <div className="space-y-2">
          {notifications.map((notification) => {
            const style = KIND_STYLE[notification.kind];
            return (
              <button
                key={notification.id}
                type="button"
                onClick={() => {
                  readNotification(notification.id);
                  if (notification.parcelId) navigate(`/package/${notification.parcelId}`);
                }}
                className={`press flex w-full items-start gap-3 rounded-2xl p-3.5 text-right shadow-card ${
                  notification.read ? 'bg-white' : 'bg-brand-50/70 ring-1 ring-brand-100'
                }`}
              >
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${style.className}`}>
                  <Icon name={style.icon} size={19} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 text-[14px] font-semibold leading-snug text-brand-ink">
                      {notification.title}
                    </span>
                    {!notification.read && (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-600" />
                    )}
                  </span>
                  <span className="mt-0.5 block text-[13px] leading-relaxed text-brand-400">
                    {notification.body}
                  </span>
                  <span className="mt-1 block text-[11px] text-brand-300">
                    {formatAgo(notification.date)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {notifications.length === 0 && (
          <EmptyState icon="bell" title="אין הודעות חדשות" body="כאן יופיעו עדכוני משלוח ותזכורות." />
        )}
      </div>
    </Screen>
  );
}
