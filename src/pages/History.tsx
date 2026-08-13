import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';
import { Icon } from '../components/Icon';
import { RetailerLogo } from '../components/RetailerLogo';
import { Screen, TopBar } from '../components/Screen';
import { formatShortDate } from '../lib/date';
import { isDelivered } from '../lib/status';
import { useStore } from '../store/store';
import type { Parcel } from '../types';

function monthKey(value: string): string {
  return new Intl.DateTimeFormat('he-IL', { month: 'long', year: 'numeric' }).format(
    new Date(value),
  );
}

export function HistoryPage() {
  const { parcels } = useStore();
  const [query, setQuery] = useState('');

  const groups = useMemo(() => {
    const done = parcels
      .filter((parcel) => isDelivered(parcel) || parcel.archived)
      .filter((parcel) => {
        if (!query.trim()) return true;
        const needle = query.trim().toLowerCase();
        return (
          parcel.trackingNumber.toLowerCase().includes(needle) ||
          parcel.retailerId.includes(needle) ||
          parcel.items.some((item) => item.title.toLowerCase().includes(needle))
        );
      })
      .sort((a, b) => new Date(b.eta ?? b.updatedAt).getTime() - new Date(a.eta ?? a.updatedAt).getTime());

    const map = new Map<string, Parcel[]>();
    for (const parcel of done) {
      const key = monthKey(parcel.eta ?? parcel.updatedAt);
      map.set(key, [...(map.get(key) ?? []), parcel]);
    }
    return [...map.entries()];
  }, [parcels, query]);

  const spent = parcels
    .filter((parcel) => isDelivered(parcel))
    .reduce((sum, parcel) => sum + (parcel.total ?? 0), 0);

  return (
    <Screen header={<TopBar title="היסטוריית הזמנות" />} tabs>
      <div className="px-4 pb-8">
        <label className="relative block">
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-brand-300">
            <Icon name="search" size={18} />
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="חיפוש לפי חנות, מוצר או מספר מעקב"
            className="field pr-10"
          />
        </label>

        {spent > 0 && (
          <div className="mt-3 flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-card">
            <span className="text-[13px] text-brand-400">סה״כ הזמנות שהתקבלו</span>
            <span dir="ltr" className="text-[15px] font-bold text-brand-700">
              ₪{spent.toFixed(2)}
            </span>
          </div>
        )}

        {groups.map(([month, items]) => (
          <section key={month} className="mt-4">
            <h2 className="section-title">{month}</h2>
            <div className="card overflow-hidden">
              {items.map((parcel) => (
                <Link
                  key={parcel.id}
                  to={`/package/${parcel.id}`}
                  className="flex items-center gap-3 border-b border-brand-50 px-4 py-3 last:border-b-0 transition active:bg-brand-50"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-xl">
                    {parcel.items[0]?.image ?? '📦'}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <RetailerLogo
                        retailerId={parcel.retailerId}
                        name={parcel.retailerName}
                        size="sm"
                      />
                      <span className="text-[11px] text-brand-300">
                        {parcel.eta ? formatShortDate(parcel.eta) : ''}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-[14px] text-brand-ink">
                      {parcel.items[0]?.title ?? parcel.trackingNumber}
                      {parcel.items.length > 1 ? ` ועוד ${parcel.items.length - 1}` : ''}
                    </span>
                  </span>
                  {parcel.total != null && (
                    <span dir="ltr" className="shrink-0 text-[14px] font-semibold text-brand-ink">
                      ₪{parcel.total.toFixed(2)}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </section>
        ))}

        {groups.length === 0 && (
          <EmptyState
            icon="clock"
            title="אין עדיין היסטוריה"
            body="חבילות שנמסרו יופיעו כאן, כולל מה היה בהן וכמה עלו."
          />
        )}
      </div>
    </Screen>
  );
}
