import Image from "next/image";
import Link from "next/link";
import { brandImages } from "@/lib/images";
import { getStoreInfo } from "@/modules/settings/store-info-server";
import { settingsRepository } from "@/modules/settings/repository";
import { ADDRESS_PLACEHOLDER } from "@/modules/settings/types";
import { TornWave } from "../ui/torn-wave";

const headingCls = "mb-1.5 text-xs font-bold uppercase tracking-[0.2em] text-accent";

export async function SiteFooter({ variant = "full" }: { variant?: "full" | "compact" }) {
  const store = await getStoreInfo();
  const address = (await settingsRepository.get()).address ?? ADDRESS_PLACEHOLDER;
  if (variant === "compact") {
    return (
      <footer id="ghe-tiem" className="bg-cream text-maroon">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-6 px-6 pb-28 pt-14 md:pb-8">
          <Link href="/" aria-label="The Yub – Trang chủ">
            <Image src={brandImages.logoMaroon} alt="The Yub – Bakes & More" width={brandImages.logoWidth} height={brandImages.logoHeight} className="h-[60px] w-auto" />
          </Link>
          <span className="text-muted">
            {address} · Mở cửa {store.openHours} · Gọi trước khi đến:{" "}
            <a href={store.phoneHref} className="font-semibold text-maroon">{store.phone}</a>
          </span>
          <span className="text-[13px] text-muted">© 2026 {store.name}</span>
        </div>
      </footer>
    );
  }
  return (
    <footer id="ghe-tiem" className="relative bg-cream text-maroon">
      <TornWave fill="#FFF3D9" className="absolute -top-[47px] left-0" />
      {/* mobile */}
      <div className="flex flex-col gap-[18px] px-5 pb-32 pt-11 md:hidden">
        <div className="flex items-center justify-between gap-3">
          <Image src={brandImages.logoMaroon} alt="The Yub – Bakes & More" width={brandImages.logoWidth} height={brandImages.logoHeight} className="h-[52px] w-auto" />
          <span className="text-right font-display text-[15px] text-accent">Nơi giòn rụm<br />gặp thơm bơ.</span>
        </div>
        <div className="flex flex-col gap-1 border-t border-maroon/15 pt-[18px]">
          <h2 className="m-0 mb-1 font-display text-2xl font-semibold">Ghé tiệm</h2>
          <span className="text-muted-2">{address}</span>
          <span className="text-muted-2">Mở cửa {store.openHours} · Ra lò {store.freshBatchTime}</span>
          <a href={store.phoneHref} className="inline-flex min-h-11 items-center font-semibold">Gọi trước khi đến: {store.phone}</a>
        </div>
        <nav aria-label="Liên kết chân trang" className="grid grid-cols-2 gap-x-4 gap-y-1">
          <Link href="/thuc-don" className="flex min-h-10 items-center no-underline">Bánh</Link>
          <Link href="/do-uong" className="flex min-h-10 items-center no-underline">Đồ uống</Link>
          <Link href="/dat-banh" className="flex min-h-10 items-center no-underline">Đặt trước</Link>
          <Link href="/cau-chuyen" className="flex min-h-10 items-center no-underline">Câu chuyện</Link>
        </nav>
        <div className="flex flex-wrap gap-2">
          {["Facebook", "Instagram", "TikTok"].map((n) => (
            <span key={n} className="inline-flex min-h-11 items-center rounded-full border border-maroon/25 px-4 text-sm">{n}</span>
          ))}
        </div>
        <span className="border-t border-maroon/15 pt-3.5 text-xs text-muted-2">© 2026 {store.name}</span>
      </div>
      <div className="mx-auto hidden max-w-[1200px] flex-col gap-12 px-6 pb-8 pt-[72px] md:flex">
        <div className="flex flex-wrap justify-between gap-10">
          <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-3.5">
            <Image src={brandImages.logoMaroon} alt="The Yub – Bakes & More" width={brandImages.logoWidth} height={brandImages.logoHeight} className="h-[72px] w-auto self-start" />
            <span className="font-display text-xl text-accent">{store.slogan}.</span>
            <span className="max-w-[300px] text-muted-2">Tiệm bánh &amp; quầy nước — bánh ra lò mỗi chiều, cà phê pha khi bạn tới.</span>
          </div>
          <div className="flex flex-[0_1_260px] flex-col gap-2">
            <h3 className={headingCls}>Ghé tiệm</h3>
            <span className="text-muted-2">{address}</span>
            <span className="text-muted-2">Mở cửa {store.openHours} · Ra lò {store.freshBatchTime}</span>
            <a href={store.phoneHref} className="font-semibold">Gọi trước khi đến: {store.phone}</a>
            <Link href="/ghe-tiem" className="text-sm font-semibold text-accent">Đường đến tiệm & giờ nhận bánh →</Link>
          </div>
          <div className="flex flex-[0_1_160px] flex-col gap-2">
            <h3 className={headingCls}>Thực đơn</h3>
            <Link href="/thuc-don" className="no-underline">Bánh</Link>
            <Link href="/do-uong" className="no-underline">Đồ uống</Link>
            <Link href="/#cap-doi" className="no-underline">Cặp đôi ăn ý</Link>
            <Link href="/dat-banh" className="no-underline">Đặt trước</Link>
            <Link href="/cau-chuyen" className="no-underline">Câu chuyện</Link>
            <Link href="/ghe-tiem" className="no-underline">Ghé tiệm</Link>
          </div>
          <div className="flex flex-[0_1_160px] flex-col gap-2">
            <h3 className={headingCls}>Theo dõi</h3>
            {/* Link mang xa hoi: cho chu tiem cung cap */}
            <span className="text-muted-2">Facebook</span>
            <span className="text-muted-2">Instagram</span>
            <span className="text-muted-2">TikTok</span>
          </div>
        </div>
        <div className="flex flex-wrap justify-between gap-3 border-t border-maroon/15 pt-5 text-[13px] text-muted-2">
          <span>© 2026 {store.name}</span>
          <span>Bánh · Cà phê · Trà</span>
        </div>
      </div>
    </footer>
  );
}
