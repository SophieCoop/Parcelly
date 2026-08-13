import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { PageHeader, Screen } from '../components/Screen';
import { RetailerLogo } from '../components/RetailerLogo';
import { Sheet } from '../components/Sheet';
import { getCarrier } from '../data/carriers';
import { formatShortDate } from '../lib/date';
import { draftFromParsed } from '../lib/factory';
import { parseMessage, type ParsedMessage } from '../lib/parse';
import { MILESTONE_LABELS } from '../lib/status';
import { useStore } from '../store/store';
import { useUI } from '../store/ui';

const SAMPLE = `SHEIN: החבילה שלך בדרך אליך! מספר מעקב SH123456789CN.
מועד משוער 18 באוגוסט. ניתן לבחור נקודת איסוף חדשה בקישור:
https://www.shein.com/user/orders`;

export function PasteTextPage() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<ParsedMessage | undefined>();
  const [checked, setChecked] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const { addParcel, notify } = useStore();
  const { toast } = useUI();
  const navigate = useNavigate();

  const analyse = () => {
    const parsed = parseMessage(text);
    setResult(parsed);
    setChecked(true);
  };

  const save = () => {
    if (!result?.trackingNumber) return;
    const parcel = addParcel(draftFromParsed(result));
    notify({
      parcelId: parcel.id,
      kind: 'update',
      title: `החבילה מ‑${result.retailerName ?? 'החנות'} נוספה למעקב`,
      body: `מספר מעקב ${parcel.trackingNumber} מעודכן במעקב.`,
    });
    toast('החבילה נוספה ל‑Parcelly');
    navigate(`/package/${parcel.id}`, { replace: true });
  };

  // Step 2 – a package was recognised in the pasted text.
  if (checked && result?.trackingNumber) {
    const carrier = getCarrier(result.carrierId);
    return (
      <Screen header={<PageHeader title="נמצאה חבילה!" subtle onBack={() => setChecked(false)} />}>
        <div className="px-4 pb-10">
          <div className="flex flex-col items-center pb-5 pt-2">
            <span className="grid h-14 w-14 animate-pop-in place-items-center rounded-full bg-emerald-100 text-emerald-600">
              <Icon name="check" size={30} />
            </span>
            <p className="mt-3 text-[14px] text-brand-400">מצאנו פרטי חבילה בהודעה</p>
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between gap-2">
              <RetailerLogo
                retailerId={result.retailerId ?? 'other'}
                name={result.retailerName}
                size="lg"
              />
              <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[12px] font-semibold text-brand-700">
                זיהוי {Math.round(result.confidence * 100)}%
              </span>
            </div>

            <dl className="mt-4 space-y-3">
              <div className="flex items-center justify-between gap-3 border-b border-brand-50 pb-3">
                <dt className="text-[13px] text-brand-400">מספר מעקב</dt>
                <dd dir="ltr" className="text-[14px] font-semibold text-brand-ink">
                  {result.trackingNumber}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-brand-50 pb-3">
                <dt className="text-[13px] text-brand-400">סטטוס</dt>
                <dd className="text-[14px] font-medium text-brand-ink">
                  {result.readyForPickup
                    ? 'ממתינה לאיסוף'
                    : result.status
                      ? MILESTONE_LABELS[result.status]
                      : 'לא זוהה'}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-brand-50 pb-3">
                <dt className="text-[13px] text-brand-400">מועד משוער</dt>
                <dd className="text-[14px] font-medium text-brand-ink">
                  {result.eta ? formatShortDate(result.eta) : 'לא זוהה'}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-[13px] text-brand-400">חברת שילוח</dt>
                <dd className="text-[14px] font-medium text-brand-ink">{carrier.name}</dd>
              </div>
            </dl>

            {result.action && (
              <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-amber-800">
                <Icon name="alert" size={16} className="mt-0.5 shrink-0" />
                <span className="text-[12px] leading-relaxed">
                  <span className="block font-semibold">
                    {result.action.type === 'choose_pickup'
                      ? 'ניתן לבחור נקודת איסוף חדשה'
                      : 'החבילה דורשת פעולה'}
                  </span>
                  {result.action.message}
                </span>
              </div>
            )}
          </div>

          <button type="button" onClick={save} className="btn-primary mt-5 w-full">
            הוסף ל‑Parcelly
          </button>
          <button
            type="button"
            onClick={() => {
              setChecked(false);
              setResult(undefined);
            }}
            className="mt-3 w-full py-2 text-center text-[14px] font-medium text-brand-400"
          >
            לא, טעינו
          </button>
        </div>
      </Screen>
    );
  }

  // Step 1 – paste the message.
  return (
    <Screen
      header={
        <PageHeader
          title="הדבקת טקסט מ‑SMS"
          subtle
          action={
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              className="rounded-xl p-1.5 text-brand-700 transition active:bg-brand-100"
              aria-label="מידע"
            >
              <Icon name="info" size={22} />
            </button>
          }
        />
      }
    >
      <div className="px-4 pb-10">
        <div className="mx-auto mt-2 flex h-32 w-full max-w-[240px] items-center justify-center rounded-2xl bg-brand-100/60">
          <span className="flex items-end gap-1.5 text-brand-400">
            <Icon name="chat" size={30} />
            <Icon name="chat" size={44} className="text-brand-500" />
            <Icon name="chat" size={24} />
          </span>
        </div>

        <h2 className="mt-5 text-center text-[17px] font-bold text-brand-ink">
          הדביקו כאן את הודעת ה‑SMS
        </h2>
        <p className="mt-1 text-center text-[13px] text-brand-400">
          ואנחנו נזהה עבורכם את פרטי החבילה
        </p>

        <textarea
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setChecked(false);
          }}
          rows={7}
          placeholder="הדביקו כאן את הטקסט…"
          className="field mt-4 resize-none leading-relaxed"
        />

        <div className="mt-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setText(SAMPLE);
              setChecked(false);
            }}
            className="text-[13px] font-medium text-brand-600"
          >
            הדבקת הודעה לדוגמה
          </button>
          {text && (
            <button
              type="button"
              onClick={() => {
                setText('');
                setChecked(false);
              }}
              className="text-[13px] text-brand-300"
            >
              ניקוי
            </button>
          )}
        </div>

        {checked && !result?.trackingNumber && (
          <div className="mt-4 flex items-start gap-2 rounded-2xl bg-rose-50 px-3.5 py-3 text-rose-700">
            <Icon name="alert" size={18} className="mt-0.5 shrink-0" />
            <span className="text-[13px] leading-relaxed">
              <span className="block font-semibold">לא זיהינו מספר מעקב בהודעה</span>
              אפשר לנסות להדביק את ההודעה המלאה, או להוסיף את מספר המעקב ידנית.
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={analyse}
          disabled={text.trim().length < 8}
          className="btn-primary mt-5 w-full"
        >
          מצא את החבילה
        </button>

        <p className="mt-5 text-center text-[13px] text-brand-400">לא בטוחים שזו הודעה על חבילה?</p>
        <Link to="/add" className="mt-1 block text-center text-[14px] font-semibold text-brand-600">
          הוספת מספר מעקב ידנית
        </Link>
      </div>

      <Sheet open={helpOpen} title="איך זה עובד?" onClose={() => setHelpOpen(false)}>
        <ul className="space-y-3 pb-3 text-[14px] leading-relaxed text-brand-ink/80">
          <li className="flex gap-2">
            <Icon name="check" size={18} className="mt-0.5 shrink-0 text-brand-600" />
            הזיהוי מתבצע במכשיר שלכם – הטקסט לא נשלח לשום מקום.
          </li>
          <li className="flex gap-2">
            <Icon name="check" size={18} className="mt-0.5 shrink-0 text-brand-600" />
            אנחנו מחפשים מספר מעקב, שם חנות, סטטוס ותאריך משוער.
          </li>
          <li className="flex gap-2">
            <Icon name="check" size={18} className="mt-0.5 shrink-0 text-brand-600" />
            אם ההודעה כוללת קישור לשינוי נקודת איסוף – נשמור אותו בכרטיס החבילה.
          </li>
        </ul>
      </Sheet>
    </Screen>
  );
}
