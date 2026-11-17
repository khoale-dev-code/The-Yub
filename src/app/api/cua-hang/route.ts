import { NextResponse } from "next/server";
import { getStoreInfo } from "@/modules/settings/store-info-server";

export const dynamic = "force-dynamic";

/**
 * Thong tin CONG KHAI cua tiem (ten, SDT, gio mo/dong cua, gio me banh) – khong co du lieu ngan hang.
 * Trang khach goi lai khi mo / quay lai tab de gio vua sua trong Admin hien ngay,
 * ke ca khi trinh duyet hoac CDN dang giu ban HTML cu.
 */
export async function GET() {
  const info = await getStoreInfo();
  return NextResponse.json(info, { headers: { "Cache-Control": "no-store" } });
}
