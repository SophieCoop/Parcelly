import { CARRIERS, detectCarrier } from '../data/carriers';
import { detectRetailer } from '../data/retailers';
import type { ActionType, Milestone } from '../types';
import { addDays, startOfDay, toISODate } from './date';

export interface ParsedMessage {
  trackingNumber?: string;
  carrierId?: string;
  retailerId?: string;
  retailerName?: string;
  orderNumber?: string;
  status?: Milestone;
  readyForPickup?: boolean;
  eta?: string;
  links: string[];
  action?: { type: ActionType; message: string; link?: string };
  pickupPointName?: string;
  /** 0…1 – how much of the message we actually understood. */
  confidence: number;
  raw: string;
}

/**
 * JavaScript's \b only knows ASCII word characters, so it never matches next to a
 * Hebrew letter. This stands in for "end of word" in Hebrew patterns.
 */
const HE_END = '(?![א-תA-Za-z0-9])';

const HEBREW_MONTHS: Record<string, number> = {
  ינואר: 0,
  פברואר: 1,
  מרץ: 2,
  מרס: 2,
  אפריל: 3,
  מאי: 4,
  יוני: 5,
  יולי: 6,
  אוגוסט: 7,
  ספטמבר: 8,
  אוקטובר: 9,
  נובמבר: 10,
  דצמבר: 11,
};

const WEEKDAYS: Record<string, number> = {
  ראשון: 0,
  שני: 1,
  שלישי: 2,
  רביעי: 3,
  חמישי: 4,
  שישי: 5,
  שבת: 6,
};

const LABELLED_TRACKING =
  /(?:מספר\s*מעקב|מס['׳"]?\s*מעקב|מעקב|משלוח\s*מספר|tracking\s*(?:number|no\.?|#)?|awb|consignment)\s*[:#\-–]?\s*([A-Z0-9][A-Z0-9\-]{6,25})/i;

const LABELLED_ORDER =
  /(?:מספר\s*הזמנה|הזמנה\s*מס['׳"]?|order\s*(?:number|no\.?|#)?)\s*[:#\-–]?\s*([A-Z0-9][A-Z0-9\-]{3,20})/i;

const URL_PATTERN = /https?:\/\/[^\s<>"'֐-׿]+/g;

/** Letters + digits, long enough to be a real tracking code. */
const GENERIC_TRACKING = /\b(?=[A-Z0-9]*[A-Z])(?=(?:[A-Z]*\d){4,})[A-Z0-9]{9,26}\b/g;

function cleanCode(code: string): string {
  return code.trim().replace(/[.,;:]$/, '').toUpperCase();
}

export function extractTrackingNumber(text: string): string | undefined {
  const upper = text.toUpperCase();

  const labelled = text.match(LABELLED_TRACKING);
  if (labelled?.[1]) return cleanCode(labelled[1]);

  for (const carrier of CARRIERS) {
    for (const pattern of carrier.patterns) {
      // Carrier patterns are anchored; test each whitespace-separated token.
      const source = pattern.source.replace(/^\^/, '').replace(/\$$/, '');
      const scanner = new RegExp(`\\b${source}\\b`, 'g');
      const match = scanner.exec(upper);
      if (match) return cleanCode(match[0]);
    }
  }

  const generic = upper.match(GENERIC_TRACKING);
  if (generic?.length) return cleanCode(generic[0]);
  return undefined;
}

export function extractOrderNumber(text: string): string | undefined {
  const match = text.match(LABELLED_ORDER);
  return match?.[1] ? cleanCode(match[1]) : undefined;
}

export function extractLinks(text: string): string[] {
  return Array.from(text.matchAll(URL_PATTERN)).map((match) =>
    match[0].replace(/[.,);]+$/, ''),
  );
}

/** Find a delivery date in Hebrew or numeric form; returns an ISO date. */
export function extractDate(text: string, now = new Date()): string | undefined {
  const hebrewMonth = text.match(
    /(\d{1,2})\s*ב?(ינואר|פברואר|מרץ|מרס|אפריל|מאי|יוני|יולי|אוגוסט|ספטמבר|אוקטובר|נובמבר|דצמבר)(?:\s*,?\s*(\d{4}))?/,
  );
  if (hebrewMonth) {
    const day = Number(hebrewMonth[1]);
    const month = HEBREW_MONTHS[hebrewMonth[2]];
    const year = hebrewMonth[3] ? Number(hebrewMonth[3]) : now.getFullYear();
    const date = new Date(year, month, day);
    // A bare date that already passed is far more likely to mean next year.
    if (!hebrewMonth[3] && date.getTime() < startOfDay(now).getTime() - 30 * 86_400_000) {
      date.setFullYear(year + 1);
    }
    return toISODate(date);
  }

  const numeric = text.match(/\b(\d{1,2})[./\-](\d{1,2})(?:[./\-](\d{2,4}))?\b/);
  if (numeric) {
    const day = Number(numeric[1]);
    const month = Number(numeric[2]) - 1;
    let year = numeric[3] ? Number(numeric[3]) : now.getFullYear();
    if (year < 100) year += 2000;
    if (day >= 1 && day <= 31 && month >= 0 && month <= 11) {
      return toISODate(new Date(year, month, day));
    }
  }

  if (new RegExp(`מחר${HE_END}`).test(text)) return toISODate(addDays(now, 1));
  if (new RegExp(`היום${HE_END}`).test(text)) return toISODate(now);

  const weekday = text.match(/יום\s+(ראשון|שני|שלישי|רביעי|חמישי|שישי|שבת)/);
  if (weekday) {
    const target = WEEKDAYS[weekday[1]];
    const diff = (target - now.getDay() + 7) % 7 || 7;
    return toISODate(addDays(now, diff));
  }
  return undefined;
}

interface StatusHint {
  status: Milestone;
  readyForPickup?: boolean;
  patterns: RegExp[];
}

const STATUS_HINTS: StatusHint[] = [
  {
    status: 'delivered',
    patterns: [
      new RegExp(`נמסר[הת]?${HE_END}`),
      new RegExp(`סופק[הת]?${HE_END}`),
      new RegExp(`נאספה?${HE_END}`),
      /\bdelivered\b/i,
      /\bpicked up\b/i,
    ],
  },
  {
    status: 'out_for_delivery',
    readyForPickup: true,
    patterns: [
      /ממתינ[הת]\s*לאיסוף/,
      /מוכנ[הת]\s*לאיסוף/,
      /הגיעה\s*לנקודת\s*(?:ה?איסוף|חלוקה)/,
      /ניתן\s*לאסוף/,
      /\bready for (?:pickup|collection)\b/i,
      /\bavailable for pickup\b/i,
    ],
  },
  {
    status: 'out_for_delivery',
    patterns: [
      /יצא[הת]?\s*למשלוח/,
      /השליח\s*בדרך/,
      /בדרך\s*אלי[ךיכ]/,
      /\bout for delivery\b/i,
    ],
  },
  {
    status: 'arrived_country',
    patterns: [
      /הגיעה?\s*לישראל/,
      /נחת[הת]?\s*בישראל/,
      /שחרור\s*מכס/,
      new RegExp(`במכס${HE_END}`),
      /\barrived (?:in|at) (?:destination|israel)\b/i,
      /\bcustoms\b/i,
    ],
  },
  {
    status: 'shipped',
    patterns: [
      new RegExp(`נשלח[הת]?${HE_END}`),
      /יצא[הת]?\s*מהמחסן/,
      /נאספה?\s*מהמוכר/,
      /\bshipped\b/i,
      /\bdispatched\b/i,
      /\bin transit\b/i,
    ],
  },
  {
    status: 'ordered',
    patterns: [/ההזמנה\s*התקבלה/, /אושר[הת]?\s*ההזמנה/, /\border (?:placed|confirmed)\b/i],
  },
];

export function extractStatus(text: string): { status?: Milestone; readyForPickup?: boolean } {
  for (const hint of STATUS_HINTS) {
    if (hint.patterns.some((pattern) => pattern.test(text))) {
      return { status: hint.status, readyForPickup: hint.readyForPickup };
    }
  }
  return {};
}

const ACTION_HINTS: { type: ActionType; message: string; patterns: RegExp[] }[] = [
  {
    type: 'choose_pickup',
    message: 'ההודעה כוללת קישור לשינוי נקודת האיסוף',
    patterns: [/נקודת\s*איסוף/, /שינוי\s*כתובת/, /בחר[יו]?\s*נקודה/, /\bpickup point\b/i],
  },
  {
    type: 'customs',
    message: 'נדרשת הצהרת מכס לשחרור החבילה',
    patterns: [/הצהרת\s*מכס/, /נדרש\s*שחרור/, /\bcustoms declaration\b/i],
  },
  {
    type: 'payment',
    message: 'נדרש תשלום מיסים לשחרור החבילה',
    patterns: [/נדרש\s*תשלום/, /תשלום\s*מיסים/, /מע["׳']?מ\s*לתשלום/, /\bpayment required\b/i],
  },
  {
    type: 'failed_delivery',
    message: 'ניסיון מסירה נכשל – יש לתאם מסירה מחדש',
    patterns: [/ניסיון\s*מסירה/, /לא\s*נמצא[תה]?\s*בכתובת/, /\bdelivery attempt failed\b/i],
  },
  {
    type: 'address_missing',
    message: 'חסרים פרטי כתובת למשלוח',
    patterns: [/חסר[יםה]?\s*פרטי\s*כתובת/, /נא\s*להשלים\s*כתובת/, /\baddress (?:is )?missing\b/i],
  },
];

function extractAction(text: string, links: string[]) {
  for (const hint of ACTION_HINTS) {
    if (hint.patterns.some((pattern) => pattern.test(text))) {
      return { type: hint.type, message: hint.message, link: links[0] };
    }
  }
  return undefined;
}

function extractPickupPointName(text: string): string | undefined {
  const match = text.match(/נקודת\s*(?:ה?איסוף)\s*[:\-–]?\s*([^\n,.]{3,40})/);
  return match?.[1]?.trim();
}

/**
 * Pull everything we can out of a shipping SMS or email body.
 * Returns undefined when the text has no tracking number and no shipping signal.
 */
export function parseMessage(text: string, now = new Date()): ParsedMessage | undefined {
  const raw = text.trim();
  if (!raw) return undefined;

  const trackingNumber = extractTrackingNumber(raw);
  const retailer = detectRetailer(raw);
  const { status, readyForPickup } = extractStatus(raw);
  const links = extractLinks(raw);
  const eta = extractDate(raw, now);
  const orderNumber = extractOrderNumber(raw);
  const action = extractAction(raw, links);

  const signals = [trackingNumber, retailer, status, eta, action].filter(Boolean).length;
  if (!trackingNumber && signals < 2) return undefined;

  const carrier = trackingNumber ? detectCarrier(trackingNumber, raw) : undefined;
  const confidence = Math.min(
    1,
    (trackingNumber ? 0.45 : 0) +
      (retailer && retailer.id !== 'other' ? 0.2 : 0) +
      (status ? 0.15 : 0) +
      (eta ? 0.12 : 0) +
      (carrier && carrier.id !== 'other' ? 0.08 : 0),
  );

  return {
    trackingNumber,
    carrierId: carrier?.id,
    retailerId: retailer?.id,
    retailerName: retailer?.name,
    orderNumber,
    status,
    readyForPickup,
    eta,
    links,
    action,
    pickupPointName: extractPickupPointName(raw),
    confidence,
    raw,
  };
}
