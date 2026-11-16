/** Khach dang nhap bang Google (tach biet hoan toan voi tai khoan quan ly). */
export interface Customer {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  /** Khach tu nhap trong trang Tai khoan (hoac lay tu don dau tien) */
  phone: string | null;
  address: string | null;
  /** Phien ban van ban dong y + thoi diem dong y (bang chung theo phap luat ve bao ve du lieu ca nhan) */
  consentVersion: string;
  consentedAt: string;
  /** Dong y RIENG nhan tin uu dai (khong bat buoc) */
  marketingOptIn: boolean;
  createdAt: string;
  lastLoginAt: string;
}

/** Dong tom tat cho Admin > Khach hang */
export interface CustomerSummary extends Customer {
  orderCount: number;
  /** Tong tien cac don khong bi huy / tu choi */
  totalVnd: number;
  lastOrderAt: string | null;
}
