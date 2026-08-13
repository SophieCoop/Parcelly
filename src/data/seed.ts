import { addDays, toISODate } from '../lib/date';
import { buildEvents, uid } from '../lib/factory';
import type {
  Address,
  AppNotification,
  ConnectedSource,
  Parcel,
  PickupPoint,
  Settings,
} from '../types';

const now = new Date();
const eta = (days: number) => toISODate(addDays(now, days));
const ago = (days: number, hours = 0) =>
  new Date(now.getTime() - days * 86_400_000 - hours * 3_600_000).toISOString();

export const HOME_ADDRESS: Address = {
  id: 'addr_home',
  label: 'בית',
  recipient: 'סופי כהן',
  street: 'רחוב הרצל 20',
  city: 'רחובות',
  zip: '7630520',
  phone: '050-1234567',
  notes: 'קומה 3, דירה 12',
  isDefault: true,
};

export const WORK_ADDRESS: Address = {
  id: 'addr_work',
  label: 'עבודה',
  recipient: 'סופי כהן',
  street: 'דרך מנחם בגין 132',
  city: 'תל אביב',
  zip: '6701101',
  phone: '050-1234567',
  notes: 'קבלה בלובי, קומה 1',
};

export const PICKUP_POINTS: PickupPoint[] = [
  {
    id: 'pp_super',
    name: 'סופר פארם – מרכז רחובות',
    address: 'רחוב הרצל 152',
    city: 'רחובות',
    phone: '08-9300000',
    code: '4821',
    distanceKm: 0.8,
    hours: [
      { day: 0, open: '09:00', close: '21:00' },
      { day: 1, open: '09:00', close: '21:00' },
      { day: 2, open: '09:00', close: '21:00' },
      { day: 3, open: '09:00', close: '21:00' },
      { day: 4, open: '09:00', close: '21:00' },
      { day: 5, open: '09:00', close: '14:00' },
      { day: 6, open: '', close: '', closed: true },
    ],
  },
  {
    id: 'pp_locker',
    name: 'לוקר BOXIT – קניון רחובות',
    address: 'שדרות חן 2',
    city: 'רחובות',
    code: '9134',
    distanceKm: 1.6,
    hours: [
      { day: 0, open: '00:00', close: '23:59' },
      { day: 1, open: '00:00', close: '23:59' },
      { day: 2, open: '00:00', close: '23:59' },
      { day: 3, open: '00:00', close: '23:59' },
      { day: 4, open: '00:00', close: '23:59' },
      { day: 5, open: '00:00', close: '23:59' },
      { day: 6, open: '00:00', close: '23:59' },
    ],
  },
  {
    id: 'pp_kiosk',
    name: 'נקודת איסוף – פיצוציית המרכז',
    address: 'רחוב יעקב 8',
    city: 'נס ציונה',
    phone: '08-9401122',
    code: '2270',
    distanceKm: 4.2,
    hours: [
      { day: 0, open: '08:00', close: '20:00' },
      { day: 1, open: '08:00', close: '20:00' },
      { day: 2, open: '08:00', close: '20:00' },
      { day: 3, open: '08:00', close: '20:00' },
      { day: 4, open: '08:00', close: '20:00' },
      { day: 5, open: '08:00', close: '13:00' },
      { day: 6, open: '', close: '', closed: true },
    ],
  },
];

function parcel(input: Omit<Parcel, 'id' | 'events' | 'createdAt' | 'updatedAt'> & { id: string; createdDaysAgo: number }): Parcel {
  const { createdDaysAgo, ...rest } = input;
  return {
    ...rest,
    events: buildEvents(rest.status, rest.eta ?? eta(0), now),
    createdAt: ago(createdDaysAgo),
    updatedAt: ago(0, 4),
  };
}

export const SEED_PARCELS: Parcel[] = [
  parcel({
    id: 'pk_ali',
    createdDaysAgo: 11,
    retailerId: 'aliexpress',
    trackingNumber: 'LP123456789CN',
    carrierId: 'cainiao',
    orderNumber: '8172634510',
    status: 'arrived_country',
    eta: eta(3),
    source: 'aliexpress',
    total: 74.9,
    currency: '₪',
    items: [
      { id: uid('it'), title: 'מטען מהיר USB-C 65W', quantity: 1, price: 49.9, currency: '₪', image: '🔌' },
      { id: uid('it'), title: 'כבל טעינה קלוע 2 מ׳', quantity: 2, price: 12.5, currency: '₪', image: '🔗' },
    ],
    delivery: {
      method: 'home',
      address: HOME_ADDRESS,
      canChange: true,
      changeLink: 'https://global.cainiao.com',
      window: '09:00–18:00',
    },
    seller: {
      name: 'TechLife Official Store',
      storeUrl: 'https://www.aliexpress.com',
      chatUrl: 'https://www.aliexpress.com/p/message',
      supportHours: 'א׳–ו׳, 09:00–18:00 (GMT+8)',
    },
  }),
  parcel({
    id: 'pk_shein',
    createdDaysAgo: 9,
    retailerId: 'shein',
    trackingNumber: 'SH123456789CN',
    carrierId: 'china-post',
    orderNumber: 'GSHMTA0K2',
    status: 'out_for_delivery',
    eta: eta(5),
    source: 'shein',
    total: 189.0,
    currency: '₪',
    items: [
      { id: uid('it'), title: 'סניקרס לבנות – מידה 38', quantity: 1, price: 139, currency: '₪', image: '👟', variant: 'לבן' },
      { id: uid('it'), title: 'גרביים נמוכות – מארז 5', quantity: 1, price: 50, currency: '₪', image: '🧦' },
    ],
    delivery: {
      method: 'pickup',
      address: HOME_ADDRESS,
      pickupPoint: PICKUP_POINTS[0],
      canChange: true,
      changeLink: 'https://www.shein.com/user/orders',
    },
    action: {
      type: 'choose_pickup',
      message: 'ההודעה כוללת קישור לשינוי נקודת האיסוף',
      link: 'https://www.shein.com/user/orders',
    },
    seller: {
      name: 'SHEIN',
      storeUrl: 'https://www.shein.com',
      email: 'service@shein.com',
      supportHours: 'א׳–ה׳, 08:00–20:00',
    },
  }),
  parcel({
    id: 'pk_iherb',
    createdDaysAgo: 6,
    retailerId: 'iherb',
    trackingNumber: 'IH123456789US',
    carrierId: 'other',
    orderNumber: 'IH-55210934',
    status: 'shipped',
    eta: eta(7),
    source: 'email',
    total: 232.4,
    currency: '₪',
    items: [
      { id: uid('it'), title: 'ויטמין D3 5000IU – 120 כמוסות', quantity: 1, price: 62, currency: '₪', image: '💊' },
      { id: uid('it'), title: 'מגנזיום ציטרט – 240 טבליות', quantity: 1, price: 88, currency: '₪', image: '🧴' },
      { id: uid('it'), title: 'חטיפי חלבון – מארז 12', quantity: 1, price: 82.4, currency: '₪', image: '🍫' },
    ],
    delivery: {
      method: 'home',
      address: HOME_ADDRESS,
      canChange: true,
      window: '08:00–20:00',
      instructions: 'להשאיר אצל השכן אם אין מענה',
    },
    seller: {
      name: 'iHerb',
      storeUrl: 'https://www.iherb.com',
      email: 'cs@iherb.com',
      supportHours: '24/7',
    },
  }),
  parcel({
    id: 'pk_zara',
    createdDaysAgo: 4,
    retailerId: 'zara',
    trackingNumber: 'ZA987654321ES',
    carrierId: 'other',
    orderNumber: 'ZR-4471028',
    status: 'arrived_country',
    eta: eta(9),
    source: 'email',
    total: 349.9,
    currency: '₪',
    items: [
      { id: uid('it'), title: 'ג׳קט אוברסייז – שחור', quantity: 1, price: 249.9, currency: '₪', image: '🧥', variant: 'M' },
      { id: uid('it'), title: 'חולצת פסים בייסיק', quantity: 1, price: 100, currency: '₪', image: '👕', variant: 'S' },
    ],
    delivery: {
      method: 'locker',
      pickupPoint: PICKUP_POINTS[1],
      canChange: true,
      changeLink: 'https://www.zara.com/il/he/help-center.html',
    },
    seller: {
      name: 'ZARA',
      storeUrl: 'https://www.zara.com',
      phone: '1-800-800-121',
      supportHours: 'א׳–ה׳, 09:00–17:00',
    },
  }),
  parcel({
    id: 'pk_temu',
    createdDaysAgo: 14,
    retailerId: 'temu',
    trackingNumber: 'TM445120983IL',
    carrierId: 'israel-post',
    orderNumber: 'PO-21095512',
    status: 'delivered',
    eta: eta(-2),
    collected: true,
    source: 'temu',
    total: 58.2,
    currency: '₪',
    items: [{ id: uid('it'), title: 'מארגן שולחן 4 תאים', quantity: 1, price: 58.2, currency: '₪', image: '🗂️' }],
    delivery: { method: 'home', address: HOME_ADDRESS, canChange: false },
    seller: { name: 'Temu', storeUrl: 'https://www.temu.com', supportHours: '24/7' },
  }),
  parcel({
    id: 'pk_amazon',
    createdDaysAgo: 26,
    retailerId: 'amazon',
    trackingNumber: 'TBA903184455210',
    carrierId: 'amazon-logistics',
    orderNumber: '405-7712398-2210',
    status: 'delivered',
    eta: eta(-12),
    collected: true,
    archived: true,
    source: 'email',
    total: 412.0,
    currency: '₪',
    items: [{ id: uid('it'), title: 'אוזניות Bluetooth עם ביטול רעשים', quantity: 1, price: 412, currency: '₪', image: '🎧' }],
    delivery: { method: 'home', address: WORK_ADDRESS, canChange: false },
    seller: { name: 'Amazon', storeUrl: 'https://www.amazon.com', supportHours: '24/7' },
  }),
];

export const SEED_NOTIFICATIONS: AppNotification[] = [
  {
    id: uid('nt'),
    parcelId: 'pk_shein',
    kind: 'action',
    title: 'החבילה מ‑SHEIN ממתינה לבחירת נקודת איסוף',
    body: 'ניתן לשנות את נקודת האיסוף עד 24 שעות לפני ההגעה.',
    date: ago(0, 3),
  },
  {
    id: uid('nt'),
    parcelId: 'pk_ali',
    kind: 'update',
    title: 'החבילה מ‑AliExpress הגיעה לישראל',
    body: 'החבילה עברה לשחרור מכס ותצא לחלוקה בימים הקרובים.',
    date: ago(0, 9),
  },
  {
    id: uid('nt'),
    parcelId: 'pk_iherb',
    kind: 'update',
    title: 'ההזמנה מ‑iHerb יצאה לדרך',
    body: 'מספר מעקב IH123456789US התקבל ומעודכן במעקב.',
    date: ago(1, 2),
    read: true,
  },
  {
    id: uid('nt'),
    parcelId: 'pk_temu',
    kind: 'delivered',
    title: 'החבילה מ‑Temu נמסרה',
    body: 'החבילה נמסרה בכתובת רחוב הרצל 20, רחובות.',
    date: ago(2, 5),
    read: true,
  },
];

export const SEED_SOURCES: ConnectedSource[] = [
  {
    id: 'gmail',
    name: 'Gmail',
    kind: 'email',
    connected: true,
    lastSync: ago(0, 1),
    description: 'סריקת אישורי הזמנה ועדכוני משלוח מתיבת הדואר',
  },
  {
    id: 'outlook',
    name: 'Outlook',
    kind: 'email',
    connected: false,
    description: 'חיבור תיבת Outlook או Hotmail',
  },
  {
    id: 'sms',
    name: 'הודעות SMS',
    kind: 'sms',
    connected: true,
    lastSync: ago(0, 4),
    description: 'הדבקת הודעות מהשליח לזיהוי אוטומטי',
  },
  {
    id: 'aliexpress',
    name: 'AliExpress',
    kind: 'store',
    connected: true,
    lastSync: ago(0, 2),
    description: 'סנכרון הזמנות ומספרי מעקב מהחשבון',
  },
  {
    id: 'shein',
    name: 'SHEIN',
    kind: 'store',
    connected: true,
    lastSync: ago(0, 6),
    description: 'סנכרון הזמנות מהחשבון שלך',
  },
  {
    id: 'temu',
    name: 'Temu',
    kind: 'store',
    connected: false,
    description: 'סנכרון הזמנות מהחשבון שלך',
  },
  {
    id: 'amazon',
    name: 'Amazon',
    kind: 'store',
    connected: false,
    description: 'סנכרון הזמנות מהחשבון שלך',
  },
];

export const SEED_SETTINGS: Settings = {
  pushEnabled: true,
  emailDigest: false,
  notifyOnShipped: true,
  notifyOnArrival: true,
  notifyOnDelay: true,
  autoArchiveDays: 30,
  userName: 'סופי',
  userEmail: 'sofi@example.com',
};

export const SEED_ADDRESSES: Address[] = [HOME_ADDRESS, WORK_ADDRESS];
