import { Link } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';
import { Icon } from '../components/Icon';
import { PackageCard } from '../components/PackageCard';
import { PageHeader, Screen } from '../components/Screen';
import { hasOpenAction, isDelayed, sortParcels } from '../lib/status';
import { useStore } from '../store/store';

export function ActionRequiredPage() {
  const { parcels } = useStore();
  const needsAction = sortParcels(
    parcels.filter((parcel) => !parcel.archived && (hasOpenAction(parcel) || isDelayed(parcel))),
  );

  return (
    <Screen header={<PageHeader title="דורש פעולה" subtle />}>
      <div className="px-4 pb-10">
        {needsAction.length > 0 && (
          <p className="flex items-start gap-2 rounded-2xl bg-amber-50 px-3.5 py-3 text-[13px] leading-relaxed text-amber-800">
            <Icon name="alert" size={17} className="mt-0.5 shrink-0" />
            החבילות האלה ממתינות לפעולה מצידכם – בחירת נקודת איסוף, שחרור מכס או תיאום מסירה מחדש.
          </p>
        )}

        <div className="mt-3 space-y-3">
          {needsAction.map((parcel) => (
            <PackageCard key={parcel.id} parcel={parcel} />
          ))}
        </div>

        {needsAction.length === 0 && (
          <EmptyState
            icon="check"
            title="הכול מסודר"
            body="אין חבילות שממתינות לפעולה."
            action={
              <Link to="/" className="btn-ghost w-full">
                חזרה לחבילות שלי
              </Link>
            }
          />
        )}
      </div>
    </Screen>
  );
}
