import { describe, expect, it } from 'vitest';
import { extractDate, extractStatus, extractTrackingNumber, parseMessage } from './parse';

const NOW = new Date(2026, 7, 13); // 13 August 2026

describe('extractTrackingNumber', () => {
  it('reads a labelled Hebrew tracking number', () => {
    expect(extractTrackingNumber('שלום, מספר מעקב: LP123456789CN תודה')).toBe('LP123456789CN');
  });

  it('reads a labelled English tracking number', () => {
    expect(extractTrackingNumber('Your tracking number is 1Z999AA10123456784.')).toBe(
      '1Z999AA10123456784',
    );
  });

  it('finds an unlabelled carrier code', () => {
    expect(extractTrackingNumber('SHEIN: החבילה שלך בדרך! SH123456789CN')).toBe('SH123456789CN');
  });

  it('ignores text with no code', () => {
    expect(extractTrackingNumber('היי, מה שלומך?')).toBeUndefined();
  });

  it('does not mistake a phone number for a tracking code', () => {
    expect(extractTrackingNumber('חייגו אלינו 050-1234567 לפרטים')).toBeUndefined();
  });
});

describe('extractDate', () => {
  it('parses a Hebrew month', () => {
    expect(extractDate('מועד משוער 18 באוגוסט', NOW)).toBe('2026-08-18');
  });

  it('parses a numeric date', () => {
    expect(extractDate('יגיע ב־20/08/2026', NOW)).toBe('2026-08-20');
  });

  it('resolves "מחר"', () => {
    expect(extractDate('החבילה תגיע מחר', NOW)).toBe('2026-08-14');
  });

  it('resolves the next occurrence of a weekday', () => {
    // 13 Aug 2026 is a Thursday, so the next Sunday is the 16th.
    expect(extractDate('נגיע ביום ראשון', NOW)).toBe('2026-08-16');
  });
});

describe('extractStatus', () => {
  it('detects a delivered parcel', () => {
    expect(extractStatus('החבילה נמסרה בהצלחה').status).toBe('delivered');
  });

  it('detects a parcel waiting at a pickup point', () => {
    const result = extractStatus('החבילה ממתינה לאיסוף בנקודת החלוקה');
    expect(result.status).toBe('out_for_delivery');
    expect(result.readyForPickup).toBe(true);
  });

  it('detects customs', () => {
    expect(extractStatus('החבילה הגיעה לישראל וממתינה לשחרור מכס').status).toBe('arrived_country');
  });
});

describe('parseMessage', () => {
  it('pulls every field out of a realistic SHEIN message', () => {
    const parsed = parseMessage(
      `SHEIN: החבילה שלך בדרך אליך! מספר מעקב SH123456789CN.
       מועד משוער 18 באוגוסט. ניתן לבחור נקודת איסוף חדשה בקישור:
       https://www.shein.com/user/orders`,
      NOW,
    );

    expect(parsed?.trackingNumber).toBe('SH123456789CN');
    expect(parsed?.retailerId).toBe('shein');
    expect(parsed?.carrierId).toBe('china-post');
    expect(parsed?.status).toBe('out_for_delivery');
    expect(parsed?.eta).toBe('2026-08-18');
    expect(parsed?.action?.type).toBe('choose_pickup');
    expect(parsed?.links[0]).toBe('https://www.shein.com/user/orders');
    expect(parsed?.confidence).toBeGreaterThan(0.8);
  });

  it('handles an AliExpress customs message', () => {
    const parsed = parseMessage(
      'AliExpress: ההזמנה 8172634510 הגיעה לישראל. מספר מעקב LP123456789CN, נדרשת הצהרת מכס.',
      NOW,
    );

    expect(parsed?.retailerId).toBe('aliexpress');
    expect(parsed?.status).toBe('arrived_country');
    expect(parsed?.action?.type).toBe('customs');
  });

  it('reads an English Amazon dispatch notice', () => {
    const parsed = parseMessage(
      'Amazon: your order has shipped. Tracking number TBA903184455210. Arriving 20/08/2026.',
      NOW,
    );

    expect(parsed?.trackingNumber).toBe('TBA903184455210');
    expect(parsed?.carrierId).toBe('amazon-logistics');
    expect(parsed?.retailerId).toBe('amazon');
    expect(parsed?.status).toBe('shipped');
    expect(parsed?.eta).toBe('2026-08-20');
  });

  it('returns nothing for an unrelated message', () => {
    expect(parseMessage('אמא, אל תשכחי לקנות חלב', NOW)).toBeUndefined();
  });

  it('returns nothing for empty input', () => {
    expect(parseMessage('   ', NOW)).toBeUndefined();
  });
});
