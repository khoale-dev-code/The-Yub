// TheYub-Order-Anytime-V1
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { productImages } from "@/lib/images";
import { formatPickupDate, getPickupDateOptions, pickupSlots, type PickupDateOption } from "@/lib/pickup";
import { useCart } from "@/modules/cart/cart-context";
import { ArrowRightIcon } from "../ui/icons";

/** "Hôm nay" -> "hôm nay" khi dung giua cau; thu trong tuan giu nguyen */
const describeDay = (top: string) => (top === "Hôm nay" || top === "Ngày mai" ? top.toLowerCase() : top);

const onCls = "border-maroon bg-maroon text-cream";
const offCls = "border-maroon/20 bg-card text-maroon hover:border-maroon";

/**
 * "Dat banh theo gio hen" – chon ngay + khung gio, luu vao gio hang
 * roi sang /gio-hang. Danh sach ngay tinh o client de dung ngay cua may khach.
 */
export function PickupPlanner({ variant = "split" }: { variant?: "split" | "sheet" }) {
  const { pickup, setPickup, count } = useCart();
  const [dates, setDates] = useState<PickupDateOption[]>([]);

  useEffect(() => setDates(getPickupDateOptions(4)), []);

  // Mac dinh hom nay neu chua chon/ngay cu; tiem xac nhan gio nhan.
  useEffect(() => {
    if (dates.length === 0) return;
    if (!dates.some((d) => d.value === pickup.date)) {
      const fallback = dates[0];
      if (fallback) setPickup({ date: fallback.value });
    }
  }, [dates, pickup.date, setPickup]);

  const selectedDate = dates.find((d) => d.value === pickup.date);
  const dateLabel = selectedDate ? `${describeDay(selectedDate.top)} (${formatPickupDate(selectedDate.value)})` : "…";
  const slot = useMemo(() => pickupSlots.find((s) => s.id === pickup.slotId) ?? pickupSlots[3], [pickup.slotId]);

  const placeholderDates = Array.from({ length: 4 }, (_, i) => ({ value: `ph-${i}`, top: "…", day: "--/--" }));
  const shownDates = dates.length ? dates : placeholderDates;
  const ctaHref = count > 0 ? "/gio-hang" : "/thuc-don";

  if (variant === "sheet") {
    return (
      <div className="flex w-full flex-col gap-[18px] rounded-[28px] border border-maroon/12 bg-card px-4 pb-[18px] pt-3">
        <span aria-hidden="true" className="h-1 w-10 self-center rounded-full bg-maroon/20" />
        <fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0">
          <legend className="mb-2.5 p-0 text-[15px] font-bold">1 · Ngày nhận</legend>
          <div className="grid grid-cols-4 gap-1.5">
            {shownDates.map((d) => (
              <button key={d.value} type="button" aria-pressed={d.value === pickup.date} onClick={() => setPickup({ date: d.value })} disabled={d.value.startsWith("ph-")} className={`flex min-h-[62px] flex-col items-center justify-center gap-px rounded-2xl border px-0.5 py-1.5 ${d.value === pickup.date ? onCls : offCls}`}>
                <span className="text-xs leading-[1.3]">{d.top}</span>
                <span className="font-display text-lg font-semibold leading-[1.2]">{d.day}</span>
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0">
          <legend className="mb-2.5 p-0 text-[15px] font-bold">2 · Khung giờ nhận</legend>
          <div className="grid grid-cols-3 gap-1.5">
            {pickupSlots.map((sl) => (
              <button key={sl.id} type="button" aria-pressed={sl.id === pickup.slotId} onClick={() => setPickup({ slotId: sl.id })} className={`flex min-h-[54px] flex-col items-center justify-center rounded-[14px] border ${sl.id === pickup.slotId ? onCls : offCls}`}>
                <span className="text-base font-bold leading-[1.25]">{sl.start}</span>
                <span className="text-xs leading-[1.3]">{sl.note}</span>
              </button>
            ))}
          </div>
        </fieldset>
        <div className="rounded-[18px] bg-maroon px-4 py-3.5 text-sm leading-normal text-cream">
          Nhận bánh lúc <strong className="text-butter">{slot?.start}</strong>, {dateLabel}. Tiệm sẽ gọi xác nhận trước khi chuẩn bị.
        </div>
        <Link href={ctaHref} className="flex min-h-[54px] items-center justify-center gap-2 rounded-full bg-butter font-bold text-maroon no-underline hover:text-maroon">
          {count > 0 ? `Tiếp tục đặt bánh · ${count} món` : "Chọn bánh"} <ArrowRightIcon />
        </Link>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-wrap overflow-hidden rounded-[28px]">
      <div className="flex min-w-0 flex-[1_1_480px] flex-col gap-6 bg-beige p-6 sm:p-10">
        <fieldset className="m-0 flex flex-col gap-3 border-0 p-0">
          <legend className="mb-3 p-0 text-[15px] font-bold">Ngày nhận</legend>
          <div className="grid grid-cols-4 gap-2">
            {shownDates.map((d) => (
              <button key={d.value} type="button" aria-pressed={d.value === pickup.date} onClick={() => setPickup({ date: d.value })} disabled={d.value.startsWith("ph-")} className={`flex min-h-16 flex-col items-center justify-center rounded-[14px] border px-1 py-1.5 ${d.value === pickup.date ? onCls : offCls}`}>
                <span className="text-xs font-medium">{d.top}</span>
                <span className="font-display text-xl font-semibold">{d.day}</span>
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="m-0 flex flex-col gap-3 border-0 p-0">
          <legend className="mb-3 p-0 text-[15px] font-bold">Khung giờ nhận</legend>
          <div className="grid grid-cols-3 gap-2">
            {pickupSlots.map((s) => (
              <button key={s.id} type="button" aria-pressed={s.id === pickup.slotId} onClick={() => setPickup({ slotId: s.id })} className={`flex min-h-14 flex-col items-center justify-center rounded-[14px] border ${s.id === pickup.slotId ? onCls : offCls}`}>
                <span className="text-base font-bold">{s.start}</span>
                <span className="text-xs">{s.note}</span>
              </button>
            ))}
          </div>
        </fieldset>
        <p className="m-0 text-[13px] text-muted-2">Khung giờ đã kín sẽ được tiệm khoá khi có hệ thống quản lý sức chứa.</p>
      </div>
      <div className="relative flex min-h-[460px] min-w-0 flex-[1_1_400px] flex-col justify-between gap-8 overflow-hidden bg-maroon px-6 py-10 text-cream sm:px-11 sm:py-12">
        <Image src={productImages.tartBox} alt="" aria-hidden="true" fill sizes="(min-width: 1024px) 560px, 100vw" className="object-cover opacity-[0.28]" />
        <div className="relative flex flex-col gap-3.5">
          <p className="m-0 font-display text-[26px] font-semibold leading-[1.3] sm:text-[30px]">“Chúng mình nướng theo mẻ nhỏ. Hẹn trước một chút, phần bánh của bạn sẽ được để riêng.”</p>
          <span className="text-sm text-cream/85">— The Yub</span>
        </div>
        <div className="relative flex flex-col gap-4">
          <div className="border-t border-cream/25 pt-[18px] text-[15px]">
            Nhận bánh lúc <strong className="text-butter">{slot?.start}</strong>, {dateLabel}. Tiệm sẽ gọi xác nhận trước khi chuẩn bị.
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-cream/85">Giỏ hàng: {count} món</span>
            <Link href={ctaHref} className="inline-flex min-h-[52px] items-center gap-2 rounded-full bg-butter px-[26px] font-bold text-maroon no-underline hover:bg-cream hover:text-maroon">
              {count > 0 ? "Tiếp tục đặt bánh" : "Chọn bánh"} <ArrowRightIcon />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
