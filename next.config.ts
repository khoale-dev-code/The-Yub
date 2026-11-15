import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Chi WebP: ma hoa nhanh hon AVIF ~10 lan (AVIF 0,5–1s/anh lan dau -> trang nhieu anh bi treo vai giay).
    formats: ["image/webp"],
    // Anh trong public/ khong doi -> giu ban da toi uu 31 ngay thay vi ma hoa lai sau 60 giay
    minimumCacheTTL: 2_678_400,
  },
  experimental: {
    // Trinh duyet giu trang vua xem 30 giay (trang tai truoc qua menu: 3 phut) -> quay lai la hien ngay,
    // khong hien khung cho. Moi thao tac sua / xoa / doi trang thai van xoa bo nho nay ngay (revalidatePath),
    // Tong quan + Don hang van tu cap nhat moi 30 giay.
    staleTimes: { dynamic: 30, static: 180 },
  },
};

export default nextConfig;
