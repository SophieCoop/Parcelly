import { Link } from 'react-router-dom';
import { Icon, type IconName } from '../components/Icon';
import { PageHeader, Screen } from '../components/Screen';
import { formatAgo } from '../lib/date';
import { useStore } from '../store/store';
import { useUI } from '../store/ui';
import type { ConnectedSource } from '../types';

const KIND_ICON: Record<ConnectedSource['kind'], IconName> = {
  email: 'mail',
  store: 'store',
  sms: 'chat',
};

const KIND_TITLE: Record<ConnectedSource['kind'], string> = {
  email: 'תיבות דואר',
  store: 'חנויות',
  sms: 'הודעות',
};

export function SourcesPage() {
  const { sources, toggleSource } = useStore();
  const { toast } = useUI();

  const groups = (['email', 'store', 'sms'] as const).map((kind) => ({
    kind,
    items: sources.filter((source) => source.kind === kind),
  }));

  return (
    <Screen header={<PageHeader title="חיבור מקורות" subtle />}>
      <div className="px-4 pb-10">
        <p className="rounded-2xl bg-brand-50 px-4 py-3 text-[13px] leading-relaxed text-brand-700">
          חברו את המקורות שמהם מגיעות ההזמנות שלכם, ו‑Parcelly תאסוף מהם את פרטי החבילות
          אוטומטית – בלי להזין מספרי מעקב ידנית.
        </p>

        {groups.map((group) => (
          <section key={group.kind} className="mt-4">
            <h2 className="section-title">{KIND_TITLE[group.kind]}</h2>
            <div className="card overflow-hidden">
              {group.items.map((source) => (
                <div
                  key={source.id}
                  className="flex items-center gap-3 border-b border-brand-50 px-4 py-3.5 last:border-b-0"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    <Icon name={KIND_ICON[source.kind]} size={19} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold text-brand-ink">
                      {source.name}
                    </span>
                    <span className="block text-[12px] leading-relaxed text-brand-400">
                      {source.description}
                    </span>
                    {source.connected && source.lastSync && (
                      <span className="mt-0.5 block text-[11px] text-emerald-600">
                        סונכרן {formatAgo(source.lastSync)}
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      toggleSource(source.id);
                      toast(source.connected ? `${source.name} נותק` : `${source.name} חובר`);
                    }}
                    className={`shrink-0 rounded-xl px-3 py-2 text-[13px] font-semibold transition active:scale-95 ${
                      source.connected
                        ? 'bg-brand-50 text-brand-700'
                        : 'bg-brand-600 text-white shadow-[0_4px_12px_rgba(108,53,220,0.28)]'
                    }`}
                  >
                    {source.connected ? 'מחובר' : 'חיבור'}
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))}

        <Link to="/paste" className="btn-outline mt-5 w-full">
          <Icon name="chat" size={18} />
          הדבקת הודעת SMS לזיהוי מיידי
        </Link>

        <p className="mt-4 flex items-start gap-2 text-[12px] leading-relaxed text-brand-300">
          <Icon name="shield" size={16} className="mt-0.5 shrink-0" />
          החיבורים בגרסת ההדגמה אינם מבצעים סנכרון אמיתי. בגרסה המלאה הנתונים נשמרים מוצפנים
          ואינם משותפים.
        </p>
      </div>
    </Screen>
  );
}
