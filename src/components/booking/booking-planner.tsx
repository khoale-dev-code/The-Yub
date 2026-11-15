"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { animationsReduced } from "@/components/motion/motion-config";
import { useLenis } from "@/components/motion/smooth-scroll";
import { CheckIcon } from "@/components/ui/icons";
import {
  PICKUP_DATE_COUNT,
  getPickupDateOptions,
  isSlotPast,
  nowMinutesVN,
  pickupSlotLabel,
  pickupSlots,
  type PickupDateOption,
} from "@/lib/pickup";
import { storeConfig } from "@/lib/store-config";
import { slotAvailabilityAction, type SlotAvailability } from "@/modules/slots/actions";
import { lineKey, useCart } from "@/modules/cart/cart-context";
import { unitPriceOf, variantLabelOf } from "@/modules/products/pricing";
import { categoryLabels, type Product, type ProductCategory } from "@/modules/products/types";
import { BookingProductCard } from "./booking-product-card";
import { BookingMobileBar, BookingSummary, type BookingBlocker, type BookingRow } from "./booking-summary";

gsap.registerPlugin(ScrollTrigger);

type Filter = "all" | ProductCategory;

const STEPS = [
  { id: "chon-banh", label: "Chọn bánh" },
  { id: "hen-gio", label: "Hẹn giờ" },
  { id: "xac-nhan", label: "Xác nhận" },
] as const;

/** Chua phan header + thanh buoc khi cuon toi tung khu */
const SECTION_OFFSET = { scrollMarginTop: "calc(var(--yub-header-h) + 84px)" } as const;

const CATEGORY_ORDER: ProductCategory[] = ["croissant", "tart", "cake", "cookie", "combo"];

export function BookingPlanner({ products, pausedMessage = null }: { products: Product[]; /** Tiem tam ngung nhan don online (Admin > Cai dat) */ pausedMessage?: string | null }) {
  const cart = useCart();
  const lenis = useLenis();
  const [filter, setFilter] = useState<Filter>("all");
  const [dates, setDates] = useState<PickupDateOption[]>([]);
  const [now, setNow] = useState<number | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [summaryInView, setSummaryInView] = useState(false);
  const [plannerInView, setPlannerInView] = useState(false);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const barFill = useRef<HTMLSpanElement | null>(null);
  const firstFilter = useRef(true);
  const cardTriggers = useRef<ScrollTrigger[]>([]);

  // Ngay & gio tinh o client (tranh lech gio server)
  useEffect(() => {
    setDates(getPickupDateOptions(PICKUP_DATE_COUNT));
    setNow(nowMinutesVN(storeConfig.timeZone));
    const t = window.setInterval(() => setNow(nowMinutesVN(storeConfig.timeZone)), 60_000);
    return () => window.clearInterval(t);
  }, []);

  const todayValue = dates[0]?.value;
  const todayClosed = now !== null && pickupSlots.every((s) => isSlotPast(s, now));
  const isTodaySelected = Boolean(todayValue) && cart.pickup.date === todayValue;
  const slotPast = (slotId: string) => {
    const slot = pickupSlots.find((s) => s.id === slotId);
    return Boolean(slot && isTodaySelected && now !== null && isSlotPast(slot, now));
  };

  // Khung gio da kin / tam nghi (Admin > Khung gio) cho ngay dang chon
  const [availability, setAvailability] = useState<SlotAvailability>({});
  useEffect(() => {
    const date = cart.pickup.date;
    if (!date) return;
    let alive = true;
    slotAvailabilityAction(date).then((a) => alive && setAvailability(a)).catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [cart.pickup.date]);
  const slotClosed = (slotId: string) => availability[slotId] === "full" || availability[slotId] === "off";

  // Ngay mac dinh: ngay mai (giong trang gio hang); hom nay da dong cua thi chuyen sang mai
  const { setPickup } = cart;
  useEffect(() => {
    if (!cart.ready || dates.length === 0) return;
    const valid = dates.some((d) => d.value === cart.pickup.date);
    if (!valid || (isTodaySelected && todayClosed)) {
      const fallback = dates[1] ?? dates[0];
      if (fallback) setPickup({ date: fallback.value });
    }
  }, [cart.ready, cart.pickup.date, dates, isTodaySelected, todayClosed, setPickup]);

  // Chon hom nay ma khung gio da qua -> tu nhay toi khung gio con lai gan nhat
  useEffect(() => {
    if (!isTodaySelected || now === null) return;
    const current = pickupSlots.find((s) => s.id === cart.pickup.slotId);
    if (current && !isSlotPast(current, now)) return;
    const next = pickupSlots.find((s) => !isSlotPast(s, now));
    if (next) setPickup({ slotId: next.id });
  }, [isTodaySelected, now, cart.pickup.slotId, setPickup]);

  const rows = useMemo<BookingRow[]>(
    () =>
      cart.lines
        .map((line) => {
          const product = products.find((p) => p.id === line.productId);
          if (!product) return null;
          const unit = unitPriceOf(product, line.variantId);
          if (unit === null) return null;
          return { key: lineKey(line), product, unit, variant: variantLabelOf(product, line.variantId), qty: line.qty, total: unit * line.qty };
        })
        .filter((r): r is BookingRow => r !== null),
    [cart.lines, products],
  );

  const itemCount = rows.reduce((n, r) => n + r.qty, 0);
  const subtotal = rows.reduce((n, r) => n + r.total, 0);
  const hasSoldOut = rows.some((r) => r.product.status === "out");
  const hasPreorder = rows.some((r) => r.product.status === "pre");
  const todayBlocked = hasPreorder && isTodaySelected;
  const selectedDate = dates.find((d) => d.value === cart.pickup.date);
  const pickupLabel = selectedDate ? `${selectedDate.top} ${selectedDate.day} · ${pickupSlotLabel(cart.pickup.slotId)}` : null;

  const blocker: BookingBlocker | null =
    rows.length === 0
      ? { message: "Chọn ít nhất 1 món để tiếp tục.", target: "chon-banh", action: "Chọn bánh" }
      : hasSoldOut
        ? { message: "Có món đã hết hôm nay – xoá khỏi đơn để tiếp tục.", target: "xac-nhan", action: "Xem đơn" }
        : !selectedDate
          ? { message: "Chọn ngày nhận bánh.", target: "hen-gio", action: "Hẹn giờ" }
          : todayBlocked
            ? { message: "Đơn có món cần đặt trước 1 ngày – vui lòng chọn ngày nhận từ ngày mai.", target: "hen-gio", action: "Đổi ngày nhận" }
            : slotPast(cart.pickup.slotId)
              ? { message: "Khung giờ này hôm nay đã qua – chọn khung giờ khác.", target: "hen-gio", action: "Đổi giờ" }
              : slotClosed(cart.pickup.slotId)
                ? { message: "Khung giờ này đã kín đơn – chọn khung giờ khác.", target: "hen-gio", action: "Đổi giờ" }
                : pausedMessage
                  ? { message: pausedMessage, target: "tel", action: `Gọi ${storeConfig.phone}` }
                  : null;

  const stepDone = [rows.length > 0 && !hasSoldOut, Boolean(selectedDate) && !todayBlocked && !slotPast(cart.pickup.slotId) && !slotClosed(cart.pickup.slotId), false];

  const counts = useMemo(() => {
    const c: Partial<Record<ProductCategory, number>> = {};
    for (const p of products) c[p.category] = (c[p.category] ?? 0) + 1;
    return c;
  }, [products]);
  const visible = useMemo(() => (filter === "all" ? products : products.filter((p) => p.category === filter)), [filter, products]);

  const scrollToId = useCallback(
    (id: string) => {
      if (id === "tel") {
        window.location.href = storeConfig.phoneHref;
        return;
      }
      const el = document.getElementById(id);
      if (!el) return;
      if (lenis) lenis.scrollTo(el, { duration: 1.2 });
      else el.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [lenis],
  );

  // Hieu ung khi cuon: the banh xuat hien lan luot, thanh tien trinh chay theo cuon, buoc dang xem
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ctx = gsap.context(() => {
      if (barFill.current) {
        gsap.fromTo(barFill.current, { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { trigger: root, start: "top 30%", end: "bottom 85%", scrub: 0.4 } });
      }
      STEPS.slice(0, 2).forEach((s, i) => {
        const el = document.getElementById(s.id);
        if (!el) return;
        ScrollTrigger.create({ trigger: el, start: "top 55%", end: "bottom 55%", onToggle: (self) => self.isActive && setActiveStep(i) });
      });
      if (!animationsReduced()) {
        root.querySelectorAll<HTMLElement>("[data-booking-reveal]").forEach((el) => {
          gsap.from(el.children, { y: 40, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.08, scrollTrigger: { trigger: el, start: "top 88%", once: true } });
        });
        if (gridRef.current) {
          // Chi an truoc nhung the nam duoi man hinh (the dang thay giu nguyen, tranh nhay)
          const below = Array.from(gridRef.current.querySelectorAll<HTMLElement>("[data-booking-card]")).filter((c) => c.getBoundingClientRect().top > window.innerHeight * 0.92);
          gsap.set(below, { y: 46, opacity: 0 });
          cardTriggers.current = ScrollTrigger.batch(below, {
            start: "top 94%",
            once: true,
            onEnter: (els) => gsap.to(els, { y: 0, opacity: 1, duration: 0.9, ease: "expo.out", stagger: 0.06, overwrite: true }),
          });
        }
      }
      // Planner trong man hinh -> hien thanh duoi (dien thoai)
      ScrollTrigger.create({ trigger: root, start: "top 70%", end: "bottom bottom", onToggle: (self) => setPlannerInView(self.isActive) });
    }, root);
    return () => ctx.revert();
  }, []);

  // Doi loai banh: the moi "troi" len, cap nhat lai vi tri cac ScrollTrigger
  useEffect(() => {
    if (firstFilter.current) {
      firstFilter.current = false;
      return;
    }
    const grid = gridRef.current;
    if (!grid) return;
    cardTriggers.current.forEach((t) => t.kill());
    cardTriggers.current = [];
    if (!animationsReduced()) {
      gsap.fromTo(grid.querySelectorAll("[data-booking-card]"), { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "power3.out", stagger: 0.035, overwrite: true });
    }
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [filter]);

  // Khung tom tat dang hien (hoac da cuon qua) -> an thanh duoi tren dien thoai
  useEffect(() => {
    const aside = document.getElementById("xac-nhan");
    if (!aside) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry) setSummaryInView(entry.isIntersecting || entry.boundingClientRect.top < 0);
    });
    io.observe(aside);
    return () => io.disconnect();
  }, []);

  const tabs: { id: Filter; label: string; count: number }[] = [
    { id: "all", label: "Tất cả", count: products.length },
    ...CATEGORY_ORDER.filter((c) => counts[c]).map((c) => ({ id: c, label: categoryLabels[c], count: counts[c] ?? 0 })),
  ];

  const onStep = (i: number) => {
    const step = STEPS[i];
    if (step) scrollToId(step.id);
  };
  // Du thong tin -> lam noi buoc "Xác nhận" de khach bam tiep
  const currentStep = blocker ? activeStep : 2;

  return (
    <div ref={rootRef} className="relative">
      {/* Thanh các bước – dính dưới header khi cuộn */}
      <div className="sticky top-[var(--yub-header-h)] z-20 mt-8 border-y border-maroon/12 bg-page/92 backdrop-blur-md md:mt-12">
        <ol aria-label="Các bước đặt bánh" className="mx-auto m-0 flex max-w-[1200px] list-none items-center gap-1 px-3 py-2.5 sm:gap-3 sm:px-6 sm:py-3">
          {STEPS.map((s, i) => {
            const done = stepDone[i];
            const current = currentStep === i;
            return (
              <li key={s.id} className={`flex min-w-0 items-center gap-1 sm:gap-3 ${i < STEPS.length - 1 ? "flex-1" : "flex-none"}`}>
                <button
                  type="button"
                  onClick={() => onStep(i)}
                  aria-current={current ? "step" : undefined}
                  className={`flex min-h-11 items-center gap-2 rounded-full border-0 px-2 py-1 text-left transition-colors sm:px-3 ${current ? "bg-maroon/8" : "bg-transparent hover:bg-maroon/5"}`}
                >
                  <span
                    className={`flex h-8 w-8 flex-none items-center justify-center rounded-full text-sm font-bold transition-[background-color,color,transform] duration-300 ${done ? "bg-maroon text-cream" : current ? "bg-butter text-maroon" : "border-[1.5px] border-maroon/30 text-maroon/70"} ${current ? "scale-105" : ""}`}
                  >
                    {done ? <CheckIcon size={16} /> : i + 1}
                  </span>
                  <span className={`whitespace-nowrap text-[14px] sm:text-[15px] ${current ? "font-bold text-maroon" : "font-semibold text-maroon/70 max-sm:sr-only"}`}>{s.label}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <span aria-hidden="true" className="relative h-[2px] min-w-3 flex-1 overflow-hidden rounded-full bg-maroon/12">
                    <span className={`absolute inset-0 origin-left bg-maroon transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${done ? "scale-x-100" : "scale-x-0"}`} />
                  </span>
                )}
              </li>
            );
          })}
        </ol>
        <span aria-hidden="true" className="absolute inset-x-0 bottom-[-1px] h-[2px] overflow-hidden">
          <span ref={barFill} className="block h-full origin-left bg-butter" />
        </span>
      </div>

      <div className="mx-auto grid w-full max-w-[1200px] items-start gap-12 px-4 pb-32 pt-10 sm:px-6 md:pt-14 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-14 lg:pb-28">
        <div className="flex min-w-0 flex-col gap-16 md:gap-20">
          {/* BƯỚC 1 */}
          <section id="chon-banh" data-no-reveal aria-labelledby="db-chon" style={SECTION_OFFSET} className="flex flex-col gap-6">
            <div data-booking-reveal className="flex flex-col gap-2">
              <h2 id="db-chon" className="m-0 font-display text-[34px] font-semibold leading-[1.08] tracking-[-0.015em] md:text-[44px]">
                Chọn bánh
              </h2>
              <p className="m-0 max-w-[560px] text-[16px] text-muted">Bấm biểu tượng giỏ để thêm, rồi tăng giảm số lượng ngay trên thẻ. Món có quy cách (1 cái / hộp) chọn trước khi thêm.</p>
            </div>

            <div role="tablist" aria-label="Loại bánh" data-lenis-prevent className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
              {tabs.map((t) => {
                const on = t.id === filter;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    onClick={() => setFilter(t.id)}
                    className={`inline-flex min-h-11 flex-none items-center gap-2 rounded-full border px-4 text-[15px] font-semibold transition-colors ${on ? "border-maroon bg-maroon text-cream" : "border-maroon/25 bg-card text-maroon hover:border-maroon"}`}
                  >
                    {t.label}
                    <span className={`rounded-full px-1.5 text-xs ${on ? "bg-cream/20 text-cream" : "bg-maroon/8 text-maroon/70"}`}>{t.count}</span>
                  </button>
                );
              })}
            </div>

            <div ref={gridRef} role="tabpanel" aria-label={filter === "all" ? "Tất cả bánh" : categoryLabels[filter]} className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
              {visible.map((p) => (
                <BookingProductCard key={p.id} product={p} />
              ))}
            </div>
            <p className="m-0 text-[13px] text-muted-2">Giá đang là giá mẫu để xem trước – tiệm xác nhận giá chính thức khi gọi lại.</p>
          </section>

          {/* BƯỚC 2 */}
          <section id="hen-gio" data-no-reveal aria-labelledby="db-gio" style={SECTION_OFFSET} className="flex flex-col gap-6">
            <div data-booking-reveal className="flex flex-col gap-2">
              <h2 id="db-gio" className="m-0 font-display text-[34px] font-semibold leading-[1.08] tracking-[-0.015em] md:text-[44px]">Hẹn giờ ghé lấy</h2>
              <p className="m-0 max-w-[560px] text-[16px] text-muted">Tiệm mở {storeConfig.openHours}. Chọn khung {storeConfig.freshBatchTime} nếu muốn lấy bánh vừa ra lò còn ấm.</p>
            </div>

            <div data-booking-reveal className="flex flex-col gap-3">
              <h3 className="m-0 text-[15px] font-semibold">Ngày nhận</h3>
              <div role="radiogroup" aria-label="Ngày nhận" className="grid grid-cols-4 gap-2 sm:grid-cols-7 sm:gap-2.5">
                {dates.map((d, i) => {
                  const on = d.value === cart.pickup.date;
                  const closed = i === 0 && todayClosed;
                  const preBlocked = i === 0 && hasPreorder;
                  return (
                    <button
                      key={d.value}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      disabled={closed}
                      onClick={() => setPickup({ date: d.value })}
                      className={`relative flex min-h-[78px] flex-col items-center justify-center rounded-[18px] border-[1.5px] leading-[1.3] transition-[background-color,border-color,color,transform] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45 ${on ? "border-maroon bg-maroon text-cream shadow-[0_12px_24px_-14px_rgba(59,15,18,0.8)]" : "border-maroon/20 bg-card text-maroon hover:border-maroon"}`}
                    >
                      <span className="text-xs font-semibold opacity-85 sm:text-[13px]">{d.top}</span>
                      <span className="font-display text-xl font-semibold">{d.day}</span>
                      {closed && <span className="text-[11px] font-semibold">Đã đóng cửa</span>}
                      {!closed && preBlocked && <span className={`text-[11px] font-semibold ${on ? "text-butter" : "text-accent"}`}>Chỉ món có sẵn</span>}
                    </button>
                  );
                })}
                {dates.length === 0 && Array.from({ length: PICKUP_DATE_COUNT }, (_, i) => <span key={i} className="min-h-[78px] rounded-[18px] bg-maroon/5" />)}
              </div>
            </div>

            <div data-booking-reveal className="flex flex-col gap-3">
              <h3 className="m-0 text-[15px] font-semibold">Khung giờ</h3>
              <div role="radiogroup" aria-label="Khung giờ" className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2.5">
                {pickupSlots.map((s) => {
                  const on = s.id === cart.pickup.slotId;
                  const past = slotPast(s.id);
                  const state = availability[s.id];
                  const closed = !past && (state === "full" || state === "off");
                  return (
                    <button
                      key={s.id}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      disabled={past || closed}
                      onClick={() => setPickup({ slotId: s.id })}
                      className={`relative flex min-h-[76px] flex-col items-start justify-center gap-0.5 rounded-[18px] border-[1.5px] px-4 text-left transition-[background-color,border-color,color,transform] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 ${on ? "border-maroon bg-maroon text-cream" : "border-maroon/20 bg-card text-maroon hover:border-maroon"}`}
                    >
                      <span className="font-display text-[19px] font-semibold leading-[1.15] tabular-nums">{s.label}</span>
                      <span className={`text-[13px] ${on ? "text-cream/80" : "text-muted"}`}>{past ? "Đã qua" : state === "full" ? "Đã kín" : state === "off" ? "Tạm nghỉ" : s.note}</span>
                      {s.hot && <span className="absolute right-2.5 top-2.5 rounded-full bg-butter px-2 py-px text-[11px] font-bold text-maroon">Bánh ấm</span>}
                    </button>
                  );
                })}
              </div>
              {todayBlocked && <p role="alert" className="m-0 text-sm font-semibold text-accent">Đơn có món cần đặt trước 1 ngày – vui lòng chọn ngày nhận từ ngày mai.</p>}
            </div>

            <ul data-booking-reveal className="m-0 grid list-none gap-3 p-0 sm:grid-cols-3">
              {[
                { t: "Tiệm gọi xác nhận", d: "Trong giờ mở cửa, trước khi chuẩn bị bánh." },
                { t: "Bánh kem, hộp quà", d: "Đặt trước ít nhất 1 ngày – ghi chú chữ trên bánh ở bước sau." },
                { t: "Cần đổi giờ?", d: `Gọi ${storeConfig.phone} trong giờ mở cửa.` },
              ].map((n) => (
                <li key={n.t} className="flex flex-col gap-1 rounded-[18px] bg-beige px-4 py-3.5">
                  <strong className="text-[15px]">{n.t}</strong>
                  <span className="text-[14px] leading-[1.5] text-muted">{n.d}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <BookingSummary rows={rows} itemCount={itemCount} subtotal={subtotal} pickupLabel={pickupLabel} blocker={blocker} onRemove={cart.remove} onFix={scrollToId} />
      </div>

      <BookingMobileBar itemCount={itemCount} subtotal={subtotal} blocker={blocker} hidden={!plannerInView || summaryInView} onFix={scrollToId} />
    </div>
  );
}
