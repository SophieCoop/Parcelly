import { Link } from 'react-router-dom';
import { getRetailer } from '../data/retailers';
import { formatShortDate, formatWeekday } from '../lib/date';
import { badgeFor, etaCaption, hasOpenAction, milestoneIndex } from '../lib/status';
import type { Parcel } from '../types';
import { Icon } from './Icon';
import { ProgressTrack } from './ProgressTrack';
import { RetailerLogo } from './RetailerLogo';
import { StatusBadge } from './StatusBadge';

export function PackageCard({ parcel }: { parcel: Parcel }) {
  const retailer = getRetailer(parcel.retailerId);
  const badge = badgeFor(parcel);
  const cover = parcel.items[0]?.image ?? '📦';

  return (
    <Link
      to={`/package/${parcel.id}`}
      className="press block rounded-2xl p-4 shadow-card"
      style={{ backgroundColor: retailer.tint }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[12px] font-medium text-brand-400">{etaCaption(parcel)}</div>
          {parcel.eta ? (
            <>
              <div className="text-[22px] font-extrabold leading-tight text-brand-ink">
                {formatShortDate(parcel.eta)}
              </div>
              <div className="text-[12px] text-brand-400">{formatWeekday(parcel.eta)}</div>
            </>
          ) : (
            <div className="text-[17px] font-bold text-brand-ink">בהמתנה לעדכון</div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <StatusBadge label={badge.label} tone={badge.tone} />
          <RetailerLogo retailerId={parcel.retailerId} name={parcel.retailerName} />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[12px] text-brand-400">מספר מעקב</div>
          <div dir="ltr" className="truncate text-left text-[15px] font-semibold text-brand-ink">
            {parcel.trackingNumber}
          </div>
        </div>
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/70 text-2xl">
          {cover}
        </div>
      </div>

      <div className="mt-4">
        <ProgressTrack step={milestoneIndex(parcel.status)} color={retailer.accent} />
      </div>

      {hasOpenAction(parcel) && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-white/80 px-3 py-2 text-[12px] font-medium text-rose-700">
          <Icon name="alert" size={16} />
          <span className="truncate">{parcel.action?.message}</span>
        </div>
      )}
    </Link>
  );
}
