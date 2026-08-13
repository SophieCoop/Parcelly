/** Core domain model for Parcelly. */

/** The five milestones every parcel moves through, in order. */
export type Milestone =
  | 'ordered'
  | 'shipped'
  | 'arrived_country'
  | 'out_for_delivery'
  | 'delivered';

export const MILESTONE_ORDER: Milestone[] = [
  'ordered',
  'shipped',
  'arrived_country',
  'out_for_delivery',
  'delivered',
];

/** How the parcel reaches its owner. */
export type DeliveryMethod = 'home' | 'pickup' | 'locker';

/** Where a parcel's data came from. */
export type ParcelSource =
  | 'manual'
  | 'sms'
  | 'email'
  | 'aliexpress'
  | 'shein'
  | 'temu'
  | 'amazon';

export type ActionType =
  | 'choose_pickup'
  | 'customs'
  | 'payment'
  | 'address_missing'
  | 'failed_delivery';

export interface ParcelAction {
  type: ActionType;
  message: string;
  /** External link (e.g. the carrier's "change pickup point" page). */
  link?: string;
  resolvedAt?: string;
}

export interface OpeningHours {
  /** 0 = Sunday … 6 = Saturday, matching Date#getDay. */
  day: number;
  open: string;
  close: string;
  closed?: boolean;
}

export interface PickupPoint {
  id: string;
  name: string;
  address: string;
  city: string;
  phone?: string;
  /** Code the courier asks for at the counter. */
  code?: string;
  hours: OpeningHours[];
  /** How long the parcel is kept before it is returned. */
  holdUntil?: string;
  distanceKm?: number;
}

export interface Address {
  id: string;
  label: string;
  recipient: string;
  street: string;
  city: string;
  zip?: string;
  phone?: string;
  notes?: string;
  isDefault?: boolean;
}

export interface DeliveryInfo {
  method: DeliveryMethod;
  address?: Address;
  pickupPoint?: PickupPoint;
  /** Whether the carrier still allows re-routing this parcel. */
  canChange: boolean;
  /** Deep link to the carrier page that performs the change. */
  changeLink?: string;
  /** Delivery window on the estimated day, e.g. "09:00–18:00". */
  window?: string;
  instructions?: string;
}

export interface ParcelItem {
  id: string;
  title: string;
  quantity: number;
  price?: number;
  currency?: string;
  /** Emoji stand-in for the product photo. */
  image?: string;
  variant?: string;
  url?: string;
}

export interface TrackingEvent {
  id: string;
  milestone: Milestone;
  /** Free-text description shown in the timeline. */
  label: string;
  date: string;
  location?: string;
}

export interface SellerContact {
  name: string;
  storeUrl?: string;
  email?: string;
  phone?: string;
  chatUrl?: string;
  supportHours?: string;
}

export interface Parcel {
  id: string;
  /** Key into the retailer registry, or 'other'. */
  retailerId: string;
  /** Display name, used when retailerId is 'other'. */
  retailerName?: string;
  trackingNumber: string;
  carrierId: string;
  orderNumber?: string;
  status: Milestone;
  /** ISO date of the estimated arrival. */
  eta?: string;
  /** Set once the parcel is waiting at a pickup point. */
  readyForPickup?: boolean;
  collected?: boolean;
  items: ParcelItem[];
  delivery: DeliveryInfo;
  action?: ParcelAction;
  events: TrackingEvent[];
  seller?: SellerContact;
  source: ParcelSource;
  createdAt: string;
  updatedAt: string;
  archived?: boolean;
  /** Total paid, for the order history screen. */
  total?: number;
  currency?: string;
}

export interface AppNotification {
  id: string;
  parcelId?: string;
  title: string;
  body: string;
  date: string;
  read?: boolean;
  kind: 'update' | 'action' | 'delivered' | 'delay';
}

export interface ConnectedSource {
  id: string;
  name: string;
  kind: 'email' | 'store' | 'sms';
  connected: boolean;
  lastSync?: string;
  description: string;
}

export interface Settings {
  pushEnabled: boolean;
  emailDigest: boolean;
  notifyOnShipped: boolean;
  notifyOnArrival: boolean;
  notifyOnDelay: boolean;
  autoArchiveDays: number;
  userName: string;
  userEmail: string;
}
