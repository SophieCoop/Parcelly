import type { OpeningHours, PickupPoint } from '../types';

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + (minutes || 0);
}

export function hoursForDay(point: PickupPoint, day: number): OpeningHours | undefined {
  return point.hours.find((entry) => entry.day === day);
}

export function todayHours(point: PickupPoint, now = new Date()): OpeningHours | undefined {
  return hoursForDay(point, now.getDay());
}

export function isOpenNow(point: PickupPoint, now = new Date()): boolean {
  const today = todayHours(point, now);
  if (!today || today.closed || !today.open) return false;
  const minutes = now.getHours() * 60 + now.getMinutes();
  return minutes >= toMinutes(today.open) && minutes <= toMinutes(today.close);
}

/** "פתוח עד 21:00" / "סגור – נפתח ביום ראשון 09:00" */
export function openStatusLabel(point: PickupPoint, now = new Date()): string {
  const today = todayHours(point, now);
  if (today && !today.closed && today.open === '00:00' && today.close === '23:59') {
    return 'פתוח 24/7';
  }
  if (isOpenNow(point, now)) return `פתוח עד ${today?.close}`;

  for (let offset = 1; offset <= 7; offset += 1) {
    const day = (now.getDay() + offset) % 7;
    const entry = hoursForDay(point, day);
    if (entry && !entry.closed && entry.open) {
      const names = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
      const when = offset === 1 ? 'מחר' : `ביום ${names[day]}`;
      return `סגור · נפתח ${when} ב־${entry.open}`;
    }
  }
  return 'שעות הפתיחה אינן זמינות';
}

/** Collapse identical consecutive days into ranges for display. */
export function groupedHours(point: PickupPoint): { days: string; hours: string }[] {
  const names = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
  const rows: { days: string; hours: string; startDay: number; endDay: number }[] = [];

  for (let day = 0; day < 7; day += 1) {
    const entry = hoursForDay(point, day);
    const label = !entry || entry.closed ? 'סגור' : `${entry.open}–${entry.close}`;
    const last = rows[rows.length - 1];
    if (last && last.hours === label && last.endDay === day - 1) {
      last.endDay = day;
      last.days = `${names[last.startDay]}–${names[day]}`;
    } else {
      rows.push({ days: names[day], hours: label, startDay: day, endDay: day });
    }
  }
  return rows.map(({ days, hours }) => ({ days, hours }));
}
