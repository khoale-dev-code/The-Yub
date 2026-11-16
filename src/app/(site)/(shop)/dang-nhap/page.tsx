import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { LoginPanel } from "@/components/customer/login-panel";
import { brandImages, productImages } from "@/lib/images";
import { safeNext } from "@/modules/customers/consent";
import { getCustomer, getCustomerMode } from "@/modules/customers/session";
import { getStoreInfo } from "@/modules/settings/store-info-server";

export const metadata: Metadata = { title: "Đăng nhập", robots: { index: false } };
export const dynamic = "force-dynamic";

const errors: Record<string, string> = {
  huy: "Bạn đã huỷ đăng nhập với Google.",
  google: "Chưa đăng nhập được với Google – vui lòng thử lại.",
  phien: "Phiên đăng nhập đã hết hạn – vui lòng thử lại.",
  "dong-y": "Vui lòng xác nhận các mục đồng ý trước khi đăng nhập.",
  "chua-san-sang": "Tiệm đang hoàn thiện hệ thống tài khoản – vui lòng thử lại sau.",
  "chua-cau-hinh": "Đăng nhập chưa được cấu hình.",
  luu: "Không lưu được hồ sơ – vui lòng thử lại.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; loi?: string }> }) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  if (await getCustomer()) redirect(next);
  const store = await getStoreInfo();
  return (
    <section className="relative isolate overflow-hidden px-4 pb-20 pt-8 sm:px-6 md:pb-28 md:pt-14">
      {/* Nen: 2 anh banh mo nhe 2 ben (chi may tinh) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 hidden md:block">
        <div className="absolute -left-24 top-10 h-[420px] w-[320px] -rotate-6 overflow-hidden rounded-[40px] opacity-60">
          <Image src={productImages.croissantCoffee} alt="" fill sizes="320px" className="object-cover" />
        </div>
        <div className="absolute -right-20 bottom-6 h-[380px] w-[300px] rotate-6 overflow-hidden rounded-[40px] opacity-60">
          <Image src={productImages.berryTartBox} alt="" fill sizes="300px" className="object-cover" />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(closest-side,rgba(251,243,227,0.98),rgba(251,243,227,0.7)_70%,transparent)]" />
      </div>
      <div className="mx-auto flex max-w-[460px] flex-col items-center gap-6 rounded-[32px] border border-maroon/10 bg-card px-5 pb-7 pt-8 shadow-[0_40px_80px_-40px_rgba(59,15,18,0.45)] sm:px-8 sm:pb-9">
        <Image src={brandImages.logoMaroon} alt={store.name} width={brandImages.logoWidth} height={brandImages.logoHeight} className="h-14 w-auto" />
        <LoginPanel storeName={store.name} next={next} mode={getCustomerMode()} error={sp.loi ? (errors[sp.loi] ?? null) : null} />
      </div>
    </section>
  );
}
