"use client";

import { useState, useTransition } from "react";
import { setOrderPaidAction, updateOrderStatusAction } from "@/modules/admin/actions";
import { needsReason, nextStatuses, quickReasons, statusActionLabels } from "@/modules/admin/order-flow";
import type { OrderStatus } from "@/modules/orders/types";
import { formatVnd } from "@/lib/format";
import { CheckIcon, CopyIcon, XIcon } from "./admin-icons";
import { toast } from "./toast";
import { btn, input } from "./ui";

/** Nut doi trang thai don (Xac nhan / Bat dau lam / San sang / Da giao / Tu choi / Huy) */
export function OrderActions({
  code,
  status,
  compact = false,
  unpaidTransfer = false,
  only,
}: {
  code: string;
  status: OrderStatus;
  compact?: boolean;
  /** Don chuyen khoan chua ghi nhan tien -> hoi lai truoc khi bao "da giao" */
  unpaidTransfer?: boolean;
  /** "next" = chi hien 1 nut buoc tiep theo (dung trong danh sach don) */
  only?: "next";
}) {
  const [pending, start] = useTransition();
  const [askPaid, setAskPaid] = useState(false);
  const [reasonFor, setReasonFor] = useState<"rejected" | "cancelled" | null>(null);
  const [note, setNote] = useState("");
  const options = nextStatuses[status];
  const forward = options.filter((s) => !needsReason(s));
  const destructive = options.find((s) => needsReason(s)) as "rejected" | "cancelled" | undefined;

  if (options.length === 0) {
    return compact ? null : <p className="m-0 text-[14px] text-muted">Đơn đã kết thúc – không còn thao tác.</p>;
  }

  const run = (to: OrderStatus, reason?: string) =>
    start(async () => {
      const res = await updateOrderStatusAction({ code, to, note: reason });
      if (res.ok) {
        toast(`${code}: ${statusActionLabels[to] ?? "Đã cập nhật"}`);
        setReasonFor(null);
        setNote("");
      } else toast(res.error, "error");
    });

  if (askPaid) {
    return (
      <div role="alertdialog" aria-label="Đơn chưa ghi nhận tiền" className="flex w-full flex-col gap-2 rounded-[16px] border border-butter bg-butter/15 p-3">
        <strong className="text-[14px]">Đơn chuyển khoản chưa ghi nhận tiền.</strong>
        <span className="text-[13px] text-muted">Vẫn báo khách đã nhận bánh? Nhớ kiểm tra tài khoản và bấm “Đánh dấu đã nhận tiền”.</span>
        <div className="flex gap-2">
          <button type="button" disabled={pending} onClick={() => { setAskPaid(false); run("completed"); }} className={`${btn.primary} min-h-10 flex-1 px-4 text-[14px]`}>Vẫn đánh dấu đã giao</button>
          <button type="button" onClick={() => setAskPaid(false)} className={`${btn.secondary} min-h-10 px-4 text-[14px]`}>Thôi</button>
        </div>
      </div>
    );
  }

  const go = (to: OrderStatus) => (to === "completed" && unpaidTransfer ? setAskPaid(true) : run(to));

  if (only === "next") {
    const to = forward[0];
    if (!to) return null;
    return (
      <button type="button" disabled={pending} onClick={() => go(to)} className="relative z-10 inline-flex min-h-9 items-center gap-1.5 whitespace-nowrap rounded-full border-0 bg-maroon px-3.5 text-[13px] font-semibold text-cream hover:bg-accent disabled:opacity-50">
        <CheckIcon size={14} /> {pending ? "Đang lưu…" : statusActionLabels[to]}
      </button>
    );
  }

  if (reasonFor) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (note.trim().length < 3) return toast("Ghi lý do để báo khách (ít nhất 3 ký tự).", "error");
          run(reasonFor, note.trim());
        }}
        className="flex w-full flex-col gap-2.5 rounded-[18px] border border-accent/20 bg-rose/50 p-3.5"
      >
        <strong className="text-[14px] text-accent">{statusActionLabels[reasonFor]} – lý do (khách sẽ thấy)</strong>
        <div className="flex flex-wrap gap-1.5">
          {quickReasons[reasonFor].map((r) => (
            <button key={r} type="button" onClick={() => setNote(r)} className={`min-h-8 rounded-full border px-3 text-[13px] font-semibold ${note === r ? "border-accent bg-accent text-cream" : "border-accent/25 bg-card text-accent"}`}>
              {r}
            </button>
          ))}
        </div>
        <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="Hoặc tự ghi lý do…" className={input} aria-label="Lý do" autoFocus />
        <div className="flex gap-2">
          <button type="submit" disabled={pending} className={`${btn.primary} flex-1 bg-accent`}>{pending ? "Đang lưu…" : statusActionLabels[reasonFor]}</button>
          <button type="button" onClick={() => setReasonFor(null)} className={btn.secondary}>Thôi</button>
        </div>
      </form>
    );
  }

  return (
    <div className={`flex ${compact ? "flex-row flex-wrap gap-2" : "flex-col gap-2.5"}`}>
      {forward.map((to, i) => (
        <button
          key={to}
          type="button"
          disabled={pending}
          onClick={() => go(to)}
          className={`${i === 0 ? btn.primary : btn.secondary} ${compact ? "min-h-10 px-4 text-[14px]" : "min-h-[50px] w-full text-base"}`}
        >
          {i === 0 && <CheckIcon size={17} />}
          {pending ? "Đang lưu…" : statusActionLabels[to]}
        </button>
      ))}
      {destructive && (
        <button type="button" disabled={pending} onClick={() => setReasonFor(destructive)} className={`${btn.danger} ${compact ? "min-h-10 px-4 text-[14px]" : "w-full"}`}>
          <XIcon size={16} /> {statusActionLabels[destructive]}
        </button>
      )}
    </div>
  );
}

interface PaymentProps {
  code: string;
  paid: boolean;
  closed: boolean;
  total: number;
  canUndo: boolean;
  transferText: string | null;
}

/** Danh dau da nhan tien – xac minh thu cong, co buoc xac nhan lai */
export function PaymentActions({ code, paid, closed, total, canUndo, transferText }: PaymentProps) {
  const [pending, start] = useTransition();
  const [confirming, setConfirming] = useState(false);

  const run = (value: boolean) =>
    start(async () => {
      const res = await setOrderPaidAction({ code, paid: value });
      if (res.ok) {
        toast(value ? `${code}: đã ghi nhận ${formatVnd(total)}` : `${code}: đã bỏ đánh dấu thanh toán`);
        setConfirming(false);
      } else toast(res.error, "error");
    });

  return (
    <div className="flex flex-col gap-2.5">
      {transferText && !paid && (
        <div className="flex items-start justify-between gap-3 rounded-2xl bg-beige px-3.5 py-3 text-[14px]">
          <span className="whitespace-pre-line">{transferText}</span>
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(transferText).then(() => toast("Đã chép thông tin chuyển khoản"), () => toast("Không chép được", "error"))}
            className="flex h-9 w-9 flex-none items-center justify-center rounded-full border-0 bg-card text-maroon hover:bg-white"
            aria-label="Chép thông tin chuyển khoản"
            title="Chép để gửi khách"
          >
            <CopyIcon />
          </button>
        </div>
      )}
      {!paid && !closed && !confirming && (
        <button type="button" onClick={() => setConfirming(true)} className={`${btn.butter} w-full`}>
          Đánh dấu đã nhận tiền
        </button>
      )}
      {confirming && (
        <div className="flex flex-col gap-2 rounded-[18px] border border-butter bg-butter/15 p-3.5">
          <strong className="text-[14px]">Xác nhận đã nhận đủ {formatVnd(total)}?</strong>
          <span className="text-[13px] text-muted">Chỉ bấm khi đã kiểm tra tiền vào tài khoản / đã thu tiền mặt.</span>
          <div className="flex gap-2">
            <button type="button" disabled={pending} onClick={() => run(true)} className={`${btn.primary} flex-1`}>{pending ? "Đang lưu…" : "Đã nhận đủ"}</button>
            <button type="button" onClick={() => setConfirming(false)} className={btn.secondary}>Thôi</button>
          </div>
        </div>
      )}
      {paid && canUndo && (
        <button type="button" disabled={pending} onClick={() => run(false)} className={`${btn.ghost} self-start text-muted`}>
          Bỏ đánh dấu (ghi nhầm)
        </button>
      )}
    </div>
  );
}
