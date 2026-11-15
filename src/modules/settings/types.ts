/** Thong tin tiem do chu tiem nhap trong Admin (khong tu bia gia tri mac dinh). */
export interface StoreSettings {
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
