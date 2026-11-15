import { notFound } from "next/navigation";

/** Duong dan khong ton tai -> trang 404 cua web (dung layout co header/footer) */
export default function CatchAllNotFound() {
  notFound();
}
