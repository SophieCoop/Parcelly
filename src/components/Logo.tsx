interface LogoProps {
  size?: number;
  className?: string;
}

/** The Parcelly cube mark. */
export function LogoMark({ size = 32, className = '' }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="parcelly-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#9273EF" />
          <stop offset="1" stopColor="#5B27BC" />
        </linearGradient>
      </defs>
      <path d="M32 5 57 18.5v27L32 59 7 45.5v-27z" fill="url(#parcelly-mark)" />
      <path
        d="M7 18.5 32 32l25-13.5M32 32v27"
        stroke="#fff"
        strokeWidth="3"
        strokeLinejoin="round"
        fill="none"
        opacity="0.85"
      />
      <path d="M19.5 11.8 44.5 25.3v9L19.5 20.8z" fill="#fff" opacity="0.35" />
    </svg>
  );
}

export function LogoWordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`font-bold tracking-tight text-brand-700 ${className}`} dir="ltr">
      Parcelly
    </span>
  );
}

export function Logo({ size = 32, className = '' }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark size={size} />
      <LogoWordmark className="text-[22px]" />
    </span>
  );
}
