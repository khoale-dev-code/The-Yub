/**
 * CHI khi chay `npm run dev`: sau khi server san sang, tu mo lan luot moi trang o nen de
 * Next bien dich truoc -> lan dau bam vao trang khong phai cho bien dich (het "khung" 5–20 giay).
 * Tat: dat YUB_WARM=0 trong .env.local. Ban build (npm start) khong chay doan nay.
 */
const ROUTES = [
  "/admin/dang-nhap",
  "/admin",
  "/admin/don-hang",
  "/admin/hop-thu",
  "/admin/mon",
  "/admin/do-uong",
  "/admin/khung-gio",
  "/admin/cai-dat",
  "/admin/bao-cao",
  "/admin/don-hang/moi",
  "/admin/don-hang/__warm__",
  "/admin/don-hang/__warm__/sua",
  "/admin/mon/moi",
  "/admin/mon/__warm__",
  "/",
  "/thuc-don",
  "/do-uong",
  "/dat-banh",
  "/gio-hang",
  "/cau-chuyen",
  "/ghe-tiem",
];

export async function register() {
  if (process.env.NODE_ENV !== "development" || process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.YUB_WARM === "0") return;
  const port = process.env.PORT || "3000";
  const base = `http://127.0.0.1:${port}`;

  setTimeout(async () => {
    const started = Date.now();
    for (const path of ROUTES) {
      try {
        // x-yub-warm: middleware (chi o dev) cho qua de trang duoc bien dich; trang van tu kiem tra dang nhap
        await fetch(base + path, { headers: { "x-yub-warm": "1" }, redirect: "manual", cache: "no-store" });
      } catch {
        return; // server chua/khong san sang – bo qua, khong anh huong gi
      }
    }
    console.log(`[warm] Đã biên dịch sẵn ${ROUTES.length} trang trong ${Math.round((Date.now() - started) / 1000)} giây – bấm vào sẽ không phải chờ.`);
  }, 1500);
}
