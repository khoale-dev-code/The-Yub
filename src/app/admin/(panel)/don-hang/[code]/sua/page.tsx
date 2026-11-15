import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeftIcon } from "@/components/admin/admin-icons";
import { OrderForm } from "@/components/admin/order-form";
import { PageHeader } from "@/components/admin/ui";
import { EDITABLE } from "@/modules/admin/orders";
import { requireAdmin } from "@/modules/admin/session";
import { getOrdersRepository } from "@/modules/orders/repository";
import { productsRepository } from "@/modules/products/repository";

export const metadata: Metadata = { title: "Sửa đơn" };

export default async function AdminEditOrderPage({ params }: { params: Promise<{ code: string }> }) {
  await requireAdmin();
  const code = decodeURIComponent((await params).code);
  if (!/^YUB-\d{4}-\d{4}$/.test(code)) notFound();
  const [order, all] = await Promise.all([getOrdersRepository().findByCode(code), productsRepository.listAll()]);
  if (!order) notFound();
  if (!EDITABLE.includes(order.status)) redirect(`/admin/don-hang/${code}`);

  return (
    <>
      <PageHeader
        back={<Link href={`/admin/don-hang/${code}`} className="inline-flex min-h-9 items-center gap-1 self-start text-[14px] font-semibold text-muted no-underline hover:text-maroon"><ChevronLeftIcon size={16} /> {code}</Link>}
        title={`Sửa đơn ${code}`}
        description={order.paymentStatus === "paid" ? "Đơn đã ghi nhận thanh toán: chỉ đổi được thông tin, không đổi món làm thay đổi tổng tiền." : "Đổi món, số lượng, ngày giờ nhận hoặc thông tin khách. Tổng tiền tính lại theo giá hiện tại."}
      />
      <OrderForm
        products={all.filter((p) => p.isActive !== false)}
        initial={{
          code,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          pickupDate: order.pickupDate,
          slotId: order.pickupSlotId,
          payment: order.payment,
          note: order.note,
          paid: order.paymentStatus === "paid",
          items: order.items.map((i) => ({ productId: i.productId, variantId: i.variantId, qty: i.qty, name: i.name })),
        }}
      />
    </>
  );
}
