/**
 * Ban do Google Maps cua tiem.
 * Chu tiem co the dan CA MA <iframe …> (Google Maps -> Chia se -> Nhung ban do) hoac chi link src.
 * Chi chap nhan link https://www.google.com/maps/embed?… de khong nhung trang la vao web.
 */
export const MAP_EMBED_PREFIX = "https://www.google.com/maps/embed?";

/** Lay link src tu ma <iframe> (neu co) va chuan hoa. Khong hop le thi tra lai chuoi da trim. */
export function normalizeMapEmbed(input: string): string {
  const raw = input.trim();
  const m = /<iframe[^>]*\ssrc\s*=\s*["']([^"']+)["']/i.exec(raw);
  const src = (m?.[1] ?? raw).trim().replace(/&amp;/g, "&");
  return src;
}

export const isMapEmbedUrl = (v: string) => v.startsWith(MAP_EMBED_PREFIX) && v.length <= 1000 && !/[\s"'<>]/.test(v);

/** Nguoi dung dan nham ma nhung vao o khac */
export const looksLikeIframe = (v: string) => /<iframe/i.test(v);

/** "c78df332a196e347" -> so thap phan dang chuoi (khong dung BigInt cho tuong thich) */
function hexToDecimal(hex: string): string {
  let digits = [0];
  for (const ch of hex.toLowerCase()) {
    let carry = parseInt(ch, 16);
    if (Number.isNaN(carry)) return "";
    for (let i = 0; i < digits.length; i++) {
      const v = (digits[i] ?? 0) * 16 + carry;
      digits[i] = v % 10;
      carry = Math.floor(v / 10);
    }
    while (carry > 0) {
      digits.push(carry % 10);
      carry = Math.floor(carry / 10);
    }
  }
  digits = digits.reverse();
  return digits.join("").replace(/^0+(?=\d)/, "");
}

/**
 * Link "Chi duong": uu tien link chu tiem nhap; khong co thi suy ra tu ban do nhung
 * (ma dia diem -> mo dung trang cua tiem tren Google Maps), roi toi toa do, cuoi cung la dia chi.
 */
export function directionsUrlOf(s: { mapUrl: string | null; mapEmbedUrl: string | null; address: string | null }): string | null {
  if (s.mapUrl) return s.mapUrl;
  const embed = s.mapEmbedUrl ?? "";
  const cid = /!1s0x[0-9a-f]+(?::|%3A)0x([0-9a-f]+)/i.exec(embed)?.[1];
  if (cid) {
    const dec = hexToDecimal(cid);
    if (dec) return `https://www.google.com/maps?cid=${dec}`;
  }
  const lng = /!2d(-?\d+(?:\.\d+)?)/.exec(embed)?.[1];
  const lat = /!3d(-?\d+(?:\.\d+)?)/.exec(embed)?.[1];
  if (lat && lng) return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  if (s.address) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.address)}`;
  return null;
}
