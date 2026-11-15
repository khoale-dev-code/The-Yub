import type { Metadata } from "next";
import { SettingsForm } from "@/components/admin/settings-form";
import { StaffManager } from "@/components/admin/staff-manager";
import { listStaff } from "@/modules/admin/staff";
import { PageHeader, card } from "@/components/admin/ui";
import { requireAdmin } from "@/modules/admin/session";
import { settingsRepository } from "@/modules/settings/repository";

export const metadata: Metadata = { title: "Cài đặt" };

export default async function AdminSettingsPage() {
  const user = await requireAdmin();
  const [settings, staff] = await Promise.all([settingsRepository.getFresh(), user.role === "owner" ? listStaff().catch(() => []) : Promise.resolve([])]);


  return (
    <>
      <PageHeader title="Cài đặt tiệm" description={user.role === "owner" ? "Thông tin hiện trên web và dùng khi gọi xác nhận đơn." : "Chỉ chủ tiệm mới sửa được mục này."} />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8">
        <div className="flex flex-col gap-5">
          <SettingsForm initial={settings} readOnly={user.role !== "owner"} />
          {user.role === "owner" && <StaffManager staff={staff} selfId={user.id} demo={user.demo} />}
        </div>
        <aside className="flex flex-col gap-4">
          <section className={`${card} flex flex-col gap-2 p-4`}>
            <strong className="text-[15px]">Tài khoản</strong>
            <span className="text-[14px]">{user.name}{user.email && !user.demo ? ` · ${user.email}` : ""}</span>
            <span className="text-[13px] text-muted">Vai trò: {user.role === "owner" ? "Chủ tiệm" : "Nhân viên"}</span>
            {user.role !== "owner" && <p className="m-0 text-[12px] text-muted">Đổi mật khẩu / tài khoản: nhờ chủ tiệm.</p>}
          </section>
        </aside>
      </div>
    </>
  );
}
