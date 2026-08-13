/** Retailer registry: branding used for the wordmark and the card tint. */

export interface Retailer {
  id: string;
  name: string;
  /** Wordmark colour. */
  color: string;
  /** Very light card background, as in the design. */
  tint: string;
  /** Accent used for the progress track. */
  accent: string;
  /** Font treatment for the wordmark. */
  mark: 'sans' | 'serif' | 'wide' | 'condensed';
  /** Words that identify this retailer in an SMS or email. */
  keywords: string[];
  site?: string;
  supportUrl?: string;
}

export const RETAILERS: Record<string, Retailer> = {
  aliexpress: {
    id: 'aliexpress',
    name: 'AliExpress',
    color: '#E62E04',
    tint: '#F6F3FF',
    accent: '#6C35DC',
    mark: 'sans',
    keywords: ['aliexpress', 'ali express', 'cainiao', 'עליאקספרס', 'אליאקספרס'],
    site: 'https://www.aliexpress.com',
    supportUrl: 'https://helppage.aliexpress.com',
  },
  shein: {
    id: 'shein',
    name: 'SHEIN',
    color: '#111111',
    tint: '#FEF8E7',
    accent: '#F0B429',
    mark: 'serif',
    keywords: ['shein', 'שיין'],
    site: 'https://www.shein.com',
    supportUrl: 'https://www.shein.com/support',
  },
  temu: {
    id: 'temu',
    name: 'Temu',
    color: '#FB7701',
    tint: '#FFF4EA',
    accent: '#FB7701',
    mark: 'sans',
    keywords: ['temu', 'טמו'],
    site: 'https://www.temu.com',
    supportUrl: 'https://www.temu.com/support-center.html',
  },
  amazon: {
    id: 'amazon',
    name: 'amazon',
    color: '#232F3E',
    tint: '#FFF7EC',
    accent: '#FF9900',
    mark: 'sans',
    keywords: ['amazon', 'אמזון', 'tba'],
    site: 'https://www.amazon.com',
    supportUrl: 'https://www.amazon.com/gp/help/customer/display.html',
  },
  iherb: {
    id: 'iherb',
    name: 'iHerb',
    color: '#3E9B49',
    tint: '#F1FAF2',
    accent: '#3E9B49',
    mark: 'sans',
    keywords: ['iherb', 'איהרב'],
    site: 'https://www.iherb.com',
    supportUrl: 'https://www.iherb.com/info/contact',
  },
  zara: {
    id: 'zara',
    name: 'ZARA',
    color: '#111111',
    tint: '#F1F6FE',
    accent: '#3B82F6',
    mark: 'condensed',
    keywords: ['zara', 'זארה'],
    site: 'https://www.zara.com',
    supportUrl: 'https://www.zara.com/il/he/help-center.html',
  },
  ebay: {
    id: 'ebay',
    name: 'ebay',
    color: '#E53238',
    tint: '#FFF5F5',
    accent: '#0064D2',
    mark: 'sans',
    keywords: ['ebay', 'איביי'],
    site: 'https://www.ebay.com',
  },
  asos: {
    id: 'asos',
    name: 'ASOS',
    color: '#2D2D2D',
    tint: '#F7F7F8',
    accent: '#2D2D2D',
    mark: 'wide',
    keywords: ['asos'],
    site: 'https://www.asos.com',
  },
  next: {
    id: 'next',
    name: 'NEXT',
    color: '#1F2937',
    tint: '#F5F7FA',
    accent: '#64748B',
    mark: 'wide',
    keywords: ['next direct', 'nextdirect', 'next.co.il'],
    site: 'https://www.next.co.il',
  },
  terminalx: {
    id: 'terminalx',
    name: 'TERMINAL X',
    color: '#111111',
    tint: '#F7F7F8',
    accent: '#111111',
    mark: 'condensed',
    keywords: ['terminal x', 'terminalx', 'טרמינל איקס'],
    site: 'https://www.terminalx.com',
  },
  other: {
    id: 'other',
    name: 'חנות',
    color: '#5B27BC',
    tint: '#F8F7FC',
    accent: '#6C35DC',
    mark: 'sans',
    keywords: [],
  },
};

export function getRetailer(id: string | undefined): Retailer {
  return (id && RETAILERS[id]) || RETAILERS.other;
}

/** Best-effort retailer match from arbitrary text (SMS body, email subject). */
export function detectRetailer(text: string): Retailer | undefined {
  const haystack = text.toLowerCase();
  let best: { retailer: Retailer; index: number } | undefined;
  for (const retailer of Object.values(RETAILERS)) {
    for (const keyword of retailer.keywords) {
      const index = haystack.indexOf(keyword);
      if (index !== -1 && (!best || index < best.index)) {
        best = { retailer, index };
      }
    }
  }
  return best?.retailer;
}
