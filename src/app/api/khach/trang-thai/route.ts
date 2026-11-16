import { NextResponse } from "next/server";
import { customersRepository } from "@/modules/customers/repository";
import { getCustomer, getCustomerMode } from "@/modules/customers/session";

export const dynamic = "force-dynamic";

/**
 * Trang thai dang nhap cho header + nut tim (cac trang cong khai la trang tinh).
 * Chi tra ve du lieu cua CHINH nguoi dang goi, khong cache.
 */
export async function GET() {
  const headers = { "Cache-Control": "private, no-store" };
  const mode = getCustomerMode();
  const me = await getCustomer();
  if (!me) return NextResponse.json({ loggedIn: false, mode }, { headers });
  const favorites = await customersRepository()
    .favorites(me.id)
    .catch(() => [] as string[]);
  return NextResponse.json(
    { loggedIn: true, mode, name: me.fullName, avatar: me.avatarUrl, phone: me.phone, favorites },
    { headers },
  );
}
