import { Link } from 'react-router-dom';
import { Icon, type IconName } from '../components/Icon';
import { Screen, TopBar } from '../components/Screen';
import { useStore } from '../store/store';
import { useUI } from '../store/ui';
import type { Settings } from '../types';

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-3 border-b border-brand-50 px-4 py-3.5 text-right last:border-b-0 transition active:bg-brand-50"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium text-brand-ink">{label}</span>
        {hint && <span className="block text-[12px] text-brand-400">{hint}</span>}
      </span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          checked ? 'bg-brand-600' : 'bg-brand-100'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
            checked ? 'right-0.5' : 'right-[22px]'
          }`}
        />
      </span>
    </button>
  );
}

const LINKS: { to: string; label: string; icon: IconName }[] = [
  { to: '/addresses', label: 'כתובות שלי', icon: 'pin' },
  { to: '/sources', label: 'חיבור מקורות', icon: 'link' },
  { to: '/action-required', label: 'חבילות שדורשות פעולה', icon: 'alert' },
  { to: '/help', label: 'עזרה ותמיכה', icon: 'help' },
];

export function SettingsPage() {
  const { settings, updateSettings, reset } = useStore();
  const { toast } = useUI();

  const set = (patch: Partial<Settings>) => updateSettings(patch);

  return (
    <Screen header={<TopBar title="הגדרות" />} tabs>
      <div className="px-4 pb-10">
        <section className="card flex items-center gap-3 p-4">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-100 text-[18px] font-bold text-brand-700">
            {settings.userName.slice(0, 1)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[16px] font-bold text-brand-ink">{settings.userName}</span>
            <span dir="ltr" className="block truncate text-right text-[13px] text-brand-400">
              {settings.userEmail}
            </span>
          </span>
        </section>

        <h2 className="section-title mt-5">התראות</h2>
        <div className="card overflow-hidden">
          <Toggle
            label="התראות במכשיר"
            hint="עדכונים על שינוי סטטוס בזמן אמת"
            checked={settings.pushEnabled}
            onChange={(value) => set({ pushEnabled: value })}
          />
          <Toggle
            label="כשחבילה נשלחת"
            checked={settings.notifyOnShipped}
            onChange={(value) => set({ notifyOnShipped: value })}
          />
          <Toggle
            label="כשחבילה מגיעה לישראל או יוצאת לחלוקה"
            checked={settings.notifyOnArrival}
            onChange={(value) => set({ notifyOnArrival: value })}
          />
          <Toggle
            label="כשיש עיכוב במשלוח"
            checked={settings.notifyOnDelay}
            onChange={(value) => set({ notifyOnDelay: value })}
          />
          <Toggle
            label="סיכום שבועי במייל"
            checked={settings.emailDigest}
            onChange={(value) => set({ emailDigest: value })}
          />
        </div>

        <h2 className="section-title mt-5">כללי</h2>
        <div className="card overflow-hidden">
          {LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="flex items-center gap-3 border-b border-brand-50 px-4 py-3.5 last:border-b-0 transition active:bg-brand-50"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <Icon name={link.icon} size={18} />
              </span>
              <span className="flex-1 text-[15px] text-brand-ink">{link.label}</span>
              <Icon name="forward" size={18} className="text-brand-300" />
            </Link>
          ))}
        </div>

        <h2 className="section-title mt-5">נתונים</h2>
        <div className="card overflow-hidden">
          <div className="px-4 py-3.5">
            <p className="text-[13px] leading-relaxed text-brand-400">
              הנתונים בגרסת ההדגמה נשמרים מקומית בדפדפן שלכם בלבד.
            </p>
            <button
              type="button"
              onClick={() => {
                reset();
                toast('הנתונים אופסו לנתוני ההדגמה');
              }}
              className="btn-outline mt-3 w-full"
            >
              <Icon name="trash" size={18} />
              איפוס נתוני ההדגמה
            </button>
          </div>
        </div>

        <p className="mt-5 text-center text-[12px] text-brand-300">Parcelly · גרסה 0.1</p>
      </div>
    </Screen>
  );
}
