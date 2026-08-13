import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { PageHeader, Screen } from '../components/Screen';
import { RetailerLogo } from '../components/RetailerLogo';
import { detectCarrier } from '../data/carriers';
import { RETAILERS } from '../data/retailers';
import { HOME_ADDRESS } from '../data/seed';
import { addDays, toISODate } from '../lib/date';
import { uid } from '../lib/factory';
import { MILESTONE_LABELS } from '../lib/status';
import { useStore } from '../store/store';
import { useUI } from '../store/ui';
import { MILESTONE_ORDER, type Milestone } from '../types';

const RETAILER_CHOICES = Object.values(RETAILERS).filter((retailer) => retailer.id !== 'other');

export function AddPackagePage() {
  const navigate = useNavigate();
  const { addParcel, addresses } = useStore();
  const { toast } = useUI();

  const [tracking, setTracking] = useState('');
  const [retailerId, setRetailerId] = useState('aliexpress');
  const [customName, setCustomName] = useState('');
  const [itemTitle, setItemTitle] = useState('');
  const [status, setStatus] = useState<Milestone>('shipped');
  const [eta, setEta] = useState(toISODate(addDays(new Date(), 7)));
  const [method, setMethod] = useState<'home' | 'pickup'>('home');

  const carrier = useMemo(
    () => (tracking.trim() ? detectCarrier(tracking.trim()) : undefined),
    [tracking],
  );

  const valid = tracking.trim().length >= 6;

  const submit = () => {
    if (!valid) return;
    const defaultAddress = addresses.find((address) => address.isDefault) ?? HOME_ADDRESS;
    const parcel = addParcel({
      trackingNumber: tracking.trim(),
      retailerId: retailerId === 'other' ? 'other' : retailerId,
      retailerName: retailerId === 'other' ? customName || 'חנות' : undefined,
      carrierId: carrier?.id,
      status,
      eta,
      source: 'manual',
      items: itemTitle.trim()
        ? [{ id: uid('it'), title: itemTitle.trim(), quantity: 1, image: '📦' }]
        : [],
      delivery: { method, address: method === 'home' ? defaultAddress : undefined, canChange: true },
    });
    toast('החבילה נוספה');
    navigate(`/package/${parcel.id}`, { replace: true });
  };

  return (
    <Screen header={<PageHeader title="הוספת חבילה" subtle />}>
      <div className="px-4 pb-12">
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-brand-400">מספר מעקב</span>
          <input
            value={tracking}
            onChange={(event) => setTracking(event.target.value)}
            dir="ltr"
            autoFocus
            placeholder="LP123456789CN"
            className="field text-left font-medium"
          />
        </label>
        {carrier && (
          <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-brand-500">
            <Icon name="truck" size={15} />
            זוהתה חברת שילוח: {carrier.name}
          </p>
        )}

        <div className="mt-5">
          <span className="mb-2 block text-[13px] font-medium text-brand-400">חנות</span>
          <div className="no-scrollbar -mx-4 overflow-x-auto px-4">
            <div className="flex min-w-max gap-2">
              {RETAILER_CHOICES.map((retailer) => (
                <button
                  key={retailer.id}
                  type="button"
                  onClick={() => setRetailerId(retailer.id)}
                  className={`press rounded-xl border px-3.5 py-2.5 transition ${
                    retailerId === retailer.id
                      ? 'border-brand-400 bg-brand-50'
                      : 'border-brand-100 bg-white'
                  }`}
                >
                  <RetailerLogo retailerId={retailer.id} size="sm" />
                </button>
              ))}
              <button
                type="button"
                onClick={() => setRetailerId('other')}
                className={`press rounded-xl border px-3.5 py-2.5 text-[14px] font-semibold transition ${
                  retailerId === 'other'
                    ? 'border-brand-400 bg-brand-50 text-brand-700'
                    : 'border-brand-100 bg-white text-brand-ink/70'
                }`}
              >
                אחר
              </button>
            </div>
          </div>
        </div>

        {retailerId === 'other' && (
          <label className="mt-3 block">
            <span className="mb-1.5 block text-[13px] font-medium text-brand-400">שם החנות</span>
            <input
              value={customName}
              onChange={(event) => setCustomName(event.target.value)}
              placeholder="לדוגמה: ASOS"
              className="field"
            />
          </label>
        )}

        <label className="mt-5 block">
          <span className="mb-1.5 block text-[13px] font-medium text-brand-400">
            מה יש בחבילה? (אופציונלי)
          </span>
          <input
            value={itemTitle}
            onChange={(event) => setItemTitle(event.target.value)}
            placeholder="לדוגמה: אוזניות אלחוטיות"
            className="field"
          />
        </label>

        <label className="mt-5 block">
          <span className="mb-1.5 block text-[13px] font-medium text-brand-400">מועד הגעה משוער</span>
          <input
            type="date"
            value={eta}
            onChange={(event) => setEta(event.target.value)}
            className="field"
          />
        </label>

        <div className="mt-5">
          <span className="mb-2 block text-[13px] font-medium text-brand-400">סטטוס נוכחי</span>
          <div className="grid grid-cols-3 gap-2">
            {MILESTONE_ORDER.slice(0, 4).map((milestone) => (
              <button
                key={milestone}
                type="button"
                onClick={() => setStatus(milestone)}
                className={`rounded-xl border px-2 py-2.5 text-[13px] font-medium transition ${
                  status === milestone
                    ? 'border-brand-400 bg-brand-50 text-brand-700'
                    : 'border-brand-100 bg-white text-brand-ink/70'
                }`}
              >
                {MILESTONE_LABELS[milestone]}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <span className="mb-2 block text-[13px] font-medium text-brand-400">אופן מסירה</span>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { id: 'home', label: 'משלוח עד הבית', icon: 'home' },
                { id: 'pickup', label: 'נקודת איסוף', icon: 'pin' },
              ] as const
            ).map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setMethod(option.id)}
                className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-[14px] font-medium transition ${
                  method === option.id
                    ? 'border-brand-400 bg-brand-50 text-brand-700'
                    : 'border-brand-100 bg-white text-brand-ink/70'
                }`}
              >
                <Icon name={option.icon} size={18} />
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <button type="button" onClick={submit} disabled={!valid} className="btn-primary mt-6 w-full">
          הוספת החבילה
        </button>

        <Link to="/paste" className="mt-3 flex items-center justify-center gap-2 py-2 text-[14px] font-semibold text-brand-600">
          <Icon name="chat" size={18} />
          יש לכם SMS? הדביקו אותו ונזהה הכול
        </Link>
      </div>
    </Screen>
  );
}
