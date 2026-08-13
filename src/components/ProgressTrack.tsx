import { MILESTONE_ORDER } from '../types';

interface ProgressTrackProps {
  /** Index of the milestone the parcel has reached. */
  step: number;
  color: string;
}

/** The four-dot progress line on a package card. */
export function ProgressTrack({ step, color }: ProgressTrackProps) {
  const last = MILESTONE_ORDER.length - 1;
  const percent = Math.min(100, Math.max(0, (step / last) * 100));

  return (
    <div className="relative h-3" aria-hidden="true">
      <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-black/[0.07]" />
      <div
        className="absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full transition-[width] duration-500"
        style={{ width: `${percent}%`, backgroundColor: color, right: 0 }}
      />
      {/* The container is RTL, so the first milestone sits on the right. */}
      <div className="absolute inset-0 flex items-center justify-between">
        {MILESTONE_ORDER.map((milestone, index) => {
          const reached = index <= step;
          const current = index === step;
          return (
            <span
              key={milestone}
              className="rounded-full transition-all duration-300"
              style={{
                width: current ? 11 : 9,
                height: current ? 11 : 9,
                backgroundColor: reached ? color : '#FFFFFF',
                border: reached ? 'none' : '2px solid rgba(0,0,0,0.12)',
                boxShadow: current ? `0 0 0 3px ${color}33` : undefined,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
