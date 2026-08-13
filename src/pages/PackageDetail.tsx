import { useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';
import { Icon, type IconName } from '../components/Icon';
import { PageHeader, Screen } from '../components/Screen';
import { RetailerLogo } from '../components/RetailerLogo';
import { Sheet } from '../components/Sheet';
import { StatusBadge } from '../components/StatusBadge';
import { Timeline } from '../components/Timeline';
import { getCarrier, trackingUrl } from '../data/carriers';
import { getRetailer } from '../data/retailers';
import { PICKUP_POINTS } from '../data/seed';
import { formatDayMonth, formatShortDate, formatTime, formatWeekday } from '../lib/date';
import { groupedHours, openStatusLabel } from '../lib/hours';
import { badgeFor, etaCaption, hasOpenAction, isDelivered } from '../lib/status';
import { useStore } from '../store/store';
import { useUI } from '../store/ui';
import type { Parcel } from '../types';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-4">
      <h2 className="section-title">{title}</h2>
      <div className="card overflow-hidden">{children}</div>
    </section>
  );
}

interface RowProps {
  icon?: IconName;
  label: string;
  value?: ReactNode;
  hint?: string;
  onClick?: () => void;
  href?: string;
  chevron?: boolean;
}

function Row({ icon, label, value, hint, onClick, href, chevron }: RowProps) {
  const content = (
    <>
      {icon && (
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
          <Icon name={icon} size={18} />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] text-brand-400">{label}</span>
        <span className="block truncate text-[15px] font-medium text-brand-ink">{value ?? '—'}</span>
        {hint && <span className="mt-0.5 block text-[12px] text-brand-300">{hint}</span>}
      </span>
      {(chevron || onClick || href) && (
        <span className="shrink-0 text-brand-300">
          <Icon name={href ? 'external' : 'forward'} size={18} />
        </span>
      )}
    </>
  );

  const className =
    'flex w-full items-center gap-3 border-b border-brand-50 px-4 py-3 text-right last:border-b-0 transition active:bg-brand-50';

  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {content}
      </a>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {content}
      </button>
    );
  }
  return <div className={className}>{content}</div>;
}

function DeliveryTarget({ parcel }: { parcel: Parcel }) {
  const { delivery } = parcel;
  if (delivery.method === 'home') {
    return (
      <>
        <Row
          icon="pin"
          label="כתובת משלוח"
          value={delivery.address ? `${delivery.address.street}, ${delivery.address.city}` : 'לא הוגדרה'}
          hint={delivery.address?.notes}
        />
        {delivery.window && (
          <Row
            icon="clock"
            label="חלון מסירה משוער"
            value={<bdi dir="ltr">{delivery.window}</bdi>}
          />
        )}
        {delivery.instructions && (
          <Row icon="info" label="הוראות לשליח" value={delivery.instructions} />
        )}
      </>
    );
  }

  const point = delivery.pickupPoint;
  if (!point) return <Row icon="pin" label="נקודת איסוף" value="טרם נבחרה" />;

  return (
    <>
      <Row
        icon={delivery.method === 'locker' ? 'box' : 'store'}
        label={delivery.method === 'locker' ? 'לוקר לאיסוף' : 'נקודת איסוף'}
        value={point.name}
        hint={`${point.address}, ${point.city}${point.distanceKm ? ` · ${point.distanceKm} ק״מ` : ''}`}
      />
      <div className="border-b border-brand-50 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[13px] text-brand-400">שעות איסוף</span>
          <span className="text-[12px] font-semibold text-emerald-600">{openStatusLabel(point)}</span>
        </div>
        <dl className="mt-2 space-y-1">
          {groupedHours(point).map((row) => (
            <div key={row.days} className="flex justify-between text-[13px]">
              <dt className="text-brand-ink/70">{row.days}</dt>
              <dd dir="ltr" className="text-brand-ink">
                {row.hours}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      {point.code && <Row icon="shield" label="קוד איסוף" value={point.code} />}
      {point.phone && <Row icon="phone" label="טלפון" value={point.phone} href={`tel:${point.phone}`} />}
    </>
  );
}

export function PackageDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useUI();
  const {
    getParcel,
    addresses,
    setPickupPoint,
    setDeliveryAddress,
    markCollected,
    archiveParcel,
    removeParcel,
    resolveAction,
  } = useStore();

  const [sheet, setSheet] = useState<'pickup' | 'address' | 'contact' | 'menu' | null>(null);
  const parcel = id ? getParcel(id) : undefined;

  if (!parcel) {
    return (
      <Screen header={<PageHeader title="פרטי חבילה" />}>
        <EmptyState
          icon="search"
          title="החבילה לא נמצאה"
          body="ייתכן שהחבילה נמחקה מהחשבון."
          action={
            <Link to="/" className="btn-primary w-full">
              חזרה לחבילות שלי
            </Link>
          }
        />
      </Screen>
    );
  }

  const retailer = getRetailer(parcel.retailerId);
  const carrier = getCarrier(parcel.carrierId);
  const badge = badgeFor(parcel);
  const trackUrl = trackingUrl(parcel.carrierId, parcel.trackingNumber);
  const itemCount = parcel.items.reduce((sum, item) => sum + item.quantity, 0);

  const copyTracking = async () => {
    try {
      await navigator.clipboard.writeText(parcel.trackingNumber);
      toast('מספר המעקב הועתק');
    } catch {
      toast('לא ניתן להעתיק מהדפדפן');
    }
  };

  return (
    <Screen
      header={
        <PageHeader
          title="פרטי חבילה"
          subtle
          action={
            <button
              type="button"
              onClick={() => setSheet('menu')}
              className="rounded-xl p-1.5 text-brand-700 transition active:bg-brand-100"
              aria-label="פעולות נוספות"
            >
              <Icon name="dots" size={22} />
            </button>
          }
        />
      }
    >
      <div className="px-4 pb-10">
        {/* Hero */}
        <div className="rounded-2xl p-4 shadow-card" style={{ backgroundColor: retailer.tint }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[12px] font-medium text-brand-400">{etaCaption(parcel)}</div>
              <div className="text-[24px] font-extrabold leading-tight text-brand-ink">
                {parcel.eta ? formatShortDate(parcel.eta) : 'בהמתנה'}
              </div>
              {parcel.eta && (
                <div className="text-[12px] text-brand-400">{formatWeekday(parcel.eta)}</div>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <StatusBadge label={badge.label} tone={badge.tone} />
              <RetailerLogo retailerId={parcel.retailerId} name={parcel.retailerName} size="lg" />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={copyTracking}
              className="flex min-w-0 items-center gap-2 text-right"
            >
              <span className="min-w-0">
                <span className="block text-[12px] text-brand-400">מספר מעקב</span>
                <span dir="ltr" className="block truncate text-[15px] font-semibold text-brand-ink">
                  {parcel.trackingNumber}
                </span>
              </span>
              <Icon name="copy" size={16} className="shrink-0 text-brand-400" />
            </button>
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/70 text-3xl">
              {parcel.items[0]?.image ?? '📦'}
            </span>
          </div>

          <div className="mt-5">
            <Timeline parcel={parcel} color={retailer.accent} />
          </div>
        </div>

        {/* Action banner */}
        {hasOpenAction(parcel) && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 text-amber-600">
                <Icon name="alert" size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold text-amber-900">
                  {parcel.action?.type === 'choose_pickup'
                    ? 'ניתן לבחור נקודת איסוף חדשה'
                    : 'החבילה ממתינה לפעולה'}
                </p>
                <p className="mt-0.5 text-[13px] leading-relaxed text-amber-800/80">
                  {parcel.action?.message}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {parcel.action?.type === 'choose_pickup' && (
                    <button
                      type="button"
                      onClick={() => setSheet('pickup')}
                      className="btn-primary px-3 py-2 text-[13px]"
                    >
                      בחירת נקודת איסוף
                    </button>
                  )}
                  {parcel.action?.link && (
                    <a
                      href={parcel.action.link}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-outline px-3 py-2 text-[13px]"
                    >
                      פתיחת הקישור
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      resolveAction(parcel.id);
                      toast('סומן כטופל');
                    }}
                    className="btn-ghost px-3 py-2 text-[13px]"
                  >
                    סומן כטופל
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <Section title="פרטי משלוח">
          <Row icon="store" label="שולח" value={parcel.seller?.name ?? retailer.name} />
          <Row icon="truck" label="חברת שילוח" value={carrier.name} />
          <Row
            icon="box"
            label="פריטים"
            value={`${itemCount} פריטים`}
            onClick={() => document.getElementById('items')?.scrollIntoView({ behavior: 'smooth' })}
          />
          {parcel.orderNumber && (
            <Row icon="copy" label="מספר הזמנה" value={<bdi>{parcel.orderNumber}</bdi>} />
          )}
          <DeliveryTarget parcel={parcel} />
          {trackUrl && (
            <Row icon="link" label="מעקב באתר חברת השילוח" value={carrier.name} href={trackUrl} />
          )}
          {parcel.delivery.changeLink && (
            <Row
              icon="external"
              label="קישור לשינוי נקודת איסוף"
              value="פתיחת הקישור של המשלח"
              href={parcel.delivery.changeLink}
            />
          )}
        </Section>

        {/* Change delivery */}
        {parcel.delivery.canChange && !isDelivered(parcel) && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setSheet('pickup')} className="btn-outline">
              <Icon name="pin" size={18} />
              שינוי נקודת איסוף
            </button>
            <button type="button" onClick={() => setSheet('address')} className="btn-outline">
              <Icon name="home" size={18} />
              שינוי כתובת
            </button>
          </div>
        )}

        <Section title="תוכן החבילה">
          <div id="items">
            {parcel.items.length === 0 && (
              <div className="px-4 py-5 text-center text-[14px] text-brand-300">
                לא נמצאו פרטי מוצרים להזמנה זו
              </div>
            )}
            {parcel.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 border-b border-brand-50 px-4 py-3 last:border-b-0"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-xl">
                  {item.image ?? '📦'}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium text-brand-ink">
                    {item.title}
                  </span>
                  <span className="block text-[12px] text-brand-400">
                    כמות: {item.quantity}
                    {item.variant ? ` · ${item.variant}` : ''}
                  </span>
                </span>
                {item.price != null && (
                  <span dir="ltr" className="shrink-0 text-[14px] font-semibold text-brand-ink">
                    {item.currency ?? '₪'}
                    {item.price.toFixed(2)}
                  </span>
                )}
              </div>
            ))}
            {parcel.total != null && (
              <div className="flex items-center justify-between bg-brand-50/60 px-4 py-3">
                <span className="text-[14px] font-semibold text-brand-ink">סה״כ הזמנה</span>
                <span dir="ltr" className="text-[15px] font-bold text-brand-700">
                  {parcel.currency ?? '₪'}
                  {parcel.total.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </Section>

        <Section title="היסטוריית מעקב">
          <ol className="px-4 py-2">
            {[...parcel.events].reverse().map((event, index) => (
              <li key={event.id} className="flex gap-3 py-2">
                <span className="flex flex-col items-center">
                  <span
                    className={`mt-1.5 h-2.5 w-2.5 rounded-full ${
                      index === 0 ? 'bg-brand-600' : 'bg-brand-200'
                    }`}
                  />
                  {index < parcel.events.length - 1 && <span className="w-px flex-1 bg-brand-100" />}
                </span>
                <span className="flex-1 pb-1">
                  <span className="block text-[14px] font-medium text-brand-ink">{event.label}</span>
                  <span className="block text-[12px] text-brand-400">
                    {event.location} · <bdi>{formatDayMonth(event.date)}</bdi>,{' '}
                    <bdi>{formatTime(event.date)}</bdi>
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </Section>

        <Section title="יצירת קשר">
          <Row
            icon="chat"
            label="פנייה למוכר"
            value={parcel.seller?.name ?? retailer.name}
            hint={parcel.seller?.supportHours}
            onClick={() => setSheet('contact')}
          />
        </Section>

        {!isDelivered(parcel) && (
          <button
            type="button"
            onClick={() => {
              markCollected(parcel.id);
              toast('החבילה סומנה כנמסרה');
            }}
            className="btn-ghost mt-4 w-full"
          >
            <Icon name="check" size={18} />
            סימון כנמסרה
          </button>
        )}
      </div>

      <Sheet open={sheet === 'pickup'} title="בחירת נקודת איסוף" onClose={() => setSheet(null)}>
        <div className="space-y-2 pb-2">
          {PICKUP_POINTS.map((point) => {
            const selected = parcel.delivery.pickupPoint?.id === point.id;
            return (
              <button
                key={point.id}
                type="button"
                onClick={() => {
                  setPickupPoint(parcel.id, point);
                  setSheet(null);
                  toast(`נקודת האיסוף עודכנה ל${point.name}`);
                }}
                className={`w-full rounded-2xl border p-3.5 text-right transition active:scale-[0.99] ${
                  selected ? 'border-brand-400 bg-brand-50' : 'border-brand-100 bg-white'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[15px] font-semibold text-brand-ink">{point.name}</span>
                  {selected && <Icon name="check" size={18} className="text-brand-600" />}
                </div>
                <div className="mt-1 text-[13px] text-brand-400">
                  {point.address}, {point.city}
                  {point.distanceKm ? ` · ${point.distanceKm} ק״מ` : ''}
                </div>
                <div className="mt-1 text-[12px] font-medium text-emerald-600">
                  {openStatusLabel(point)}
                </div>
              </button>
            );
          })}
        </div>
      </Sheet>

      <Sheet open={sheet === 'address'} title="שינוי כתובת מסירה" onClose={() => setSheet(null)}>
        <div className="space-y-2 pb-2">
          {addresses.map((address) => {
            const selected =
              parcel.delivery.method === 'home' && parcel.delivery.address?.id === address.id;
            return (
              <button
                key={address.id}
                type="button"
                onClick={() => {
                  setDeliveryAddress(parcel.id, address);
                  setSheet(null);
                  toast(`הכתובת עודכנה ל${address.label}`);
                }}
                className={`w-full rounded-2xl border p-3.5 text-right transition active:scale-[0.99] ${
                  selected ? 'border-brand-400 bg-brand-50' : 'border-brand-100 bg-white'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[15px] font-semibold text-brand-ink">{address.label}</span>
                  {selected && <Icon name="check" size={18} className="text-brand-600" />}
                </div>
                <div className="mt-1 text-[13px] text-brand-400">
                  {address.street}, {address.city}
                </div>
              </button>
            );
          })}
          <Link to="/addresses" className="btn-ghost w-full" onClick={() => setSheet(null)}>
            ניהול הכתובות שלי
          </Link>
        </div>
      </Sheet>

      <Sheet open={sheet === 'contact'} title="יצירת קשר עם המוכר" onClose={() => setSheet(null)}>
        <div className="space-y-2 pb-2">
          {parcel.seller?.chatUrl && (
            <a href={parcel.seller.chatUrl} target="_blank" rel="noreferrer" className="btn-primary w-full">
              <Icon name="chat" size={18} />
              צ׳אט עם המוכר
            </a>
          )}
          {parcel.seller?.email && (
            <a
              href={`mailto:${parcel.seller.email}?subject=${encodeURIComponent(
                `פנייה בנוגע להזמנה ${parcel.orderNumber ?? parcel.trackingNumber}`,
              )}`}
              className="btn-outline w-full"
            >
              <Icon name="mail" size={18} />
              שליחת מייל
            </a>
          )}
          {parcel.seller?.phone && (
            <a href={`tel:${parcel.seller.phone}`} className="btn-outline w-full">
              <Icon name="phone" size={18} />
              התקשרות ל{parcel.seller.name}
            </a>
          )}
          {(parcel.seller?.storeUrl ?? retailer.supportUrl) && (
            <a
              href={parcel.seller?.storeUrl ?? retailer.supportUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-outline w-full"
            >
              <Icon name="external" size={18} />
              מעבר לעמוד ההזמנה בחנות
            </a>
          )}
          {parcel.seller?.supportHours && (
            <p className="pt-1 text-center text-[12px] text-brand-300">
              שעות מענה: {parcel.seller.supportHours}
            </p>
          )}
        </div>
      </Sheet>

      <Sheet open={sheet === 'menu'} title="פעולות" onClose={() => setSheet(null)}>
        <div className="space-y-2 pb-2">
          {!isDelivered(parcel) && (
            <button
              type="button"
              className="btn-outline w-full"
              onClick={() => {
                markCollected(parcel.id);
                setSheet(null);
                toast('החבילה סומנה כנמסרה');
              }}
            >
              <Icon name="check" size={18} />
              סימון כנמסרה
            </button>
          )}
          {!parcel.archived && (
            <button
              type="button"
              className="btn-outline w-full"
              onClick={() => {
                archiveParcel(parcel.id);
                setSheet(null);
                toast('החבילה הועברה להיסטוריה');
                navigate('/');
              }}
            >
              <Icon name="clock" size={18} />
              העברה להיסטוריה
            </button>
          )}
          <button
            type="button"
            className="btn w-full bg-rose-50 text-rose-700"
            onClick={() => {
              removeParcel(parcel.id);
              setSheet(null);
              toast('החבילה נמחקה');
              navigate('/');
            }}
          >
            <Icon name="trash" size={18} />
            מחיקת החבילה
          </button>
        </div>
      </Sheet>
    </Screen>
  );
}
