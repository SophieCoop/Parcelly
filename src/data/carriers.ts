/** Carriers and the tracking-number shapes used to recognise them. */

export interface Carrier {
  id: string;
  name: string;
  /** Patterns that identify a tracking number belonging to this carrier. */
  patterns: RegExp[];
  /** Tracking page; `{tracking}` is replaced with the number. */
  trackUrl?: string;
  keywords?: string[];
}

export const CARRIERS: Carrier[] = [
  {
    id: 'israel-post',
    name: 'דואר ישראל',
    patterns: [/^[A-Z]{2}\d{9}IL$/],
    trackUrl: 'https://mypost.israelpost.co.il/itemtrace?itemcode={tracking}',
    keywords: ['דואר ישראל', 'israel post', 'דואר רשום'],
  },
  {
    id: 'china-post',
    name: 'China Post / ePacket',
    patterns: [/^[A-Z]{2}\d{9}CN$/],
    trackUrl: 'https://global.cainiao.com/detail.htm?mailNoList={tracking}',
    keywords: ['china post', 'epacket', 'צ׳יינה פוסט'],
  },
  {
    id: 'cainiao',
    name: 'Cainiao',
    patterns: [/^(LP|LZ|LY|LX)\d{8,16}$/],
    trackUrl: 'https://global.cainiao.com/detail.htm?mailNoList={tracking}',
    keywords: ['cainiao', 'קאיניאו', 'aliexpress standard'],
  },
  {
    id: 'ups',
    name: 'UPS',
    patterns: [/^1Z[0-9A-Z]{16}$/],
    trackUrl: 'https://www.ups.com/track?tracknum={tracking}',
    keywords: ['ups'],
  },
  {
    id: 'dhl',
    name: 'DHL',
    patterns: [/^\d{10}$/, /^JD\d{16,18}$/],
    trackUrl: 'https://www.dhl.com/il-en/home/tracking.html?tracking-id={tracking}',
    keywords: ['dhl'],
  },
  {
    id: 'fedex',
    name: 'FedEx',
    patterns: [/^\d{12}$/, /^\d{15}$/],
    trackUrl: 'https://www.fedex.com/fedextrack/?trknbr={tracking}',
    keywords: ['fedex'],
  },
  {
    id: 'amazon-logistics',
    name: 'Amazon Logistics',
    patterns: [/^TBA\d{12}$/],
    trackUrl: 'https://track.amazon.com/tracking/{tracking}',
    keywords: ['amazon logistics', 'amzl'],
  },
  {
    id: 'hfd',
    name: 'HFD',
    patterns: [/^HFD\d{6,12}$/],
    trackUrl: 'https://hfd.co.il/track/{tracking}',
    keywords: ['hfd', 'אצ״ל', 'חברת שליחויות hfd'],
  },
  {
    id: 'chita',
    name: 'צ׳יטה שליחויות',
    patterns: [/^CH\d{8,12}$/],
    keywords: ['צ׳יטה', 'chita'],
  },
  {
    id: 'boxit',
    name: 'BOXIT',
    patterns: [/^BX\d{6,12}$/],
    trackUrl: 'https://www.box-it.co.il',
    keywords: ['boxit', 'בוקסיט', 'לוקר'],
  },
  {
    id: 'other',
    name: 'שליח',
    patterns: [],
  },
];

/** Anything that plausibly looks like a tracking number. */
export const GENERIC_TRACKING = /\b(?=[A-Z0-9-]{8,26}\b)(?=.*\d)[A-Z0-9][A-Z0-9-]{6,24}[A-Z0-9]\b/g;

export function getCarrier(id: string | undefined): Carrier {
  return CARRIERS.find((c) => c.id === id) ?? CARRIERS[CARRIERS.length - 1];
}

/** Identify the carrier from the tracking number's shape, then from context. */
export function detectCarrier(trackingNumber: string, context = ''): Carrier {
  const code = trackingNumber.trim().toUpperCase();
  for (const carrier of CARRIERS) {
    if (carrier.patterns.some((pattern) => pattern.test(code))) return carrier;
  }
  const haystack = context.toLowerCase();
  for (const carrier of CARRIERS) {
    if (carrier.keywords?.some((keyword) => haystack.includes(keyword))) return carrier;
  }
  return getCarrier('other');
}

export function trackingUrl(carrierId: string, trackingNumber: string): string | undefined {
  const carrier = getCarrier(carrierId);
  return carrier.trackUrl?.replace('{tracking}', encodeURIComponent(trackingNumber));
}
