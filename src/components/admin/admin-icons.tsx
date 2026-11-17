import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };
const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

export const HomeIcon = ({ size = 20, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z" /></svg>
);
export const ReceiptIcon = ({ size = 20, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6M9 12h6M9 16h3" /></svg>
);
export const CakeIcon = ({ size = 20, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M4 21h16M5 21v-7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7" /><path d="M5 16c1.5 1 3 1 4.5 0s3-1 4.5 0 3 1 5 0" /><path d="M12 12V8M12 5.5c.8-.8.8-1.7 0-2.5-.8.8-.8 1.7 0 2.5z" /></svg>
);
export const InboxIcon = ({ size = 20, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M4 13 6.5 5h11L20 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" /><path d="M4 13h4.5l1 2.5h5l1-2.5H20" /></svg>
);
export const ClockIcon = ({ size = 20, ...p }: P) => (
  <svg {...base(size)} {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>
);
export const GearIcon = ({ size = 20, ...p }: P) => (
  <svg {...base(size)} {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>
);
export const MoreIcon = ({ size = 20, ...p }: P) => (
  <svg {...base(size)} {...p}><circle cx="5" cy="12" r="1.2" /><circle cx="12" cy="12" r="1.2" /><circle cx="19" cy="12" r="1.2" /></svg>
);
export const LogoutIcon = ({ size = 20, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" /><path d="M10 16l-4-4 4-4M6 12h10" /></svg>
);
export const ExternalIcon = ({ size = 18, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" /></svg>
);
export const RefreshIcon = ({ size = 18, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M20 11a8 8 0 0 0-14.3-4.9L4 8" /><path d="M4 4v4h4" /><path d="M4 13a8 8 0 0 0 14.3 4.9L20 16" /><path d="M20 20v-4h-4" /></svg>
);
export const SearchIcon = ({ size = 18, ...p }: P) => (
  <svg {...base(size)} {...p}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
);
export const PhoneIcon = ({ size = 18, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" /></svg>
);
export const ChatIcon = ({ size = 18, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M4 18.5V6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H8.5z" /></svg>
);
export const CopyIcon = ({ size = 16, ...p }: P) => (
  <svg {...base(size)} {...p}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h8" /></svg>
);
export const ChevronLeftIcon = ({ size = 18, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M15 6l-6 6 6 6" /></svg>
);
export const ChevronRightIcon = ({ size = 18, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M9 6l6 6-6 6" /></svg>
);
export const PlusIcon = ({ size = 18, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M12 5v14M5 12h14" /></svg>
);
export const CheckIcon = ({ size = 18, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
);
export const XIcon = ({ size = 18, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M6 6l12 12M18 6L6 18" /></svg>
);
export const AlertIcon = ({ size = 18, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M12 4 2.5 20h19z" /><path d="M12 10v4M12 17h.01" /></svg>
);
export const TrashIcon = ({ size = 16, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>
);
export const WalletIcon = ({ size = 18, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M4 7a2 2 0 0 1 2-2h12v4" /><path d="M4 7v11a2 2 0 0 0 2 2h14V9H6a2 2 0 0 1-2-2z" /><path d="M16 14.5h.01" /></svg>
);
export const CupIcon = ({ size = 20, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M5 8h12v6a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5z" /><path d="M17 9.5h1.5a2.5 2.5 0 0 1 0 5H17" /><path d="M9 3.5c-.8 1 .8 1.8 0 3M13 3.5c-.8 1 .8 1.8 0 3" /></svg>
);
export const ChartIcon = ({ size = 20, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M4 20h16" /><path d="M7 16v-5M12 16V7M17 16v-8" /></svg>
);
export const DownloadIcon = ({ size = 18, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M12 4v11M7 10.5l5 4.5 5-4.5" /><path d="M5 20h14" /></svg>
);
export const MailIcon = ({ size = 20, ...p }: P) => (
  <svg {...base(size)} {...p}><rect x="3.5" y="5.5" width="17" height="13" rx="2.5" /><path d="m4.5 7 7.5 5.5L19.5 7" /></svg>
);
export const LockIcon = ({ size = 20, ...p }: P) => (
  <svg {...base(size)} {...p}><rect x="5" y="10.5" width="14" height="10" rx="2.5" /><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" /><path d="M12 14.5v2" /></svg>
);
export const EyeIcon = ({ size = 20, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" /></svg>
);
export const EyeOffIcon = ({ size = 20, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M10.6 5.6A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.6 3.4M6.4 6.9C3.9 8.6 2.5 12 2.5 12S6 18.5 12 18.5c1.6 0 3-.4 4.2-1.1" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M4 4l16 16" /></svg>
);
export const ArrowRightIcon = ({ size = 20, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
export const ShieldIcon = ({ size = 20, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M12 3.5 5 6v5.5c0 4.3 3 7.6 7 9 4-1.4 7-4.7 7-9V6z" /><path d="m9 12 2.2 2.2L15.5 10" /></svg>
);
export const TagIcon = ({ size = 20, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7a1 1 0 0 1 .7.3l8 8a1 1 0 0 1 0 1.4l-7.7 7.7a1 1 0 0 1-1.4 0l-8-8a1 1 0 0 1-.3-.7z" /><circle cx="8.2" cy="8.2" r="1.4" /></svg>
);
export const PencilIcon = ({ size = 20, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z" /><path d="m13.5 6.5 4 4" /></svg>
);
export const UsersIcon = ({ size = 20, ...p }: P) => (
  <svg {...base(size)} {...p}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.9-3.6 3.4-5.5 6.5-5.5s5.6 1.9 6.5 5.5" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 14.8c1.6.8 2.6 2.5 3 5.2" /></svg>
);
export const GripIcon = ({ size = 18, ...p }: P) => (
  <svg {...base(size)} {...p}><circle cx="9" cy="6" r="1.3" /><circle cx="15" cy="6" r="1.3" /><circle cx="9" cy="12" r="1.3" /><circle cx="15" cy="12" r="1.3" /><circle cx="9" cy="18" r="1.3" /><circle cx="15" cy="18" r="1.3" /></svg>
);
export const MoveIcon = ({ size = 18, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3" /></svg>
);
