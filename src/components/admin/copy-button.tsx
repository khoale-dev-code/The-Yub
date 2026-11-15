"use client";

import { CopyIcon } from "./admin-icons";
import { toast } from "./toast";

export function CopyButton({ text, label }: { text: string; label: string }) {
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard?.writeText(text).then(() => toast("Đã chép"), () => toast("Không chép được", "error"))}
      aria-label={label}
      title={label}
      className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-maroon/15 bg-card text-maroon hover:border-maroon/40"
    >
      <CopyIcon />
    </button>
  );
}
