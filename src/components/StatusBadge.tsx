import type { BadgeTone } from '../lib/status';

const TONE_CLASS: Record<BadgeTone, string> = {
  ordered: 'bg-slate-100 text-slate-600',
  shipped: 'bg-amber-100 text-amber-700',
  transit: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  pickup: 'bg-sky-100 text-sky-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  action: 'bg-rose-100 text-rose-700',
};

export function StatusBadge({ label, tone }: { label: string; tone: BadgeTone }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[12px] font-semibold ${TONE_CLASS[tone]}`}
    >
      {label}
    </span>
  );
}
