/**
 * Mep cong chuyen tiep giua cac section (hero, section toi, footer): 1 duong cong lien mach,
 * khong vet cat / giot chay, kem 1 vien bo (butter) mong phia tren cho cam giac tinh te.
 * Desktop: song dai, bien do nho. Mobile: 1 duong chu S mem (song dai bi nen ngang se gat).
 */
const WAVE_DESKTOP = "M0 27 C 200 15, 380 9, 580 12 C 780 15, 920 33, 1120 31 C 1270 29.5, 1370 21, 1440 17 L1440 48 L0 48 Z";
const WAVE_MOBILE = "M0 19 C 430 37, 960 5, 1440 23 L1440 48 L0 48 Z";

/** Do day vien bo (don vi viewBox, cao 48) */
const RIM = 4;

interface TornWaveProps {
  /** Mau phan duoi (mau cua section ke tiep) */
  fill: string;
  /** Mau vien phia tren */
  rim?: string;
  /** Lat ngang – dung cho mep tren cua section toi de song khong lap lai */
  mirror?: boolean;
  className?: string;
}

function Wave({ d, fill, rim, mirror, className }: { d: string; fill: string; rim: string; mirror: boolean; className: string }) {
  const flip = mirror ? "translate(1440 0) scale(-1 1)" : "";
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 1440 48" preserveAspectRatio="none" className={`h-full w-full ${className}`}>
      <path d={d} fill={rim} transform={`translate(0 -${RIM}) ${flip}`.trim()} />
      <path d={d} fill={fill} transform={flip || undefined} />
    </svg>
  );
}

export function TornWave({ fill, rim = "#E8A93B", mirror = false, className = "" }: TornWaveProps) {
  return (
    <div aria-hidden="true" className={`pointer-events-none block h-12 w-full ${className}`}>
      <Wave d={WAVE_MOBILE} fill={fill} rim={rim} mirror={mirror} className="block md:hidden" />
      <Wave d={WAVE_DESKTOP} fill={fill} rim={rim} mirror={mirror} className="hidden md:block" />
    </div>
  );
}
