import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

export const SearchIcon = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size)} {...p}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
);
export const HeartIcon = ({ size = 21, ...p }: IconProps) => (
  <svg {...base(size)} {...p}><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></svg>
);
export const UserIcon = ({ size = 21, ...p }: IconProps) => (
  <svg {...base(size)} {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>
);
export const BagIcon = ({ size = 21, ...p }: IconProps) => (
  <svg {...base(size)} {...p}><path d="M5 8h14l-1 12H6L5 8z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>
);
export const CartAddIcon = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size)} {...p}><path d="M5 8h14l-1 12H6L5 8z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /><path d="M12 11.5v5M9.5 14h5" /></svg>
);
export const MenuIcon = ({ size = 24, ...p }: IconProps) => (
  <svg {...base(size)} {...p}><path d="M4 7h16M4 12h16M4 17h10" /></svg>
);
export const CloseIcon = ({ size = 24, ...p }: IconProps) => (
  <svg {...base(size)} {...p}><path d="M6 6l12 12M18 6L6 18" /></svg>
);
export const ArrowRightIcon = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size)} {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
export const ArrowLeftIcon = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size)} {...p}><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
);
export const CupIcon = ({ size = 16, ...p }: IconProps) => (
  <svg {...base(size)} {...p}><path d="M5 9h12v5a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5V9z" /><path d="M17 11h1.5a2.5 2.5 0 0 1 0 5H17" /><path d="M9 3v3M12 3v3" /></svg>
);
export const MinusIcon = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size)} {...p}><path d="M5 12h14" /></svg>
);
export const PlusIcon = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size)} {...p}><path d="M12 5v14M5 12h14" /></svg>
);
export const TrashIcon = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size)} {...p}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></svg>
);
export const CheckIcon = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size)} {...p}><path d="M5 12.5l4.5 4.5L19 7" /></svg>
);
export const ClockIcon = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size)} {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>
);
export const PhoneIcon = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size)} {...p}><path d="M6.5 3.5l3 .5 1.5 4-2 1.5a11 11 0 0 0 5.5 5.5l1.5-2 4 1.5.5 3c0 1-1 2-2 2C11 19.5 4.5 13 4.5 5.5c0-1 1-2 2-2z" /></svg>
);
