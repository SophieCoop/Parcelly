import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';
import { FilterTabs } from '../components/FilterTabs';
import { Icon } from '../components/Icon';
import { PackageCard } from '../components/PackageCard';
import { Screen, TopBar } from '../components/Screen';
import { FILTERS, matchesFilter, sortParcels, type FilterId } from '../lib/status';
import { useStore } from '../store/store';

const EMPTY_COPY: Record<FilterId, { title: string; body: string }> = {
  all: { title: 'אין כאן חבילות עדיין', body: 'הוסיפו מספר מעקב או חברו את תיבת המייל כדי להתחיל.' },
  transit: { title: 'אין חבילות בדרך', body: 'כל החבילות הפעילות שלכם כבר הגיעו.' },
  today: { title: 'שום דבר לא מגיע היום', body: 'נעדכן אתכם ברגע שחבילה תצא לחלוקה.' },
  action: { title: 'הכול מסודר', body: 'אין חבילות שממתינות לפעולה מצידכם.' },
};

export function PackagesPage() {
  const { parcels } = useStore();
  const [filter, setFilter] = useState<FilterId>('all');

  const counts = useMemo(() => {
    const result = {} as Record<FilterId, number>;
    for (const item of FILTERS) {
      result[item.id] = parcels.filter((parcel) => matchesFilter(parcel, item.id)).length;
    }
    return result;
  }, [parcels]);

  const visible = useMemo(
    () => sortParcels(parcels.filter((parcel) => matchesFilter(parcel, filter))),
    [parcels, filter],
  );

  return (
    <Screen
      header={<TopBar title="החבילות שלי" />}
      tabs
      floating={
        <Link
          to="/add"
          className="press absolute bottom-[84px] right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-brand-600 text-white shadow-fab"
          aria-label="הוספת חבילה"
        >
          <Icon name="plus" size={26} />
        </Link>
      }
    >
      <div className="px-4 pb-28 pt-1">
        <FilterTabs value={filter} counts={counts} onChange={setFilter} />

        <div className="mt-3 space-y-3">
          {visible.map((parcel) => (
            <PackageCard key={parcel.id} parcel={parcel} />
          ))}
        </div>

        {visible.length === 0 && (
          <EmptyState
            title={EMPTY_COPY[filter].title}
            body={EMPTY_COPY[filter].body}
            icon={filter === 'action' ? 'check' : 'box'}
            action={
              filter === 'all' ? (
                <Link to="/add" className="btn-primary w-full">
                  הוספת חבילה
                </Link>
              ) : undefined
            }
          />
        )}
      </div>
    </Screen>
  );
}
