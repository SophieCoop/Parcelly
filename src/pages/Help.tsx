import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { PageHeader, Screen } from '../components/Screen';

const FAQ = [
  {
    question: 'איך מוסיפים חבילה?',
    answer:
      'אפשר להדביק הודעת SMS מהשליח ו‑Parcelly תזהה את מספר המעקב, החנות והמועד המשוער. לחלופין, אפשר להוסיף מספר מעקב ידנית ממסך "הוספת חבילה".',
  },
  {
    question: 'מאילו מקורות נאסף המידע?',
    answer:
      'מתיבות דואר (Gmail, Outlook), מהודעות SMS שהדבקתם, ומחיבור ישיר לחשבונות בחנויות כמו AliExpress, SHEIN, Temu ו‑Amazon.',
  },
  {
    question: 'אפשר לשנות את מקום המסירה?',
    answer:
      'בכרטיס החבילה, תחת "פרטי משלוח", אפשר להחליף בין משלוח עד הבית לנקודת איסוף ולבחור נקודה אחרת – כל עוד חברת השילוח עדיין מאפשרת זאת.',
  },
  {
    question: 'למה חלק מהחבילות מסומנות כ"דורש פעולה"?',
    answer:
      'כשמזוהה הודעה שדורשת מכם משהו – בחירת נקודת איסוף, שחרור מכס, תשלום מיסים או תיאום מסירה מחדש – החבילה מסומנת כדי שלא תפספסו את המועד.',
  },
  {
    question: 'מה קורה למידע שלי?',
    answer:
      'בגרסת ההדגמה כל המידע נשמר מקומית בדפדפן שלכם, וזיהוי הודעות ה‑SMS מתבצע במכשיר בלבד.',
  },
];

export function HelpPage() {
  const [open, setOpen] = useState<number | undefined>(0);

  return (
    <Screen header={<PageHeader title="עזרה ותמיכה" subtle />}>
      <div className="px-4 pb-10">
        <div className="card divide-y divide-brand-50 overflow-hidden">
          {FAQ.map((item, index) => (
            <div key={item.question}>
              <button
                type="button"
                onClick={() => setOpen(open === index ? undefined : index)}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-right transition active:bg-brand-50"
                aria-expanded={open === index}
              >
                <span className="flex-1 text-[15px] font-medium text-brand-ink">
                  {item.question}
                </span>
                <Icon
                  name="chevron"
                  size={18}
                  className={`shrink-0 text-brand-300 transition-transform ${
                    open === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {open === index && (
                <p className="px-4 pb-4 text-[14px] leading-relaxed text-brand-400">{item.answer}</p>
              )}
            </div>
          ))}
        </div>

        <h2 className="section-title mt-5">עדיין צריכים עזרה?</h2>
        <div className="space-y-2">
          <a href="mailto:support@parcelly.app" className="btn-outline w-full">
            <Icon name="mail" size={18} />
            שליחת מייל לתמיכה
          </a>
          <Link to="/paste" className="btn-ghost w-full">
            <Icon name="chat" size={18} />
            זיהוי הודעת SMS
          </Link>
        </div>
      </div>
    </Screen>
  );
}
