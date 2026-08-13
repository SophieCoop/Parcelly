import { useState } from 'react';
import { Icon } from '../components/Icon';
import { PageHeader, Screen } from '../components/Screen';
import { Sheet } from '../components/Sheet';
import { PICKUP_POINTS } from '../data/seed';
import { uid } from '../lib/factory';
import { groupedHours, openStatusLabel } from '../lib/hours';
import { useStore } from '../store/store';
import { useUI } from '../store/ui';
import type { Address } from '../types';

const BLANK: Address = {
  id: '',
  label: '',
  recipient: '',
  street: '',
  city: '',
  zip: '',
  phone: '',
  notes: '',
};

export function AddressesPage() {
  const { addresses, saveAddress, removeAddress } = useStore();
  const { toast } = useUI();
  const [draft, setDraft] = useState<Address | undefined>();

  const openNew = () => setDraft({ ...BLANK, id: uid('addr') });

  const submit = () => {
    if (!draft || !draft.street.trim() || !draft.city.trim()) return;
    saveAddress({ ...draft, label: draft.label.trim() || 'כתובת' });
    setDraft(undefined);
    toast('הכתובת נשמרה');
  };

  return (
    <Screen
      header={
        <PageHeader
          title="כתובות שלי"
          subtle
          action={
            <button
              type="button"
              onClick={openNew}
              className="rounded-xl p-1.5 text-brand-700 transition active:bg-brand-100"
              aria-label="הוספת כתובת"
            >
              <Icon name="plus" size={22} />
            </button>
          }
        />
      }
    >
      <div className="px-4 pb-10">
        <h2 className="section-title">כתובות למשלוח</h2>
        <div className="space-y-2">
          {addresses.map((address) => (
            <div key={address.id} className="card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-bold text-brand-ink">{address.label}</span>
                    {address.isDefault && (
                      <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-600">
                        ברירת מחדל
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[14px] text-brand-ink/80">
                    {address.street}, {address.city}
                    {address.zip ? ` · ${address.zip}` : ''}
                  </p>
                  <p className="mt-0.5 text-[13px] text-brand-400">
                    {address.recipient}
                    {address.phone ? ` · ${address.phone}` : ''}
                  </p>
                  {address.notes && (
                    <p className="mt-0.5 text-[12px] text-brand-300">{address.notes}</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => setDraft(address)}
                    className="rounded-lg p-2 text-brand-400 transition active:bg-brand-50"
                    aria-label="עריכה"
                  >
                    <Icon name="settings" size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      removeAddress(address.id);
                      toast('הכתובת נמחקה');
                    }}
                    className="rounded-lg p-2 text-rose-400 transition active:bg-rose-50"
                    aria-label="מחיקה"
                  >
                    <Icon name="trash" size={17} />
                  </button>
                </div>
              </div>
              {!address.isDefault && (
                <button
                  type="button"
                  onClick={() => {
                    saveAddress({ ...address, isDefault: true });
                    toast('הוגדרה ככתובת ברירת המחדל');
                  }}
                  className="mt-3 text-[13px] font-semibold text-brand-600"
                >
                  הגדרה כברירת מחדל
                </button>
              )}
            </div>
          ))}
        </div>

        <button type="button" onClick={openNew} className="btn-ghost mt-3 w-full">
          <Icon name="plus" size={18} />
          הוספת כתובת
        </button>

        <h2 className="section-title mt-6">נקודות איסוף קרובות</h2>
        <div className="space-y-2">
          {PICKUP_POINTS.map((point) => (
            <div key={point.id} className="card p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[15px] font-semibold text-brand-ink">{point.name}</span>
                {point.distanceKm && (
                  <span className="shrink-0 text-[12px] text-brand-300">{point.distanceKm} ק״מ</span>
                )}
              </div>
              <p className="mt-1 text-[13px] text-brand-400">
                {point.address}, {point.city}
              </p>
              <p className="mt-1 text-[12px] font-medium text-emerald-600">{openStatusLabel(point)}</p>
              <dl className="mt-2 space-y-0.5">
                {groupedHours(point).map((row) => (
                  <div key={row.days} className="flex justify-between text-[12px] text-brand-ink/70">
                    <dt>{row.days}</dt>
                    <dd dir="ltr">{row.hours}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </div>

      <Sheet
        open={Boolean(draft)}
        title={addresses.some((a) => a.id === draft?.id) ? 'עריכת כתובת' : 'כתובת חדשה'}
        onClose={() => setDraft(undefined)}
      >
        {draft && (
          <div className="space-y-3 pb-2">
            {(
              [
                { key: 'label', label: 'שם הכתובת', placeholder: 'בית / עבודה' },
                { key: 'recipient', label: 'שם המקבל', placeholder: 'שם מלא' },
                { key: 'street', label: 'רחוב ומספר', placeholder: 'רחוב הרצל 20' },
                { key: 'city', label: 'עיר', placeholder: 'רחובות' },
                { key: 'zip', label: 'מיקוד', placeholder: '7630520' },
                { key: 'phone', label: 'טלפון', placeholder: '050-0000000' },
                { key: 'notes', label: 'הערות לשליח', placeholder: 'קומה, דירה, קוד כניסה' },
              ] as const
            ).map((field) => (
              <label key={field.key} className="block">
                <span className="mb-1.5 block text-[13px] font-medium text-brand-400">
                  {field.label}
                </span>
                <input
                  value={draft[field.key] ?? ''}
                  onChange={(event) => setDraft({ ...draft, [field.key]: event.target.value })}
                  placeholder={field.placeholder}
                  className="field"
                />
              </label>
            ))}
            <label className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                checked={Boolean(draft.isDefault)}
                onChange={(event) => setDraft({ ...draft, isDefault: event.target.checked })}
                className="h-4 w-4 accent-brand-600"
              />
              <span className="text-[14px] text-brand-ink">הגדרה ככתובת ברירת המחדל</span>
            </label>
            <button type="button" onClick={submit} className="btn-primary w-full">
              שמירה
            </button>
          </div>
        )}
      </Sheet>
    </Screen>
  );
}
