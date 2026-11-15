import { pickupSlotLabel } from "@/lib/pickup";
import { periodRange } from "@/modules/admin/reports";
import { getAdminUser } from "@/modules/admin/session";
import { getOrdersRepository } from "@/modules/orders/repository";
import { orderStatusLabels, paymentLabels, paymentStatusLabels } from "@/modules/orders/types";

export const dynamic = "force-dynamic";

/** Chong "CSV injection" khi mo bang Excel: o bat dau bang = + - @ thi them dau ' */
const cell = (v: string | number) => {
  let s = String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function GET(request: Request) {
  const user = await getAdminUser();
  // Co SDT khach -> chi chu tiem duoc tai
  if (!user || user.role !== "owner") return new Response("Không có quyền.", { status: 403 });

  const url = new URL(request.url);
  const { from, to } = periodRange(url.searchParams.get("ky") ?? "7-ngay");
  const orders = await getOrdersRepository().list({ pickupFrom: from, pickupTo: to, limit: 5000 });

  const header = ["Mã đơn", "Ngày nhận", "Khung giờ", "Trạng thái", "Thanh toán", "Tình trạng tiền", "Khách", "Số điện thoại", "Món", "Số món", "Tổng (VND)", "Đặt lúc"];
  const lines = orders
    .sort((a, b) => a.pickupDate.localeCompare(b.pickupDate))
    .map((o) =>
      [
        o.code,
        o.pickupDate,
        pickupSlotLabel(o.pickupSlotId),
        orderStatusLabels[o.status],
        paymentLabels[o.payment],
        paymentStatusLabels[o.paymentStatus],
        o.customerName,
        o.customerPhone,
        o.items.map((i) => `${i.qty}x ${i.name}`).join("; "),
        o.items.reduce((n, i) => n + i.qty, 0),
        o.totalVnd,
        new Date(o.createdAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }),
      ]
        .map(cell)
        .join(","),
    );
  // BOM de Excel doc dung tieng Viet
  const body = `﻿${[header.map(cell).join(","), ...lines].join("\r\n")}`;
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="the-yub-don-${from}_${to}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
