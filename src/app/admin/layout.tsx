import type { Metadata, Viewport } from "next";
import "../globals.css";

/**
 * Root layout RIENG cho trang quan ly: khong tai header, gio hang, Lenis, GSAP cua web ban hang
 * -> trang Admin nhe va mo nhanh hon.
 */
export const metadata: Metadata = {
  title: { default: "Quản lý", template: "%s · Quản lý The Yub" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#24120d" };

// Trang quan ly luon doc du lieu moi, khong cache
export const dynamic = "force-dynamic";

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="bg-[#F7F0E3] font-sans text-base leading-[1.55] text-maroon antialiased">{children}</body>
    </html>
  );
}
