import { useNavigate } from 'react-router-dom';
import { Icon, type IconName } from '../components/Icon';
import { LogoMark } from '../components/Logo';
import { useStore } from '../store/store';

const FEATURES: { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'box',
    title: 'כל החבילות שלך במקום אחד',
    body: 'מעקב אחר כל ההזמנות שלך בזמן אמת',
  },
  {
    icon: 'bell',
    title: 'התראות חכמות',
    body: 'עדכונים חשובים ושינויים במשלוח',
  },
  {
    icon: 'pin',
    title: 'שינוי מיקום בקליק',
    body: 'קבלת קישור ישיר לשינוי כתובת או נקודת איסוף',
  },
  {
    icon: 'mail',
    title: 'איסוף ממקורות שונים',
    body: 'Gmail, SMS, AliExpress, SHEIN, Temu, Amazon ועוד',
  },
  {
    icon: 'shield',
    title: 'מאובטח ופרטי',
    body: 'המידע שלך נשמר בצורה מאובטחת ואינו משותף',
  },
];

export function WelcomePage() {
  const navigate = useNavigate();
  const { setOnboarded } = useStore();

  const enter = () => {
    setOnboarded(true);
    navigate('/', { replace: true });
  };

  return (
    <main className="no-scrollbar flex-1 overflow-y-auto bg-white">
      <div className="safe-top px-6 pb-10 pt-10">
        <div className="flex items-center gap-3">
          <LogoMark size={46} />
          <span dir="ltr" className="text-[34px] font-extrabold tracking-tight text-brand-700">
            Parcelly
          </span>
        </div>
        <p className="mt-2 text-[16px] font-semibold text-brand-500">
          כל החבילות שלך, במקום אחד.
        </p>

        <p className="mt-5 text-[14px] leading-relaxed text-brand-ink/70">
          Parcelly אוספת עבורך מידע על כל החבילות – מהודעות ממסרונים, אימיילים, חשבונות בחנויות
          אונליין וחברות שילוח – ומאגדת את הכול למקום אחד מסודר וברור.
        </p>

        <ul className="mt-8 space-y-5">
          {FEATURES.map((feature) => (
            <li key={feature.title} className="flex gap-3.5">
              <span className="mt-0.5 shrink-0 text-brand-600">
                <Icon name={feature.icon} size={26} />
              </span>
              <span>
                <span className="block text-[15px] font-bold text-brand-700">{feature.title}</span>
                <span className="mt-0.5 block text-[13px] leading-relaxed text-brand-ink/60">
                  {feature.body}
                </span>
              </span>
            </li>
          ))}
        </ul>

        <button type="button" onClick={enter} className="btn-primary mt-9 w-full">
          כניסה לאפליקציה
        </button>
        <p className="mt-3 text-center text-[12px] text-brand-300">
          גרסת הדגמה – הנתונים נשמרים מקומית בדפדפן
        </p>
      </div>
    </main>
  );
}
