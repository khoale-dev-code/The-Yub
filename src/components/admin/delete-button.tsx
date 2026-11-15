"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteDrinkAction, deleteInquiryAction, deleteOrderAction, deleteProductAction, type ActionResult } from "@/modules/admin/actions";
import { TrashIcon } from "./admin-icons";
import { toast } from "./toast";
import { btn } from "./ui";

type Kind = "order" | "product" | "drink" | "inquiry";

const run: Record<Kind, (id: string) => Promise<ActionResult>> = {
  order: (id) => deleteOrderAction({ code: id }),
  product: (id) => deleteProductAction({ id }),
  drink: (id) => deleteDrinkAction({ id }),
  inquiry: (id) => deleteInquiryAction({ id }),
};

/**
 * Nut xoa 2 buoc: bam "Xoa" -> hien "Xoa han <ten>?" voi nut xac nhan.
 * Khong dung hop thoai cua trinh duyet (khong chan giao dien, dung tren dien thoai).
 */
export function DeleteButton({ kind, id, name, redirectTo, compact = false, note }: { kind: Kind; id: string; name: string; redirectTo?: string; compact?: boolean; note?: string }) {
  const router = useRouter();
  const [asking, setAsking] = useState(false);
  const [pending, start] = useTransition();

  const confirm = () =>
    start(async () => {
      const res = await run[kind](id);
      if (!res.ok) {
        toast(res.error, "error");
        return;
      }
      toast(`Đã xoá ${name}`);
      setAsking(false);
      if (redirectTo) router.push(redirectTo);
    });

  if (!asking) {
    return (
      <button type="button" onClick={() => setAsking(true)} className={compact ? `${btn.ghost} text-accent` : `${btn.danger} w-full`}>
        <TrashIcon size={16} /> Xoá
      </button>
    );
  }
  return (
    <div role="alertdialog" aria-label={`Xoá ${name}`} className="flex w-full flex-col gap-2 rounded-[16px] border border-accent/25 bg-rose/60 p-3">
      <strong className="text-[14px] text-accent">Xoá hẳn “{name}”?</strong>
      {note && <span className="text-[13px] text-muted">{note}</span>}
      <div className="flex gap-2">
        <button type="button" disabled={pending} onClick={confirm} className={`${btn.primary} min-h-10 flex-1 bg-accent px-4 text-[14px]`} autoFocus>
          {pending ? "Đang xoá…" : "Xoá"}
        </button>
        <button type="button" onClick={() => setAsking(false)} className={`${btn.secondary} min-h-10 px-4 text-[14px]`}>Thôi</button>
      </div>
    </div>
  );
}
