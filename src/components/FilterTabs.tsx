import { FILTERS, type FilterId } from '../lib/status';

interface FilterTabsProps {
  value: FilterId;
  counts: Record<FilterId, number>;
  onChange: (filter: FilterId) => void;
}

export function FilterTabs({ value, counts, onChange }: FilterTabsProps) {
  return (
    <div className="no-scrollbar -mx-4 overflow-x-auto px-4">
      <div className="flex min-w-max gap-2 pb-1">
        {FILTERS.map((filter) => {
          const active = filter.id === value;
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => onChange(filter.id)}
              className={`press rounded-xl px-4 py-2.5 text-[14px] font-semibold transition ${
                active
                  ? 'bg-brand-600 text-white shadow-[0_4px_12px_rgba(108,53,220,0.3)]'
                  : 'bg-white text-brand-ink/70 shadow-card'
              }`}
              aria-pressed={active}
            >
              {filter.label}
              {counts[filter.id] > 0 && (
                <span className={`mr-1.5 text-[12px] ${active ? 'text-white/75' : 'text-brand-300'}`}>
                  {counts[filter.id]}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
