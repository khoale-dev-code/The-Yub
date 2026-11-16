import { SiteFooter } from "@/components/layout/site-footer";

/** Trang thuong hieu (Ghé tiệm, Chính sách bảo mật) dung footer day du nhu trang chu. */
export default function BrandLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main>{children}</main>
      <SiteFooter />
    </>
  );
}
