import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  body?: string;
  action?: ReactNode;
}

export function EmptyState({ icon = 'box', title, body, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center px-8 py-14 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand-400">
        <Icon name={icon} size={30} />
      </span>
      <h2 className="mt-4 text-[16px] font-bold text-brand-ink">{title}</h2>
      {body && <p className="mt-1.5 text-[14px] leading-relaxed text-brand-400">{body}</p>}
      {action && <div className="mt-5 w-full max-w-[240px]">{action}</div>}
    </div>
  );
}
