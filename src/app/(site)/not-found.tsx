import Link from "next/link";
import { SiteFooter } from "@/components/layout/site-footer";

export default function NotFound() {
  return (
    <>
      <main className="mx-auto flex max-w-[680px] flex-col items-start gap-4 px-4 py-24">
        <h1 className="m-0 font-display text-4xl font-semibold">Không tìm thấy trang</h1>
        <p className="m-0 text-muted">Trang bạn tìm không tồn tại hoặc đã được dời đi.</p>
        <Link href="/" className="inline-flex min-h-12 items-center rounded-full bg-maroon px-6 font-semibold text-cream no-underline hover:bg-accent hover:text-cream">Về trang chủ</Link>
      </main>
      <SiteFooter variant="compact" />
    </>
  );
}
