import { detectCarrier } from '../data/carriers';
import { MILESTONE_ORDER, type Milestone, type Parcel, type TrackingEvent } from '../types';
import { addDays, toISODate } from './date';
import { MILESTONE_LABELS, milestoneIndex } from './status';
import type { ParsedMessage } from './parse';

export function uid(prefix = 'p'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;
}

/** Days each milestone typically happens before the estimated arrival. */
const OFFSET_FROM_ETA: Record<Milestone, number> = {
  ordered: -11,
  shipped: -9,
  arrived_country: -3,
  out_for_delivery: -1,
  delivered: 0,
};

const LOCATIONS: Record<Milestone, string> = {
  ordered: 'אושרה אצל המוכר',
  shipped: 'מרכז מיון, שנזן',
  arrived_country: 'נמל תעופה בן גוריון',
  out_for_delivery: 'מרכז חלוקה, מודיעין',
  delivered: 'נמסרה ליעד',
};

/** Build the tracking history implied by a parcel's current milestone. */
export function buildEvents(status: Milestone, eta: string, now = new Date()): TrackingEvent[] {
  const reached = milestoneIndex(status);
  const events: TrackingEvent[] = [];
  for (let index = 0; index <= reached; index += 1) {
    const milestone = MILESTONE_ORDER[index];
    const planned = addDays(eta, OFFSET_FROM_ETA[milestone]);
    const date = planned.getTime() > now.getTime() ? now : planned;
    events.push({
      id: uid('ev'),
      milestone,
      label: MILESTONE_LABELS[milestone],
      date: date.toISOString(),
      location: LOCATIONS[milestone],
    });
  }
  return events;
}

export interface ParcelDraft {
  retailerId?: string;
  retailerName?: string;
  trackingNumber: string;
  carrierId?: string;
  orderNumber?: string;
  status?: Milestone;
  readyForPickup?: boolean;
  eta?: string;
  source?: Parcel['source'];
  items?: Parcel['items'];
  delivery?: Partial<Parcel['delivery']>;
  action?: Parcel['action'];
}

export function buildParcel(draft: ParcelDraft, now = new Date()): Parcel {
  const status = draft.status ?? 'shipped';
  const eta = draft.eta ?? toISODate(addDays(now, 7));
  const timestamp = now.toISOString();

  return {
    id: uid(),
    retailerId: draft.retailerId ?? 'other',
    retailerName: draft.retailerName,
    trackingNumber: draft.trackingNumber.toUpperCase(),
    carrierId: draft.carrierId ?? detectCarrier(draft.trackingNumber).id,
    orderNumber: draft.orderNumber,
    status,
    readyForPickup: draft.readyForPickup,
    eta,
    items: draft.items ?? [],
    delivery: {
      method: draft.delivery?.method ?? 'home',
      address: draft.delivery?.address,
      pickupPoint: draft.delivery?.pickupPoint,
      canChange: draft.delivery?.canChange ?? status !== 'delivered',
      changeLink: draft.delivery?.changeLink,
      window: draft.delivery?.window,
      instructions: draft.delivery?.instructions,
    },
    action: draft.action,
    events: buildEvents(status, eta, now),
    source: draft.source ?? 'manual',
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

/** Turn a parsed SMS/email into a parcel draft ready to be saved. */
export function draftFromParsed(parsed: ParsedMessage): ParcelDraft {
  return {
    retailerId: parsed.retailerId,
    retailerName: parsed.retailerName,
    trackingNumber: parsed.trackingNumber ?? '',
    carrierId: parsed.carrierId,
    orderNumber: parsed.orderNumber,
    status: parsed.status,
    readyForPickup: parsed.readyForPickup,
    eta: parsed.eta,
    source: 'sms',
    action: parsed.action
      ? { type: parsed.action.type, message: parsed.action.message, link: parsed.action.link }
      : undefined,
    delivery: parsed.action?.type === 'choose_pickup' ? { canChange: true, changeLink: parsed.links[0] } : undefined,
  };
}
