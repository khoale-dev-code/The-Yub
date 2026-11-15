"use client";

import { useTransition } from "react";
import { setInquiryStatusAction } from "@/modules/admin/actions";
import type { InquiryStatus } from "@/modules/inquiries/repository";
import { DeleteButton } from "./delete-button";
import { toast } from "./toast";
import { btn } from "./ui";

export function InquiryActions({ id, status, name }: { id: string; status: InquiryStatus; name: string }) {
  const [pending, start] = useTransition();
  const set = (to: InquiryStatus, msg: string) =>
    start(async () => {
      const res = await setInquiryStatusAction({ id, status: to });
      if (res.ok) toast(msg);
      else toast(res.error, "error");
    });
  return (
    <span className="flex gap-1">
      {status === "new" && <button type="button" disabled={pending} onClick={() => set("answered", "Đã đánh dấu đã trả lời")} className={btn.ghost}>Đã trả lời</button>}
      {status !== "archived" && <button type="button" disabled={pending} onClick={() => set("archived", "Đã lưu trữ")} className={`${btn.ghost} text-muted`}>Lưu trữ</button>}
      {status !== "new" && <button type="button" disabled={pending} onClick={() => set("new", "Đã chuyển về Mới")} className={`${btn.ghost} text-muted`}>Chuyển về Mới</button>}
      {status === "archived" && <DeleteButton kind="inquiry" id={id} name={`câu hỏi của ${name}`} compact />}
    </span>
  );
}
