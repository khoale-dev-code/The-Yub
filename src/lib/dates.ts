/** Ngay gio theo mui gio tiem (Asia/Ho_Chi_Minh) – dung o server lan client. */
const TZ = "Asia/Ho_Chi_Minh";

/** yyyy-mm-dd cua "hom nay" tai tiem */
export function todayVN(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** Cong/tru ngay cho chuoi yyyy-mm-dd */
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

/** "2026-11-15" -> "T7 15/11" (nhan ngan) */
export function shortDateLabel(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  return `${WEEKDAYS[d.getUTCDay()] ?? ""} ${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Hom nay / Ngay mai / T5 20/11 */
export function relativeDateLabel(date: string, today: string = todayVN()): string {
  if (date === today) return "Hôm nay";
  if (date === addDays(today, 1)) return "Ngày mai";
  if (date === addDays(today, -1)) return "Hôm qua";
  return shortDateLabel(date);
}

/** ISO -> "14:05 · 15/11" theo gio tiem */
export function timeAndDate(iso: string): string {
  const d = new Date(iso);
  const time = new Intl.DateTimeFormat("vi-VN", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false }).format(d);
  const day = new Intl.DateTimeFormat("vi-VN", { timeZone: TZ, day: "2-digit", month: "2-digit" }).format(d);
  return `${time} · ${day}`;
}

/** "vừa xong", "5 phút trước", "3 giờ trước", hoặc ngày */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const diff = Math.max(0, Math.round((now.getTime() - new Date(iso).getTime()) / 60000));
  if (diff < 1) return "vừa xong";
  if (diff < 60) return `${diff} phút trước`;
  if (diff < 24 * 60) return `${Math.floor(diff / 60)} giờ trước`;
  return timeAndDate(iso);
}
