import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ClockIcon, ShieldIcon } from "@/components/admin/admin-icons";
import { LoginForm } from "@/components/admin/login-form";
import { brandImages, productImages } from "@/lib/images";
import { missingSupabaseEnv } from "@/lib/supabase/server";
import { getStoreInfo } from "@/modules/settings/store-info-server";
import { getAdminMode, getAdminUser } from "@/modules/admin/session";

export const metadata: Metadata = { title: "Đăng nhập" };

const steps = [
  { t: "Tạo project Supabase", d: "Vào supabase.com, tạo project mới (nên chọn region Singapore)." },
  { t: "Chạy SQL", d: "SQL Editor → chạy lần lượt các file trong supabase/migrations (0001 → 0005) rồi supabase/seed.sql." },
  { t: "Điền .env.local", d: "NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY (Project Settings → API)." },
  { t: "Cấp quyền tài khoản", d: "Authentication → Users → Add user, rồi thêm vào bảng admin_users (xem docs/ADMIN.md)." },
];

/** Hieu ung vao trang: CSS thuan (khong tai GSAP o Admin), tat khi nguoi dung giam chuyen dong */
const rise = "motion-safe:animate-[yub-rise_0.8s_cubic-bezier(0.2,0.7,0.2,1)_both]";

export default async function AdminLoginPage() {
  const store = await getStoreInfo();
  const mode = getAdminMode();
  const missing = missingSupabaseEnv();
  if (await getAdminUser()) redirect("/admin");

  return (
    <div className="min-h-dvh bg-[#24120d] lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:p-3">
      {/* Ảnh thương hiệu */}
      <section className="relative h-[230px] overflow-hidden sm:h-[280px] lg:h-auto lg:min-h-[calc(100dvh-24px)] lg:rounded-[30px]">
        <Image
          src={productImages.strawberryCake}
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 55vw, 100vw"
          className="object-cover motion-safe:animate-[yub-slow-zoom_2.4s_cubic-bezier(0.2,0.7,0.2,1)_both]"
          style={{ objectPosition: "center 62%" }}
        />
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,rgba(36,18,13,0.55)_0%,rgba(36,18,13,0.05)_38%,rgba(36,18,13,0.85)_100%)]" />

        <div className="relative z-10 flex h-full flex-col justify-between p-5 sm:p-7 lg:p-10">
          <div className="flex items-center justify-between gap-3">
            <Image src={brandImages.logoCream} alt="The Yub – Bakes & More" width={brandImages.logoWidth} height={brandImages.logoHeight} className="h-10 w-auto sm:h-12 lg:h-14" />
            <span className="rounded-full bg-cream/15 px-3 py-1.5 text-[12px] font-semibold text-cream backdrop-blur-sm sm:text-[13px]">Khu vực quản lý</span>
          </div>

          <div className={`hidden max-w-[520px] flex-col gap-5 text-cream lg:flex ${rise} [animation-delay:200ms]`}>
            <p className="m-0 font-display text-[clamp(40px,4vw,58px)] font-semibold leading-[1.02] tracking-[-0.025em]">
              Mỗi mẻ bánh, mỗi đơn hàng – gọn trong một nơi.
            </p>
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0 text-[14px] font-semibold">
              <li className="inline-flex items-center gap-2 rounded-full bg-cream/15 px-3.5 py-2 backdrop-blur-sm">
                <ClockIcon size={16} /> Mở cửa {store.openHours}
              </li>
              <li className="inline-flex items-center gap-2 rounded-full bg-butter px-3.5 py-2 text-maroon">
                Mẻ bánh mới {store.freshBatchTime}
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Form */}
      <main className="relative z-10 -mt-7 flex min-h-[calc(100dvh-202px)] flex-col rounded-t-[28px] bg-[#F7F0E3] px-5 pb-6 pt-8 sm:-mt-8 sm:px-10 lg:mt-0 lg:min-h-0 lg:rounded-none lg:bg-transparent lg:px-12 lg:py-8">
        <div className="hidden justify-end lg:flex">
          <Link href="/" prefetch={false} className="inline-flex min-h-10 items-center rounded-full px-4 text-[14px] font-semibold text-cream/70 no-underline hover:bg-cream/10 hover:text-cream">
            ← Về trang web
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className={`w-full max-w-[440px] lg:rounded-[30px] lg:bg-[#F7F0E3] lg:p-10 lg:shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)] ${rise} [animation-delay:80ms]`}>
            <h1 className="m-0 font-display text-[32px] font-semibold leading-[1.08] tracking-[-0.02em] text-maroon sm:text-[36px]">
              {mode === "off" ? "Kết nối Admin" : "Chào mừng trở lại"}
            </h1>
            <p className="mb-7 mt-2 text-[15px] leading-[1.5] text-muted">
              {mode === "off"
                ? "Admin cần Supabase để lưu đơn hàng, thực đơn và tài khoản quản lý."
                : "Đăng nhập để xem đơn hàng, cập nhật món và khung giờ của tiệm."}
            </p>

            {mode === "off" ? (
              <div className="flex flex-col gap-4">
                {missing.length > 0 && (
                  <div role="alert" className="flex flex-col gap-2 rounded-2xl bg-rose px-4 py-3.5 text-[14px] text-accent">
                    <strong>.env.local còn thiếu:</strong>
                    <ul className="m-0 flex list-none flex-col gap-1 p-0">
                      {missing.map((m) => <li key={m}><code className="font-semibold">{m}</code></li>)}
                    </ul>
                    <span className="text-maroon">Thêm đủ rồi dừng <code>npm run dev</code> (Ctrl+C) và chạy lại. Khoá service role ở Supabase → Project Settings → API (mục <em>service_role</em>, bấm Reveal).</span>
                  </div>
                )}
                <ol className="m-0 flex list-none flex-col gap-3.5 p-0">
                  {steps.map((s, i) => (
                    <li key={s.t} className="grid grid-cols-[28px_minmax(0,1fr)] gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-maroon text-[13px] font-bold text-cream">{i + 1}</span>
                      <span className="flex flex-col"><strong className="text-[14px] text-maroon">{s.t}</strong><span className="text-[13px] text-muted">{s.d}</span></span>
                    </li>
                  ))}
                </ol>
                <p className="m-0 rounded-2xl bg-beige px-3.5 py-3 text-[13px] text-muted">
                  Muốn xem thử giao diện trước? Thêm <code className="font-semibold text-maroon">ADMIN_DEMO_PASSWORD=</code> (ít nhất 12 ký tự) vào .env.local rồi chạy <code className="font-semibold text-maroon">npm run dev</code>.
                </p>
              </div>
            ) : (
              <LoginForm demo={mode === "demo"} />
            )}

            <p className="mb-0 mt-7 flex items-start gap-2.5 border-t border-maroon/10 pt-5 text-[13px] leading-[1.5] text-muted">
              <ShieldIcon size={18} className="mt-px flex-none text-maroon/60" />
              <span>Chỉ tài khoản được chủ tiệm cấp quyền mới vào được. Quên mật khẩu? Nhờ chủ tiệm đặt lại trong Supabase.</span>
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3 text-[13px] text-muted lg:text-cream/45">
          <Link href="/" prefetch={false} className="inline-flex min-h-10 items-center font-semibold text-muted no-underline hover:text-maroon lg:hidden">← Về trang web</Link>
          <span className="lg:ml-auto">{store.slogan}</span>
        </div>
      </main>
    </div>
  );
}
