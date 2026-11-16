"use client";

import { useEffect, useState } from "react";
import { AlertIcon, CheckIcon } from "./admin-icons";

const EVENT = "yub:admin-toast";
type Tone = "success" | "error";
interface Toast {
  id: number;
  message: string;
  tone: Tone;
}

/** Hien thong bao ngan sau moi thao tac (goi tu bat ky component client nao) */
export function toast(message: string, tone: Tone = "success") {
  window.dispatchEvent(new CustomEvent<{ message: string; tone: Tone }>(EVENT, { detail: { message, tone } }));
}

export function AdminToaster() {
  const [items, setItems] = useState<Toast[]>([]);

  useEffect(() => {
    let seq = 0;
    const onToast = (e: Event) => {
      const { message, tone } = (e as CustomEvent<{ message: string; tone: Tone }>).detail;
      const id = ++seq;
      setItems((list) => [...list.slice(-2), { id, message, tone }]);
      window.setTimeout(() => setItems((list) => list.filter((t) => t.id !== id)), tone === "error" ? 6000 : 3200);
    };
    window.addEventListener(EVENT, onToast);
    return () => window.removeEventListener(EVENT, onToast);
  }, []);

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-3 bottom-[calc(16px+env(safe-area-inset-bottom))] z-[90] flex flex-col items-center gap-2 lg:inset-x-auto lg:bottom-6 lg:right-6 lg:items-end">
      {items.map((t) => (
        <div
          key={t.id}
          role={t.tone === "error" ? "alert" : "status"}
          className={`pointer-events-auto flex max-w-[420px] items-start gap-2.5 rounded-2xl px-4 py-3 text-[14px] font-semibold shadow-[0_16px_36px_-12px_rgba(36,18,13,0.45)] animate-[yub-toast-in_.35s_cubic-bezier(.16,1,.3,1)] ${t.tone === "error" ? "bg-accent text-cream" : "bg-dark text-cream"}`}
        >
          <span className={`mt-px flex h-5 w-5 flex-none items-center justify-center rounded-full ${t.tone === "error" ? "bg-cream/20" : "bg-[#5B8A3A]"}`}>
            {t.tone === "error" ? <AlertIcon size={12} /> : <CheckIcon size={12} />}
          </span>
          {t.message}
        </div>
      ))}
    </div>
  );
}
