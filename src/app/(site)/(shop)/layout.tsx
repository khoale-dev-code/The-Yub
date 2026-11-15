import { SiteFooter } from "@/components/layout/site-footer";

/** Trang ben trong (thuc don, san pham, gio hang…) dung footer gon nhu ban thiet ke. */
export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main>{children}</main>
      <SiteFooter variant="compact" />
    </>
  );
}
