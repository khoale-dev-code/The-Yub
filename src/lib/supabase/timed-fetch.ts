/**
 * Ghi thoi gian moi lan goi Supabase ra terminal khi chay `npm run dev`
 * (hoac dat YUB_TIMING=1 khi chay ban build). Vi du:
 *   [supabase]  142ms  GET  rest/orders
 *   [supabase]  611ms  POST auth/token  (cham)
 * CHI in phuong thuc + ten bang / endpoint – KHONG in tham so truy van (co the chua SDT, ten khach).
 */
const enabled = process.env.NODE_ENV !== "production" || process.env.YUB_TIMING === "1";
const SLOW_MS = 400;

function label(input: RequestInfo | URL): string {
  try {
    const raw = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const path = new URL(raw).pathname
      .replace(/^\/rest\/v1\/rpc\//, "rpc/")
      .replace(/^\/rest\/v1\//, "rest/")
      .replace(/^\/auth\/v1\//, "auth/");
    return path.length > 48 ? `${path.slice(0, 48)}…` : path;
  } catch {
    return "?";
  }
}

export const timedFetch: typeof fetch = async (input, init) => {
  if (!enabled) return fetch(input, init);
  const started = performance.now();
  try {
    return await fetch(input, init);
  } finally {
    const ms = Math.round(performance.now() - started);
    const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
    console.log(`[supabase] ${String(ms).padStart(5)}ms  ${method.padEnd(4)} ${label(input)}${ms >= SLOW_MS ? "  (chậm)" : ""}`);
  }
};
