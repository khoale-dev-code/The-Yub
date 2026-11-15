/**
 * Khung cho (skeleton) hien NGAY khi bam menu – trang moi do du lieu xong se thay vao.
 * Giup cam giac chuyen trang tuc thi thay vi dung hinh.
 */
export default function AdminLoading() {
  return (
    <div role="status" aria-label="Đang tải" className="animate-pulse">
      <div className="mb-8 flex flex-col gap-3">
        <span className="h-10 w-56 rounded-2xl bg-maroon/8" />
        <span className="h-4 w-80 max-w-full rounded-full bg-maroon/6" />
      </div>
      <div className="mb-6 flex gap-2">
        {[88, 72, 96, 80].map((w) => (
          <span key={w} className="h-10 rounded-full bg-maroon/6" style={{ width: w }} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="h-[112px] rounded-[22px] bg-card" />
        ))}
      </div>
      <div className="mt-6 flex flex-col gap-2.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className="h-[76px] rounded-[22px] bg-card" />
        ))}
      </div>
      <span className="sr-only">Đang tải…</span>
    </div>
  );
}
