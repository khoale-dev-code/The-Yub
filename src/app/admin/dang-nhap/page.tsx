import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { GoogleLogin } from "@/components/admin/google-login";
import { LoginForm } from "@/components/admin/login-form";
import { ChevronLeftIcon, ShieldIcon } from "@/components/admin/admin-icons";
import { missingSupabaseEnv } from "@/lib/supabase/server";
import { getAdminMode, getAdminUser } from "@/modules/admin/session";
import styles from "./login.module.css";

export const metadata: Metadata = { title: "Đăng nhập quản lý" };

export const viewport: Viewport = { themeColor: "#24120d", viewportFit: "cover" };

const reasons = new Map([
  ["huy", "Bạn đã hủy đăng nhập Google. Bạn có thể chọn lại tài khoản."],
  ["phien", "Liên kết Google đã hết hạn hoặc không hợp lệ. Hãy bắt đầu lại trên trình duyệt này."],
  ["chua-cap-quyen", "Đã xác thực Google. Tài khoản này chưa được cấp quyền quản lý. Hãy nhờ chủ tiệm cấp quyền trong Supabase, rồi đăng nhập lại."],
  ["kiem-tra", "Chưa kiểm tra được quyền quản lý. Vui lòng thử lại sau."],
  ["cau-hinh", "Cần kết nối Supabase để sử dụng đăng nhập Google."],
]);

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ loi?: string }> }) {
  const [user, params] = await Promise.all([getAdminUser(), searchParams]);
  if (user) redirect("/admin");
  const mode = getAdminMode();
  const notice = reasons.get(params.loi ?? "");
  const missing = missingSupabaseEnv();
  return (
    <main className={styles.screen}>
      <section aria-labelledby="login-title" className={styles.panel}>
        <div className="mb-6 flex items-center justify-between gap-4 border-b border-white/15 pb-4">
          <Link href="/" aria-label="The Yub – Trang chủ" className="font-display text-[25px] font-semibold tracking-tight text-cream no-underline hover:text-butter">The Yub</Link>
          <Link href="/" className="inline-flex min-h-11 items-center gap-1 text-xs font-medium text-[#d8c5b9] no-underline hover:text-white"><ChevronLeftIcon size={15} />Về trang web</Link>
        </div>
        <h1 id="login-title" className="m-0 font-display text-center text-[clamp(1.8rem,4vw,2.45rem)] font-medium leading-[1.06] tracking-[-0.045em]">
          {mode === "off" ? "Kết nối quản trị" : "Đăng nhập quản lý"}
        </h1>
        <p className="mx-auto mb-6 mt-2 max-w-[33ch] text-center text-sm leading-relaxed text-[#d8c5b9]">
          {mode === "off" ? "Kết nối Supabase để mở khu vực quản lý của tiệm." : "Dùng tài khoản được chủ tiệm cấp quyền để vào The Yub."}
        </p>
        {notice && <p role="alert" className="mb-5 rounded-xl border border-[#82613e] bg-[#3a2a1c] p-3.5 text-sm leading-relaxed text-[#ffdfa7]">{notice}</p>}
        {mode === "off" ? <div className="break-words rounded-xl border border-white/20 p-4 text-sm leading-relaxed">
          <p className="m-0">Cấu hình kết nối trong <code>.env.local</code>, chạy các migration và cấp quyền trong bảng <code>admin_users</code>.</p>
          {missing.length > 0 && <p className="mb-0 mt-2 break-words">Biến còn thiếu: {missing.join(", ")}.</p>}
          <p className="mb-0 mt-2">Xem hướng dẫn trong <code>docs/ADMIN.md</code>. Để xem thử ở máy local, đặt <code>ADMIN_DEMO_PASSWORD</code> từ 12 ký tự rồi chạy <code>npm run dev</code>.</p>
        </div> : <>
          {mode === "supabase" && <>
            <GoogleLogin />
            <div className="my-5 flex items-center gap-3 text-xs text-[#d8c5b9]"><span className="h-px flex-1 bg-white/15" />hoặc dùng email<span className="h-px flex-1 bg-white/15" /></div>
          </>}
          <LoginForm demo={mode === "demo"} />
        </>}
        {mode === "supabase" && !notice && <p className="mb-0 mt-5 flex gap-2 text-xs leading-relaxed text-[#d8c5b9]">
          <ShieldIcon size={16} className="shrink-0" />Lần đầu dùng Google? Chọn tài khoản rồi liên hệ chủ tiệm nếu cần cấp quyền.
        </p>}
      </section>
    </main>
  );
}
