/** Khung gio nhan banh tai tiem (7:30–19:00, banh moi ra lo 14:30). */
export interface PickupSlot {
  id: string;
  label: string;
  /** Gio bat dau – hien to tren nut chon */
  start: string;
  /** Gio ket thuc (HH:mm) – qua gio nay thi khung gio hom nay khong chon duoc nua */
  end: string;
  note: string;
  /** Khung gio co banh vua ra lo */
  hot?: boolean;
}

export const pickupSlots: PickupSlot[] = [
  { id: "s1", label: "08:00 – 10:00", start: "08:00", end: "10:00", note: "Sáng" },
  { id: "s2", label: "10:00 – 12:00", start: "10:00", end: "12:00", note: "Sáng" },
  { id: "s3", label: "12:00 – 14:30", start: "12:00", end: "14:30", note: "Trưa" },
  { id: "s4", label: "14:30 – 16:00", start: "14:30", end: "16:00", note: "Mẻ mới", hot: true },
  { id: "s5", label: "16:00 – 18:00", start: "16:00", end: "18:00", note: "Chiều" },
  { id: "s6", label: "18:00 – 19:00", start: "18:00", end: "19:00", note: "Tối" },
];

/** So ngay hien thi de chon (hom nay + 6 ngay, nam trong gioi han 7 ngay cua server) */
export const PICKUP_DATE_COUNT = 7;

/** Mac dinh: khung gio co me banh moi ra lo */
export const DEFAULT_SLOT_ID = "s4";

export interface PickupDateOption {
  /** yyyy-mm-dd */
  value: string;
  /** "Hôm nay", "Ngày mai", "Thứ Bảy"… */
  top: string;
  /** "13/11" */
  day: string;
}

function toDateValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const WEEKDAYS = ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

/**
 * Danh sach ngay nhan trong `count` ngay toi.
 * Luu y: dung gio may; production nen chot mui gio Asia/Ho_Chi_Minh o server.
 */
export function getPickupDateOptions(count = 4, from: Date = new Date()): PickupDateOption[] {
  const out: PickupDateOption[] = [];
  for (let i = 0; i < count; i += 1) {
    const d = new Date(from);
    d.setDate(d.getDate() + i);
    const top = i === 0 ? "Hôm nay" : i === 1 ? "Ngày mai" : (WEEKDAYS[d.getDay()] ?? "");
    out.push({
      value: toDateValue(d),
      top,
      day: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`,
    });
  }
  return out;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Ngay nhan hop le: tu hom nay den toi da 7 ngay sau. */
export function isValidPickupDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((date.getTime() - today.getTime()) / 86_400_000);
  return diffDays >= 0 && diffDays <= 7;
}

export function pickupSlotLabel(slotId: string): string {
  return pickupSlots.find((s) => s.id === slotId)?.label ?? slotId;
}

/** "2026-11-13" -> "13/11" */
export function formatPickupDate(value: string): string {
  const [, m, d] = value.split("-");
  return m && d ? `${d}/${m}` : value;
}

/** Ngay nhan co phai hom nay (theo gio may chu) */
export function isToday(value: string): boolean {
  const today = new Date();
  return value === toDateValue(today);
}

const hhmmToMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};

/** Phut hien tai trong ngay theo gio Viet Nam (khong phu thuoc mui gio may khach) */
export function nowMinutesVN(timeZone = "Asia/Ho_Chi_Minh"): number {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0) % 24;
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return h * 60 + m;
}

/**
 * Khung gio hom nay da qua chua (chi la goi y tren giao dien –
 * tiem van goi xac nhan lai gio nhan truoc khi chuan bi).
 */
export function isSlotPast(slot: PickupSlot, nowMinutes: number): boolean {
  return nowMinutes >= hhmmToMinutes(slot.end);
}
