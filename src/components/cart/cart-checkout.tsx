// TheYub-Order-Anytime-V1
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition, type FormEvent } from "react";
import { formatVnd } from "@/lib/format";
import { PICKUP_DATE_COUNT, formatPickupDate, getPickupDateOptions, pickupSlotLabel, pickupSlots, type PickupDateOption } from "@/lib/pickup";
import { useStoreInfo } from "@/components/brand/store-info-context";
import { lineKey, useCart } from "@/modules/cart/cart-context";
import { useCustomer } from "@/modules/customers/customer-context";
import { createOrderAction } from "@/modules/orders/actions";
import { customerSchema } from "@/modules/orders/schema";
import { paymentHints, paymentLabels, type OrderReceipt, type PaymentMethod } from "@/modules/orders/types";
import { unitPriceOf, variantLabelOf } from "@/modules/products/pricing";
import type { Product } from "@/modules/products/types";
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon } from "../ui/icons";
import { isFreshSlot } from "@/lib/pickup";

const STEPS = ["Giỏ hàng", "Thông tin nhận", "Xác nhận"] as const;
export type CheckoutStep = 1 | 2 | 3;
type Step = CheckoutStep;

const statusNote: Record<Product["status"], string> = {
  ready: "Có sẵn hôm nay",
  oven: "Ra lò chiều nay",
  pre: "Tiệm xác nhận",
  out: "Hết hôm nay – vui lòng xoá khỏi giỏ",
};

const inputCls = "min-h-[52px] rounded-[14px] border border-maroon/30 bg-card px-4 text-base font-normal text-maroon";

interface CartCheckoutProps {
  products: Product[];
  /** 2 = vao thang buoc "Thông tin nhận" (link ?buoc=thong-tin) */
  initialStep?: 1 | 2;
}

export function CartCheckout({ products, initialStep = 1 }: CartCheckoutProps) {
  const store = useStoreInfo();
  const cart = useCart();
  const customer = useCustomer();
  const [step, setStep] = useState<Step>(initialStep);
  const [dates, setDates] = useState<PickupDateOption[]>([]);
  const [payment, setPayment] = useState<PaymentMethod>("cod");
  const [errors, setErrors] = useState<{ name?: string; phone?: string; form?: string }>({});
  const [receipt, setReceipt] = useState<OrderReceipt | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement | null>(null);
  const idemKey = useRef<string | null>(null);
  const topRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setDates(getPickupDateOptions(PICKUP_DATE_COUNT)), []);

  // Khach da dang nhap: dien san ten + SDT (chi khi o dang trong, khong ghi de cai khach vua go)
  useEffect(() => {
    const form = formRef.current;
    if (!form || !customer.loggedIn) return;
    const fill = (name: string, value: string | null) => {
      const el = form.elements.namedItem(name);
      if (el instanceof HTMLInputElement && !el.value && value) el.value = value;
    };
    fill("name", customer.name);
    fill("phone", customer.phone);
  }, [customer.loggedIn, customer.name, customer.phone, step]);
  useEffect(() => {
    if (dates.length && !dates.some((d) => d.value === cart.pickup.date)) {
      const fallback = dates[0];
      if (fallback) cart.setPickup({ date: fallback.value });
    }
  }, [dates, cart]);

  const rows = useMemo(
    () =>
      cart.lines
        .map((line) => {
          const product = products.find((p) => p.id === line.productId);
          if (!product) return null;
          const unit = unitPriceOf(product, line.variantId);
          if (unit === null) return null;
          const variant = variantLabelOf(product, line.variantId);
          return { key: lineKey(line), line, product, unit, variant, total: unit * line.qty };
        })
        .filter((r): r is NonNullable<typeof r> => r !== null),
    [cart.lines, products],
  );

  const itemCount = rows.reduce((n, r) => n + r.line.qty, 0);
  const subtotal = rows.reduce((n, r) => n + r.total, 0);
  const empty = rows.length === 0;
  const hasSoldOut = rows.some((r) => r.product.status === "out");

  const selectedDate = dates.find((d) => d.value === cart.pickup.date);
  const pickupLabel = selectedDate ? `${selectedDate.top} ${selectedDate.day} · ${pickupSlotLabel(cart.pickup.slotId)}` : pickupSlotLabel(cart.pickup.slotId);

  // Vao thang buoc 2 nhung gio trong / con mon can sua -> quay ve buoc 1 de khach sua
  useEffect(() => {
    if (!cart.ready || step !== 2 || receipt) return;
    if (empty || hasSoldOut) setStep(1);
  }, [cart.ready, step, receipt, empty, hasSoldOut]);

  const goStep = (s: Step) => {
    setStep(s);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const validateField = (field: "name" | "phone", value: string) => {
    const shape = customerSchema.shape[field];
    const res = shape.safeParse(value);
    setErrors((e) => ({ ...e, [field]: res.success ? undefined : res.error.issues[0]?.message }));
    return res.success;
  };

  const submitOrder = (e?: FormEvent) => {
    e?.preventDefault();
    const form = formRef.current;
    if (!form) return;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "");
    const phone = String(data.get("phone") ?? "");
    const note = String(data.get("note") ?? "");
    const okName = validateField("name", name);
    const okPhone = validateField("phone", phone);
    if (!okName || !okPhone) return;
    idemKey.current ??= crypto.randomUUID();
    setErrors({});
    startTransition(async () => {
      const res = await createOrderAction({
        customer: { name, phone },
        pickupDate: cart.pickup.date,
        slotId: cart.pickup.slotId,
        payment,
        note: note || undefined,
        idempotencyKey: idemKey.current,
        items: cart.lines.map((l) => ({ productId: l.productId, variantId: l.variantId, qty: l.qty })),
      });
      if (res.ok) {
        setReceipt(res.receipt);
        cart.clear();
        idemKey.current = null;
        goStep(3);
      } else {
        setErrors({ form: res.error });
      }
    });
  };

  const onPrimary = () => {
    if (empty || hasSoldOut) return;
    if (step === 1) goStep(2);
    else submitOrder();
  };

  const ctaDisabled = empty || hasSoldOut || pending;

  return (
    <div ref={topRef} className="scroll-mt-0">
      {/* Các bước */}
      <div className="border-y border-maroon/15">
        <ol aria-label="Các bước đặt bánh" className="mx-auto m-0 flex max-w-[760px] list-none items-center justify-between gap-2 px-4 py-[18px] sm:gap-3 sm:px-6">
          {STEPS.map((label, i) => {
            const n = (i + 1) as Step;
            const done = n < step;
            const cur = n === step;
            return (
              <li key={label} aria-current={cur ? "step" : undefined} className={`flex items-center gap-2.5 ${n < 3 ? "flex-1" : "flex-none"}`}>
                <span className={`flex h-8 w-8 flex-none items-center justify-center rounded-full border-[1.5px] border-maroon text-sm font-bold ${done || cur ? "bg-maroon text-cream" : "bg-transparent text-maroon"}`}>
                  {done ? <CheckIcon size={16} /> : n}
                </span>
                <span className={`whitespace-nowrap text-[13px] sm:text-[15px] ${cur ? "font-bold text-maroon" : done ? "font-medium text-maroon" : "font-medium text-muted-2"} ${cur ? "" : "hidden sm:inline"}`}>{label}</span>
                {n < 3 && <span aria-hidden="true" className={`ml-1.5 h-[1.5px] min-w-6 flex-1 ${done ? "bg-maroon" : "bg-maroon/25"}`} />}
              </li>
            );
          })}
        </ol>
      </div>

      {step === 3 && receipt ? (
        <Confirmation receipt={receipt} onRestart={() => { setReceipt(null); goStep(1); }} />
      ) : (
        <div className="mx-auto grid w-full max-w-[1200px] items-start gap-10 px-4 pb-24 pt-8 sm:px-6 md:pt-12 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-14">
          <div className="flex flex-col gap-12">
            {step === 1 && (
              <>
                <section aria-labelledby="gh-items" className="flex flex-col gap-2">
                  <div className="mb-2 flex items-baseline justify-between gap-4">
                    <h1 id="gh-items" className="m-0 font-display text-[36px] font-semibold leading-[1.08] tracking-[-0.015em] md:text-5xl">Giỏ hàng của bạn</h1>
                    <span className="text-muted">{itemCount} món</span>
                  </div>
                  {empty ? (
                    <div className="flex flex-col items-start gap-3 rounded-3xl border border-dashed border-maroon/30 bg-card px-6 py-12 sm:px-8">
                      <h2 className="m-0 font-display text-[26px] font-semibold">Giỏ hàng đang trống</h2>
                      <p className="m-0 text-muted">Bánh chiều nay ra lò lúc {store.freshBatchTime} – chọn vài món để giữ phần nhé.</p>
                      <Link href="/thuc-don" className="inline-flex min-h-[50px] items-center rounded-full bg-maroon px-6 font-semibold text-cream no-underline hover:bg-accent hover:text-cream">Xem thực đơn</Link>
                    </div>
                  ) : (
                    <ul className="m-0 flex list-none flex-col p-0">
                      {rows.map((r) => (
                        <li key={r.key} className="grid grid-cols-[80px_minmax(0,1fr)] items-center gap-x-4 gap-y-3 border-b border-maroon/15 py-5 sm:grid-cols-[112px_minmax(0,1fr)_auto_auto] sm:gap-6">
                          <Link href={`/san-pham/${r.product.slug}`} aria-label={`Xem ${r.product.name}`} className="relative row-span-2 block h-20 w-20 overflow-hidden rounded-[18px] bg-beige sm:row-span-1 sm:h-28 sm:w-28">
                            <Image src={r.product.cover} alt="" fill sizes="112px" className="object-cover" style={{ objectPosition: r.product.imagePosition ?? "center" }} />
                          </Link>
                          <div className="flex min-w-0 flex-col gap-1">
                            <Link href={`/san-pham/${r.product.slug}`} className="no-underline">
                              <h3 className="m-0 font-display text-lg font-semibold sm:text-xl">{r.product.name}</h3>
                            </Link>
                            <span className={`text-sm ${r.product.status === "out" ? "font-semibold text-accent" : "text-muted"}`}>{[r.variant, (r.product.status === "oven" ? `Ra lò ${store.freshBatchTime}` : statusNote[r.product.status])].filter(Boolean).join(" · ")}</span>
                            <span className="text-[15px] font-semibold">{formatVnd(r.unit)}</span>
                          </div>
                          <div role="group" aria-label={`Số lượng ${r.product.name}`} className="inline-flex items-center self-center justify-self-start rounded-full border border-maroon/25 bg-card">
                            <button type="button" onClick={() => (r.line.qty <= 1 ? cart.remove(r.key) : cart.setQty(r.key, r.line.qty - 1))} aria-label={`Giảm ${r.product.name}`} className="h-11 w-11 border-0 bg-transparent text-xl text-maroon">−</button>
                            <span className="min-w-7 text-center font-bold">{r.line.qty}</span>
                            <button type="button" onClick={() => cart.setQty(r.key, r.line.qty + 1)} disabled={r.line.qty >= 20} aria-label={`Tăng ${r.product.name}`} className="h-11 w-11 border-0 bg-transparent text-xl text-maroon disabled:opacity-40">+</button>
                          </div>
                          <div className="col-start-2 flex items-center justify-between gap-0.5 sm:col-start-auto sm:min-w-[104px] sm:flex-col sm:items-end">
                            <strong className="font-display text-[19px] font-semibold">{formatVnd(r.total)}</strong>
                            <button type="button" onClick={() => cart.remove(r.key)} className="min-h-9 border-0 bg-transparent p-0 text-sm text-accent underline">Xoá</button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section aria-labelledby="gh-time" className="flex flex-col gap-[18px]">
                  <h2 id="gh-time" className="m-0 font-display text-[28px] font-semibold leading-[1.15] md:text-[32px]">Hẹn giờ ghé lấy</h2>
                  <div role="radiogroup" aria-label="Ngày nhận" className="grid grid-cols-4 gap-2 sm:grid-cols-7 sm:gap-2.5">
                    {(dates.length ? dates : []).map((d) => {
                      const on = d.value === cart.pickup.date;
                      return (
                        <button key={d.value} type="button" role="radio" aria-checked={on} onClick={() => cart.setPickup({ date: d.value })} className={`flex min-h-[72px] flex-col items-center justify-center rounded-2xl border-[1.5px] leading-[1.3] ${on ? "border-maroon bg-maroon text-cream" : "border-maroon/30 bg-card text-maroon hover:border-maroon"}`}>
                          <span className="text-xs font-semibold opacity-85 sm:text-[13px]">{d.top}</span>
                          <span className="font-display text-lg font-semibold sm:text-xl">{d.day}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div role="radiogroup" aria-label="Khung giờ" className="flex flex-wrap gap-2 sm:gap-2.5">
                    {pickupSlots.map((s) => {
                      const on = s.id === cart.pickup.slotId;
                      return (
                        <button key={s.id} type="button" role="radio" aria-checked={on} onClick={() => cart.setPickup({ slotId: s.id })} className={`inline-flex min-h-[46px] items-center gap-2 rounded-full border px-4 text-sm font-semibold sm:px-[18px] sm:text-[15px] ${on ? "border-maroon bg-maroon text-cream" : "border-maroon/30 bg-transparent text-maroon hover:border-maroon"}`}>
                          {s.label}
                          {isFreshSlot(s, store.freshBatchTime) && <span className="rounded-full bg-butter px-[7px] py-px text-[11px] text-maroon">Bánh ấm</span>}
                        </button>
                      );
                    })}
                  </div>
                </section>
              </>
            )}

            {step === 2 && (
              <form ref={formRef} onSubmit={submitOrder} noValidate className="flex flex-col gap-12">
                <section aria-labelledby="gh-info" className="flex flex-col gap-[22px]">
                  <button type="button" onClick={() => goStep(1)} className="inline-flex min-h-10 items-center gap-1.5 self-start border-0 bg-transparent p-0 text-[15px] font-semibold text-maroon">
                    <ArrowLeftIcon /> Sửa giỏ hàng
                  </button>
                  <h1 id="gh-info" className="m-0 font-display text-[36px] font-semibold leading-[1.08] tracking-[-0.015em] md:text-5xl">Thông tin nhận bánh</h1>
                  <div className="grid gap-[18px] sm:grid-cols-2">
                    <label className="flex flex-col gap-1.5 text-[15px] font-semibold">
                      Họ và tên
                      <input name="name" type="text" autoComplete="name" required aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "err-name" : undefined} onBlur={(e) => validateField("name", e.target.value)} onInput={() => errors.name && setErrors((x) => ({ ...x, name: undefined }))} className={inputCls} />
                      {errors.name && <span id="err-name" className="text-sm font-medium text-accent">{errors.name}</span>}
                    </label>
                    <label className="flex flex-col gap-1.5 text-[15px] font-semibold">
                      Số điện thoại
                      <input name="phone" type="tel" inputMode="tel" autoComplete="tel" required placeholder="VD: 0901 234 567" aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? "err-phone" : undefined} onBlur={(e) => validateField("phone", e.target.value)} onInput={() => errors.phone && setErrors((x) => ({ ...x, phone: undefined }))} className={inputCls} />
                      {errors.phone && <span id="err-phone" className="text-sm font-medium text-accent">{errors.phone}</span>}
                    </label>
                    <label className="flex flex-col gap-1.5 text-[15px] font-semibold sm:col-span-2">
                      Ghi chú cho tiệm <span className="text-[13px] font-normal text-muted">Không bắt buộc – ví dụ: chữ viết trên bánh kem, ít ngọt…</span>
                      <textarea name="note" rows={3} maxLength={500} className="resize-y rounded-[14px] border border-maroon/30 bg-card px-4 py-3 text-base font-normal text-maroon" />
                    </label>
                  </div>
                </section>
                <section aria-labelledby="gh-pay" className="flex flex-col gap-3.5">
                  <h2 id="gh-pay" className="m-0 font-display text-[28px] font-semibold leading-[1.15] md:text-[32px]">Thanh toán</h2>
                  <div role="radiogroup" aria-labelledby="gh-pay" className="grid gap-3 sm:grid-cols-2">
                    {(["cod", "transfer"] as const).map((p) => {
                      const on = p === payment;
                      return (
                        <button key={p} type="button" role="radio" aria-checked={on} onClick={() => setPayment(p)} className={`flex min-h-[88px] items-start gap-3 rounded-[18px] border-[1.5px] px-[18px] py-4 text-left text-maroon ${on ? "border-maroon bg-cream" : "border-maroon/20 bg-card hover:border-maroon/50"}`}>
                          <span aria-hidden="true" className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full border-2 border-maroon">
                            <span className={`h-2.5 w-2.5 rounded-full ${on ? "bg-maroon" : "bg-transparent"}`} />
                          </span>
                          <span className="flex flex-col gap-0.5 leading-[1.4]">
                            <span className="text-base font-semibold">{paymentLabels[p]}</span>
                            <span className="text-sm text-muted">{paymentHints[p]}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
                {errors.form && <p role="alert" className="m-0 rounded-2xl bg-rose px-4 py-3 text-[15px] font-semibold text-ink">{errors.form}</p>}
                <button type="submit" className="sr-only" tabIndex={-1} aria-hidden="true">Gửi</button>
              </form>
            )}
          </div>

          {/* Tóm tắt đơn */}
          <aside aria-label="Tóm tắt đơn hàng" className="flex flex-col gap-[18px] rounded-[26px] bg-maroon p-6 text-cream shadow-[0_24px_48px_-24px_rgba(59,15,18,0.6)] sm:p-7 lg:sticky lg:top-[calc(var(--yub-header-h)+24px)]">
            <h2 className="m-0 font-display text-[26px] font-semibold">Đơn của bạn</h2>
            <div className="flex items-center gap-3 rounded-2xl bg-cream/8 p-3.5">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 10.5 12 4l9 6.5V20H3z" /><path d="M9.5 20v-6h5v6" /></svg>
              <span className="flex flex-col leading-[1.35]">
                <span className="text-[13px] text-cream/75">Nhận tại tiệm</span>
                <strong className="text-[15px]">{pickupLabel}</strong>
              </span>
            </div>
            <dl className="m-0 flex flex-col gap-2.5 text-[15px]">
              <div className="flex justify-between gap-3"><dt className="text-cream/80">Tạm tính ({itemCount} món)</dt><dd className="m-0">{formatVnd(subtotal)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-cream/80">Phí giao</dt><dd className="m-0">0đ · lấy tại tiệm</dd></div>
              <div className="my-1.5 h-px bg-cream/20" />
              <div className="flex items-baseline justify-between gap-3"><dt className="font-semibold">Tổng cộng</dt><dd className="m-0 font-display text-[30px] font-semibold text-white">{formatVnd(subtotal)}</dd></div>
            </dl>
            <button type="button" onClick={onPrimary} disabled={ctaDisabled} className="inline-flex min-h-[58px] items-center justify-center gap-2 rounded-full border-0 bg-butter text-base font-bold text-maroon hover:bg-cream disabled:cursor-not-allowed disabled:opacity-50">
              {pending ? "Đang gửi đơn…" : step === 1 ? "Tiếp tục" : "Gửi đơn đặt bánh"}
              {!pending && <ArrowRightIcon />}
            </button>
            {hasSoldOut && <p className="m-0 text-[13px] font-semibold text-butter">Có món đã hết hôm nay – xoá khỏi giỏ để tiếp tục.</p>}
            <p className="m-0 text-[13px] text-cream/75">Bạn có thể đặt bánh bất cứ lúc nào, kể cả nhận trong ngày. Tiệm gọi xác nhận thời gian chuẩn bị và nhận bánh trong giờ mở cửa. Tổng tiền được tiệm tính lại khi nhận đơn.</p>
          </aside>
        </div>
      )}
    </div>
  );
}

function Confirmation({ receipt, onRestart }: { receipt: OrderReceipt; onRestart: () => void }) {
  const customerLoggedIn = useCustomer().loggedIn;
  const lookup = `/don-hang/${encodeURIComponent(receipt.code)}?t=${receipt.accessToken}`;
  return (
    <div className="w-full px-4 pb-28 pt-14 sm:px-6 md:pt-[72px]">
      <div role="status" className="mx-auto flex max-w-[680px] flex-col items-center gap-[18px] text-center">
        <span aria-hidden="true" className="flex h-[88px] w-[88px] items-center justify-center rounded-full bg-[#E3EBD3] text-[#2F4A1E]">
          <CheckIcon size={42} />
        </span>
        <h1 className="m-0 text-balance font-display text-[38px] font-semibold leading-[1.08] tracking-[-0.015em] md:text-[52px]">Tiệm đã nhận đơn của bạn</h1>
        <p className="m-0 text-lg text-muted">
          Mã đơn <strong className="text-maroon">{receipt.code}</strong>. Tiệm sẽ gọi xác nhận, rồi giữ bánh cho bạn đến đúng giờ hẹn.
        </p>
      </div>
      <div className="mx-auto mt-10 flex max-w-[680px] flex-col gap-4 rounded-[26px] border border-maroon/12 bg-card px-6 py-7 sm:px-8">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col"><span className="text-[13px] text-muted">Giờ nhận</span><strong>{formatPickupDate(receipt.pickupDate)} · {pickupSlotLabel(receipt.pickupSlotId)}</strong></div>
          <div className="flex flex-col"><span className="text-[13px] text-muted">Thanh toán</span><strong>{paymentLabels[receipt.payment]}</strong></div>
        </div>
        <div className="h-px bg-maroon/15" />
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {receipt.items.map((it, i) => (
            <li key={i} className="flex justify-between gap-3"><span>{it.qty} × {it.name}</span><span>{formatVnd(it.lineTotalVnd)}</span></li>
          ))}
        </ul>
        <div className="h-px bg-maroon/15" />
        <div className="flex items-baseline justify-between"><strong>Tổng cộng</strong><strong className="font-display text-[28px] font-semibold">{formatVnd(receipt.totalVnd)}</strong></div>
        {receipt.payment === "transfer" && (
          <p className="m-0 rounded-2xl bg-cream px-4 py-3 text-sm text-ink">Tiệm sẽ gửi thông tin chuyển khoản khi gọi xác nhận. Đơn chỉ được tính là đã thanh toán sau khi tiệm đối soát.</p>
        )}
      </div>
      <div className="mx-auto mt-7 flex max-w-[680px] flex-wrap justify-center gap-3">
        <Link href="/" className="inline-flex min-h-[54px] items-center rounded-full bg-maroon px-7 font-semibold text-cream no-underline hover:bg-accent hover:text-cream">Về trang chủ</Link>
        {customerLoggedIn ? (
          <Link href="/tai-khoan" className="inline-flex min-h-[54px] items-center rounded-full border border-maroon px-7 font-semibold text-maroon no-underline hover:bg-maroon hover:text-cream">Xem đơn trong Tài khoản</Link>
        ) : (
          <Link href={lookup} className="inline-flex min-h-[54px] items-center rounded-full border border-maroon px-7 font-semibold text-maroon no-underline hover:bg-maroon hover:text-cream">Lưu link tra cứu đơn</Link>
        )}
        <button type="button" onClick={onRestart} className="min-h-[54px] rounded-full border border-maroon/40 bg-transparent px-7 text-base font-semibold text-maroon hover:border-maroon">Đặt thêm đơn khác</button>
      </div>
    </div>
  );
}
