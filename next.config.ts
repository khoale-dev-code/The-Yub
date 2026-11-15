import type { NextConfig } from "next";

/** Anh mon tai len nam o Supabase Storage -> cho phep next/image toi uu anh tu dung project do */
function supabaseImages() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  if (!raw) return [];
  try {
    const u = new URL(raw);
    return [{ protocol: u.protocol.replace(":", "") as "http" | "https", hostname: u.hostname, port: u.port, pathname: "/storage/v1/object/public/**" }];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  images: {
    // Chi WebP: ma hoa nhanh hon AVIF ~10 lan (AVIF 0,5–1s/anh lan dau -> trang nhieu anh bi treo vai giay).
    formats: ["image/webp"],
    // Anh trong public/ khong doi -> giu ban da toi uu 31 ngay thay vi ma hoa lai sau 60 giay
    minimumCacheTTL: 2_678_400,
    remotePatterns: supabaseImages(),
  },
  experimental: {
    // Trinh duyet giu trang vua xem 30 giay (trang tai truoc qua menu: 3 phut) -> quay lai la hien ngay,
    // khong hien khung cho. Moi thao tac sua / xoa / doi trang thai van xoa bo nho nay ngay (revalidatePath),
    // Tong quan + Don hang van tu cap nhat moi 30 giay.
    staleTimes: { dynamic: 30, static: 180 },
  },
};

export default nextConfig;
