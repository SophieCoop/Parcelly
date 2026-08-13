import { MILESTONE_ORDER, type Milestone, type Parcel } from '../types';
import { isToday, isPast } from './date';

export const MILESTONE_LABELS: Record<Milestone, string> = {
  ordered: 'הזמנה',
  shipped: 'נשלחה',
  arrived_country: 'הגיעה לישראל',
  out_for_delivery: 'בדרך אליך',
  delivered: 'נמסרה',
};

export type BadgeTone = 'ordered' | 'shipped' | 'transit' | 'pickup' | 'delivered' | 'action';

export interface Badge {
  label: string;
  tone: BadgeTone;
}

export function milestoneIndex(milestone: Milestone): number {
  return Math.max(0, MILESTONE_ORDER.indexOf(milestone));
}

/** 0…1 – how far along the card's progress track should be drawn. */
export function progress(parcel: Parcel): number {
  return milestoneIndex(parcel.status) / (MILESTONE_ORDER.length - 1);
}

export function hasOpenAction(parcel: Parcel): boolean {
  return Boolean(parcel.action && !parcel.action.resolvedAt);
}

export function badgeFor(parcel: Parcel): Badge {
  if (parcel.collected || parcel.status === 'delivered') {
    return { label: 'נמסרה', tone: 'delivered' };
  }
  // An open action is surfaced by the card's warning strip, so the badge keeps
  // showing where the parcel physically is.
  if (parcel.readyForPickup) return { label: 'מוכנה לאיסוף', tone: 'pickup' };
  switch (parcel.status) {
    case 'ordered':
      return { label: 'בהזמנה', tone: 'ordered' };
    case 'shipped':
      return { label: 'נשלחה', tone: 'shipped' };
    case 'arrived_country':
      return { label: 'בדרך', tone: 'transit' };
    case 'out_for_delivery':
      return { label: 'בדרך אליך', tone: 'transit' };
    default:
      return { label: 'בדרך', tone: 'transit' };
  }
}

/** The word that precedes the ETA on the card — "מגיע" / "מגיעה" / "נמסרה". */
export function etaCaption(parcel: Parcel): string {
  if (parcel.collected || parcel.status === 'delivered') return 'נמסרה';
  if (parcel.readyForPickup) return 'לאיסוף עד';
  return parcel.retailerId === 'aliexpress' ? 'מגיע' : 'מגיעה';
}

export function isDelivered(parcel: Parcel): boolean {
  return parcel.status === 'delivered' || Boolean(parcel.collected);
}

export function isActive(parcel: Parcel): boolean {
  return !parcel.archived && !isDelivered(parcel);
}

export function arrivesToday(parcel: Parcel): boolean {
  return isActive(parcel) && Boolean(parcel.eta) && isToday(parcel.eta!);
}

/** Late parcels: the ETA has passed but nothing was delivered. */
export function isDelayed(parcel: Parcel): boolean {
  return isActive(parcel) && Boolean(parcel.eta) && isPast(parcel.eta!);
}

export type FilterId = 'all' | 'transit' | 'today' | 'action';

export const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'all', label: 'הכל' },
  { id: 'transit', label: 'בדרך' },
  { id: 'today', label: 'מגיע היום' },
  { id: 'action', label: 'דורש פעולה' },
];

export function matchesFilter(parcel: Parcel, filter: FilterId): boolean {
  if (parcel.archived) return false;
  switch (filter) {
    case 'transit':
      return isActive(parcel) && !parcel.readyForPickup;
    case 'today':
      return arrivesToday(parcel) || Boolean(parcel.readyForPickup);
    case 'action':
      return hasOpenAction(parcel);
    default:
      return true;
  }
}

/** Sort: open actions first, then by ETA, then by last update. */
export function sortParcels(parcels: Parcel[]): Parcel[] {
  return [...parcels].sort((a, b) => {
    const delivered = Number(isDelivered(a)) - Number(isDelivered(b));
    if (delivered !== 0) return delivered;
    const action = Number(hasOpenAction(b)) - Number(hasOpenAction(a));
    if (action !== 0) return action;
    const etaA = a.eta ? new Date(a.eta).getTime() : Number.MAX_SAFE_INTEGER;
    const etaB = b.eta ? new Date(b.eta).getTime() : Number.MAX_SAFE_INTEGER;
    if (etaA !== etaB) return etaA - etaB;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}
