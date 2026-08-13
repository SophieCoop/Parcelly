import { formatDayMonth } from '../lib/date';
import { MILESTONE_LABELS, milestoneIndex } from '../lib/status';
import { MILESTONE_ORDER, type Parcel } from '../types';
import { Icon } from './Icon';

/** Horizontal milestone tracker shown at the top of the parcel detail page. */
export function Timeline({ parcel, color }: { parcel: Parcel; color: string }) {
  const current = milestoneIndex(parcel.status);
  const dateFor = (index: number) =>
    parcel.events.find((event) => event.milestone === MILESTONE_ORDER[index])?.date;

  return (
    <ol className="flex items-start justify-between gap-1">
      {MILESTONE_ORDER.map((milestone, index) => {
        const reached = index <= current;
        const active = index === current;
        const date = dateFor(index);
        return (
          <li key={milestone} className="relative flex flex-1 flex-col items-center gap-1.5">
            {index < MILESTONE_ORDER.length - 1 && (
              /* Connector to the next milestone, which sits to the left in RTL. */
              <span
                className="absolute top-[11px] right-1/2 h-[2px] w-full"
                style={{ backgroundColor: index < current ? color : 'rgba(43,27,87,0.12)' }}
              />
            )}
            <span
              className="relative z-10 grid h-[22px] w-[22px] place-items-center rounded-full text-white transition"
              style={{
                backgroundColor: reached ? color : '#FFFFFF',
                border: reached ? 'none' : '2px solid rgba(43,27,87,0.15)',
                boxShadow: active ? `0 0 0 4px ${color}2E` : undefined,
              }}
            >
              {reached && <Icon name="check" size={13} />}
            </span>
            <span
              className={`flex h-7 items-start justify-center text-center text-[11px] leading-tight ${
                active ? 'font-bold text-brand-ink' : reached ? 'text-brand-ink/70' : 'text-brand-300'
              }`}
            >
              {MILESTONE_LABELS[milestone]}
            </span>
            <span dir="ltr" className="text-[10px] text-brand-300">
              {date ? formatDayMonth(date) : '—'}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
