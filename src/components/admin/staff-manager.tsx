"use client";

import { useState, useTransition } from "react";
import { addStaffAction, removeStaffAction, updateStaffAction } from "@/modules/admin/actions";
import type { StaffMember } from "@/modules/admin/staff";
import { PlusIcon, TrashIcon } from "./admin-icons";
import { toast } from "./toast";
import { btn, card, input, label } from "./ui";

type Role = "owner" | "staff";
const roleText: Record<Role, string> = { owner: "Chủ tiệm", staff: "Nhân viên" };

function randomPassword() {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const buf = new Uint32Array(12);
  crypto.getRandomValues(buf);
  return Array.from(buf, (n) => chars[n % chars.length]).join("");
}

function StaffRow({ m, isSelf }: { m: StaffMember; isSelf: boolean }) {
  const [name, setName] = useState(m.name);
  const [role, setRole] = useState<Role>(m.role);
  const [asking, setAsking] = useState(false);
  const [pending, start] = useTransition();
  const dirty = name !== m.name || role !== m.role;

  const save = () =>
    start(async () => {
      const res = await updateStaffAction({ userId: m.userId, name, role });
      if (res.ok) toast(`Đã lưu ${name}`);
      else toast(res.error, "error");
    });
  const remove = () =>
    start(async () => {
      const res = await removeStaffAction({ userId: m.userId });
      if (res.ok) toast(`Đã thu hồi quyền của ${m.name}`);
      else toast(res.error, "error");
      setAsking(false);
    });

  return (
    <li className="flex flex-col gap-2.5 border-b border-maroon/8 py-3.5 last:border-b-0">
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_140px] sm:items-end">
        <label className={label}>
          <span className="flex items-center gap-2">
            Tên hiển thị {isSelf && <span className="rounded-full bg-butter/40 px-2 text-[11px]">Bạn</span>}
          </span>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} className={`${input} min-h-10`} />
        </label>
        <label className={label}>
          Vai trò
          <select value={role} onChange={(e) => setRole(e.target.value as Role)} disabled={isSelf} className={`${input} min-h-10 disabled:opacity-60`}>
            <option value="owner">{roleText.owner}</option>
            <option value="staff">{roleText.staff}</option>
          </select>
        </label>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="truncate text-[13px] text-muted">{m.email || "—"}</span>
        <span className="flex gap-1.5">
          {dirty && <button type="button" disabled={pending} onClick={save} className={`${btn.primary} min-h-9 px-4 text-[13px]`}>Lưu</button>}
          {!isSelf && !asking && (
            <button type="button" onClick={() => setAsking(true)} className={`${btn.ghost} text-accent`}><TrashIcon /> Thu hồi quyền</button>
          )}
        </span>
      </div>
      {asking && (
        <div role="alertdialog" className="flex flex-col gap-2 rounded-[14px] bg-rose/60 p-3">
          <strong className="text-[14px] text-accent">Thu hồi quyền quản lý của {m.name}?</strong>
          <span className="text-[13px] text-muted">Người này sẽ không vào được trang quản lý nữa (tài khoản đăng nhập vẫn còn, cấp lại được).</span>
          <div className="flex gap-2">
            <button type="button" disabled={pending} onClick={remove} className={`${btn.primary} min-h-9 bg-accent px-4 text-[13px]`}>Thu hồi</button>
            <button type="button" onClick={() => setAsking(false)} className={`${btn.secondary} min-h-9 px-4 text-[13px]`}>Thôi</button>
          </div>
        </div>
      )}
    </li>
  );
}

/** Chu tiem them / doi vai tro / thu hoi quyen tai khoan quan ly */
export function StaffManager({ staff, selfId, demo }: { staff: StaffMember[]; selfId: string; demo: boolean }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("staff");
  const [password, setPassword] = useState("");
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);
  const [pending, start] = useTransition();

  const add = () =>
    start(async () => {
      const res = await addStaffAction({ email, name, role, password });
      if (!res.ok) return toast(res.error, "error");
      toast(`Đã thêm ${name}`);
      setCreated({ email, password });
      setEmail("");
      setName("");
      setPassword("");
      setOpen(false);
    });

  return (
    <section className={`${card} flex flex-col gap-2 p-4 md:p-6`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="m-0 font-display text-[20px] font-semibold">Tài khoản quản lý</h2>
          <p className="m-0 mt-1 text-[14px] text-muted">Nhân viên: xem & xử lý đơn, món, hộp thư. Chủ tiệm: thêm cài đặt, báo cáo, xoá và quản lý tài khoản.</p>
        </div>
        {!open && (
          <button type="button" onClick={() => { setOpen(true); setPassword(randomPassword()); }} className={`${btn.secondary} flex-none`}>
            <PlusIcon size={16} /> Thêm
          </button>
        )}
      </div>

      {created && (
        <div role="status" className="rounded-[14px] bg-[#E3EBD3] p-3 text-[14px] text-[#2F4A1E]">
          Gửi cho nhân viên: <strong>{created.email}</strong> · mật khẩu <code className="font-bold">{created.password}</code> – đăng nhập tại /admin/dang-nhap.
          <button type="button" onClick={() => setCreated(null)} className="ml-2 border-0 bg-transparent p-0 font-semibold underline">Đã gửi</button>
        </div>
      )}

      {open && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
          className="mt-1 grid gap-3 rounded-[18px] bg-beige/60 p-3.5 sm:grid-cols-2"
        >
          <label className={label}>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={120} autoComplete="off" className={`${input} min-h-10`} />
          </label>
          <label className={label}>
            Tên hiển thị
            <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={60} placeholder="VD: Lan – quầy" className={`${input} min-h-10`} />
          </label>
          <label className={label}>
            Vai trò
            <select value={role} onChange={(e) => setRole(e.target.value as Role)} className={`${input} min-h-10`}>
              <option value="staff">{roleText.staff}</option>
              <option value="owner">{roleText.owner}</option>
            </select>
          </label>
          <label className={label}>
            Mật khẩu ban đầu
            <span className="flex gap-1.5">
              <input value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} maxLength={72} autoComplete="new-password" className={`${input} min-h-10 font-mono`} />
              <button type="button" onClick={() => setPassword(randomPassword())} className={`${btn.ghost} flex-none`}>Tạo mới</button>
            </span>
          </label>
          {demo && <p className="m-0 text-[12px] text-muted sm:col-span-2">Chế độ xem thử: chỉ thêm vào danh sách, không tạo được tài khoản đăng nhập thật.</p>}
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" disabled={pending} className={btn.primary}>{pending ? "Đang tạo…" : "Thêm tài khoản"}</button>
            <button type="button" onClick={() => setOpen(false)} className={btn.secondary}>Huỷ</button>
          </div>
        </form>
      )}

      <ul className="m-0 list-none p-0">
        {staff.map((m) => (
          <StaffRow key={`${m.userId}-${m.name}-${m.role}`} m={m} isSelf={m.userId === selfId} />
        ))}
      </ul>
    </section>
  );
}
