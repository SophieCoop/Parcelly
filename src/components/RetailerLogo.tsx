import { getRetailer } from '../data/retailers';

const MARK_CLASS: Record<string, string> = {
  sans: 'font-extrabold tracking-tight',
  serif: 'font-bold tracking-[0.02em] [font-family:Georgia,"Times New Roman",serif]',
  wide: 'font-bold tracking-[0.22em]',
  condensed: 'font-semibold tracking-[0.3em]',
};

interface RetailerLogoProps {
  retailerId: string;
  /** Overrides the registry name – used for retailers we don't know. */
  name?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASS = { sm: 'text-[15px]', md: 'text-[19px]', lg: 'text-[23px]' };

/** Retailer wordmark, set in the brand's colour and letterforms. */
export function RetailerLogo({ retailerId, name, size = 'md' }: RetailerLogoProps) {
  const retailer = getRetailer(retailerId);
  const label = retailerId === 'other' && name ? name : retailer.name;
  return (
    <span
      dir="ltr"
      className={`${MARK_CLASS[retailer.mark]} ${SIZE_CLASS[size]} leading-none`}
      style={{ color: retailer.color }}
    >
      {label}
    </span>
  );
}
