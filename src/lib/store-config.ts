/**
 * Store Settings – mot nguon cau hinh duy nhat cho thong tin tiem.
 * Cac thong tin CHUA duoc cung cap (dia chi, tai khoan ngan hang, chinh sach)
 * de o dang cau hinh cho xac nhan, KHONG tu bia.
 */

export const storeConfig = {
  name: "The Yub – Bakes & More",
  slogan: "Nơi giòn rụm gặp thơm bơ",
  phone: "0975 840 157",
  phoneHref: "tel:0975840157",
  openHours: "7:30 – 19:00",
  /** Gio mo/dong dang HH:mm (Asia/Ho_Chi_Minh) – dung cho trang thai "Đang mở cửa" */
  openTime: "07:30",
  closeTime: "19:00",
  timeZone: "Asia/Ho_Chi_Minh",
  freshBatchTime: "14:30",
  // Dia chi, ban do, tai khoan ngan hang: nhap trong Admin > Cai dat (src/modules/settings).
} as const;
