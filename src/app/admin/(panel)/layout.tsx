import { AdminShell } from "@/components/admin/admin-shell";
import { getNavCounts } from "@/modules/admin/orders";
import { requireAdmin } from "@/modules/admin/session";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const counts = await getNavCounts().catch(() => ({ pending: 0, inbox: 0 }));
  return (
    <AdminShell user={{ name: user.name, email: user.email, role: user.role, demo: user.demo }} counts={counts}>
      {children}
    </AdminShell>
  );
}
