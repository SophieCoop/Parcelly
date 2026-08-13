import type { SVGProps } from 'react';

export type IconName =
  | 'menu'
  | 'bell'
  | 'plus'
  | 'back'
  | 'forward'
  | 'chevron'
  | 'box'
  | 'home'
  | 'clock'
  | 'settings'
  | 'alert'
  | 'pin'
  | 'link'
  | 'mail'
  | 'chat'
  | 'help'
  | 'logout'
  | 'copy'
  | 'check'
  | 'close'
  | 'info'
  | 'phone'
  | 'external'
  | 'trash'
  | 'shield'
  | 'search'
  | 'dots'
  | 'truck'
  | 'store'
  | 'sparkles';

const PATHS: Record<IconName, string> = {
  menu: 'M4 7h16M4 12h16M4 17h16',
  bell: 'M18 8a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6M13.7 20a2 2 0 0 1-3.4 0',
  plus: 'M12 5v14M5 12h14',
  back: 'M9 6l6 6-6 6',
  forward: 'M15 6l-6 6 6 6',
  chevron: 'M6 9l6 6 6-6',
  box: 'M21 8.5v7L12 21l-9-5.5v-7L12 3zM3 8.5 12 14l9-5.5M12 14v7',
  home: 'M3 10.5 12 3l9 7.5M5.5 9.5V20h13V9.5',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3.5 2',
  settings:
    'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm8-3.5a8 8 0 0 0-.14-1.5l2-1.6-2-3.4-2.4 1a8 8 0 0 0-2.6-1.5L14.5 2h-4l-.36 2.6a8 8 0 0 0-2.6 1.5l-2.4-1-2 3.4 2 1.6a8 8 0 0 0 0 3l-2 1.6 2 3.4 2.4-1a8 8 0 0 0 2.6 1.5l.36 2.6h4l.36-2.6a8 8 0 0 0 2.6-1.5l2.4 1 2-3.4-2-1.6c.1-.5.14-1 .14-1.5Z',
  alert: 'M12 3.5 22 20H2L12 3.5ZM12 10v4.5M12 17.2v.1',
  pin: 'M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11ZM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  link: 'M10 13.5a4 4 0 0 0 5.7.3l2.6-2.6a4 4 0 0 0-5.7-5.7L11.2 7M14 10.5a4 4 0 0 0-5.7-.3l-2.6 2.6a4 4 0 0 0 5.7 5.7L12.8 17',
  mail: 'M3 6.5h18v11H3zM3 7l9 6 9-6',
  chat: 'M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-5.2A8 8 0 1 1 21 12Z',
  help: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM9.6 9.5a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .9-1 1.7M12 16.8v.1',
  logout: 'M15 4.5H19v15h-4M13 12H4m0 0 3.5-3.5M4 12l3.5 3.5',
  copy: 'M9 9.5h9.5V21H9zM15 6.5V3H5.5v11.5H9',
  check: 'M5 12.5 10 17.5 19 7',
  close: 'M6 6l12 12M18 6 6 18',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 11v6M12 7.5v.1',
  phone: 'M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2Z',
  external: 'M14 4h6v6M20 4l-8.5 8.5M18 14v5.5H4.5V6H10',
  trash: 'M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10.5 11v5M13.5 11v5',
  shield: 'M12 3l7.5 3v6c0 4.5-3.2 7.8-7.5 9-4.3-1.2-7.5-4.5-7.5-9V6L12 3ZM8.8 12.2l2.2 2.2 4.2-4.2',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM16.2 16.2 21 21',
  dots: 'M12 6.2v.1M12 12v.1M12 17.8v.1',
  truck: 'M3 6.5h11v10H3zM14 10h3.5l3 3.5v3H14M7 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  store: 'M4 9.5V20h16V9.5M3 9.5 5 4h14l2 5.5a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0ZM10 20v-5.5h4V20',
  sparkles: 'M12 3.5l1.8 4.7 4.7 1.8-4.7 1.8L12 16.5l-1.8-4.7-4.7-1.8 4.7-1.8zM18.5 15l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z',
};

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  size?: number;
  /** Filled icons use the current colour as fill instead of stroke. */
  filled?: boolean;
}

export function Icon({ name, size = 22, filled = false, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <path
        d={PATHS[name]}
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={filled ? 'currentColor' : 'none'}
        fillOpacity={filled ? 0.12 : undefined}
      />
    </svg>
  );
}
