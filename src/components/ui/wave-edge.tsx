/**
 * Song lon chuyen tiep giua cac phan (trang chu, footer) – 1 mau, khong vien, bien do lon.
 * Nam BEN TRONG phan chua no (khong lan sang phan ben canh) va to bang mau cua phan ke ben:
 *  - edge="bottom": day phan, fill = mau phan ben duoi
 *  - edge="top":    dau phan, fill = mau phan ben tren (song lat ngang)
 *  - edge="above":  NGAY PHIA TREN phan (vd footer), fill = mau cua chinh phan do; phan can margin-top = --wave-h
 * Phan chua can chua du khoang trong (padding) bang chieu cao song: --wave-h.
 * Desktop: 3 nhip luon; dien thoai: 1 nhip lon (song dai bi nen ngang se gat).
 */
const WAVE_DESKTOP =
  "M0 64 C 70 96, 125 124, 205 120 C 295 115, 345 86, 432 87 C 545 88, 620 140, 735 136 C 860 131, 905 14, 1052 14 C 1185 14, 1300 118, 1440 138 L1440 230 L0 230 Z";
const WAVE_MOBILE = "M0 92 C 150 150, 420 150, 640 118 C 860 86, 950 22, 1140 26 C 1290 30, 1370 92, 1440 112 L1440 230 L0 230 Z";

/** Chieu cao song – dung chung cho padding cua phan chua song */
export const WAVE_H = "h-16 md:h-[clamp(80px,11vw,170px)]";

interface WaveEdgeProps {
  fill: string;
  edge?: "top" | "bottom" | "above";
  /** Lat trai–phai de 2 mep gan nhau khong giong het */
  mirror?: boolean;
  className?: string;
}

function Wave({ d, fill, transform, className }: { d: string; fill: string; transform?: string; className: string }) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 1440 230" preserveAspectRatio="none" className={`h-full w-full ${className}`}>
      <path d={d} fill={fill} transform={transform} />
    </svg>
  );
}

export function WaveEdge({ fill, edge = "bottom", mirror = false, className = "" }: WaveEdgeProps) {
  const flips = [mirror ? "translate(1440 0) scale(-1 1)" : "", edge === "top" ? "translate(0 230) scale(1 -1)" : ""].filter(Boolean).join(" ") || undefined;
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-x-0 z-[1] ${edge === "top" ? "-top-px" : edge === "above" ? "bottom-[calc(100%-1px)]" : "-bottom-px"} ${WAVE_H} ${className}`}>
      <Wave d={WAVE_MOBILE} fill={fill} transform={flips} className="block md:hidden" />
      <Wave d={WAVE_DESKTOP} fill={fill} transform={flips} className="hidden md:block" />
    </div>
  );
}
