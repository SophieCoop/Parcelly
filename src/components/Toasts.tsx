import { useUI } from '../store/ui';

export function Toasts() {
  const { toasts } = useUI();
  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-24 z-[70] flex flex-col items-center gap-2 px-6">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="animate-pop-in rounded-xl bg-brand-900/92 px-4 py-2.5 text-center text-[13px] font-medium text-white shadow-lg"
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
