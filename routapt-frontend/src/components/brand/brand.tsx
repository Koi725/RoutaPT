import { BrandProps } from "./brand-types";

export const Brand = ({ className = "" }: BrandProps) => (
  <div className={`brand ${className}`}>
    <div className="brand-mark" aria-hidden="true">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 19c4-1 4-7 0-8s4-7 8-8M19 5l1 3-3 1" />
      </svg>
    </div>
    <div className="brand-name">Routa<em>PT</em></div>
  </div>
);