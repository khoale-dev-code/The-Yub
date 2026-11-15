/** Dinh dang tien VND: 42000 -> "42.000đ" */
export function formatVnd(amount: number): string {
  return `${amount.toLocaleString("vi-VN")}đ`;
}
