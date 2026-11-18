"use client";

import { useActionState } from "react";
import { startAdminGoogle } from "@/modules/admin/google-action";
import { GoogleG } from "../ui/google-icon";

export function GoogleLogin() {
  const [state, action, pending] = useActionState(startAdminGoogle, { error: null });
  return <form action={action}>
    <button type="submit" disabled={pending}
      className="flex min-h-[52px] w-full items-center justify-center gap-3 rounded-xl border border-[#c5b7ac] bg-white px-4 text-[15px] font-semibold text-maroon hover:border-maroon hover:bg-[#fcf9f6] focus-visible:outline-butter disabled:opacity-60">
      <GoogleG />{pending ? "Đang mở Google…" : "Tiếp tục với Google"}
    </button>
    {state.error && <p role="alert" className="mb-0 mt-2 rounded-lg bg-[#482727] p-3 text-sm text-[#ffd2c9]">{state.error}</p>}
  </form>;
}
