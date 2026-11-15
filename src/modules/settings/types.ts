/** Thong tin tiem do chu tiem nhap trong Admin (khong tu bia gia tri mac dinh). */
export interface StoreSettings {
  /** Thong tin tiem – null = dung gia tri mac dinh trong src/lib/store-config.ts */
  storeName: string | null;
  phone: string | null;
  /** HH:mm */
  openTime: string | null;
  closeTime: string | null;
  freshBatchTime: string | null;
  address: string | null;
  mapUrl: string | null;
  mapEmbedUrl: string | null;
  bankName: string | null;
  bankAccountNo: string | null;
  bankAccountName: string | null;
  /** Tat = tam ngung nhan don online (khach van xem thuc don) */
  orderingEnabled: boolean;
  orderingPausedMessage: string | null;
}

export const ADDRESS_PLACEHOLDER = "[Địa chỉ tiệm – chờ xác nhận]";
