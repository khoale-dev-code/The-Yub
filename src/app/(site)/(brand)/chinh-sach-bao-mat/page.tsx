import type { Metadata } from "next";
import Link from "next/link";
import { CONSENT_VERSION } from "@/modules/customers/consent";
import { settingsRepository } from "@/modules/settings/repository";
import { getStoreInfo } from "@/modules/settings/store-info-server";
import { ADDRESS_PLACEHOLDER } from "@/modules/settings/types";

export const metadata: Metadata = {
  title: "Chính sách bảo mật",
  description: "Cách tiệm thu thập, sử dụng và bảo vệ dữ liệu cá nhân khi bạn đăng nhập và đặt bánh.",
};

/**
 * Noi dung mo ta DUNG nhung gi he thong dang lam (du lieu nao, de lam gi, luu o dau, quyen cua khach).
 * Doi noi dung quan trong -> tang CONSENT_VERSION (src/modules/customers/consent.ts) de khach dong y lai.
 * Chu tiem nen nho nguoi co chuyen mon phap ly xem lai truoc khi dua vao su dung chinh thuc.
 */
export default async function PrivacyPage() {
  const store = await getStoreInfo();
  const address = (await settingsRepository.get()).address ?? ADDRESS_PLACEHOLDER;
  const [y, m, d] = CONSENT_VERSION.split("-");

  const sections: { title: string; body: React.ReactNode }[] = [
    {
      title: "1. Ai chịu trách nhiệm dữ liệu của bạn",
      body: (
        <p>
          {store.name} (gọi là “tiệm”) – địa chỉ: {address}; điện thoại: <a href={store.phoneHref}>{store.phone}</a>. Tiệm là bên kiểm soát và xử lý dữ liệu cá nhân bạn cung cấp khi dùng website.
        </p>
      ),
    },
    {
      title: "2. Dữ liệu tiệm thu thập",
      body: (
        <ul>
          <li><strong>Khi đăng nhập bằng Google:</strong> họ tên, địa chỉ email, ảnh đại diện và mã định danh tài khoản do Google cung cấp. Tiệm không nhận và không lưu mật khẩu Google của bạn.</li>
          <li><strong>Khi bạn tự nhập:</strong> số điện thoại, địa chỉ (trong trang Tài khoản), tên người nhận và ghi chú khi đặt bánh.</li>
          <li><strong>Phát sinh khi sử dụng:</strong> lịch sử đơn hàng, món yêu thích, thời điểm và phiên bản bạn đồng ý chính sách này.</li>
          <li>Khi chưa đăng nhập, món bạn bấm tim chỉ lưu tạm trên trình duyệt của bạn và tự mất khi tắt trình duyệt; giỏ hàng lưu trên chính thiết bị của bạn.</li>
          <li>Tiệm không thu thập dữ liệu cá nhân nhạy cảm và không lưu thông tin thẻ hay tài khoản ngân hàng của bạn.</li>
        </ul>
      ),
    },
    {
      title: "3. Mục đích sử dụng",
      body: (
        <ul>
          <li>Tạo và quản lý tài khoản, cho bạn đăng nhập.</li>
          <li>Xác nhận đơn, chuẩn bị bánh, hẹn giờ nhận và liên hệ khi đơn có sự cố.</li>
          <li>Hiển thị lịch sử đơn, cho phép mua lại và lưu món yêu thích.</li>
          <li>Gửi tin mẻ bánh mới và ưu đãi – <strong>chỉ khi bạn đồng ý riêng</strong> (có thể tắt bất cứ lúc nào).</li>
        </ul>
      ),
    },
    {
      title: "4. Lưu trữ và chia sẻ",
      body: (
        <>
          <p>Dữ liệu được lưu trên hệ thống máy chủ đám mây mà tiệm sử dụng để vận hành website; việc đăng nhập do Google thực hiện theo chính sách của Google. Máy chủ của nhà cung cấp có thể đặt ngoài lãnh thổ Việt Nam.</p>
          <p>Tiệm không bán dữ liệu của bạn. Dữ liệu chỉ được chia sẻ với các nhà cung cấp kỹ thuật nêu trên ở mức cần thiết để website hoạt động, hoặc khi cơ quan nhà nước có thẩm quyền yêu cầu theo quy định pháp luật.</p>
        </>
      ),
    },
    {
      title: "5. Thời gian lưu",
      body: <p>Dữ liệu tài khoản được lưu đến khi bạn xoá tài khoản. Khi xoá, hồ sơ, món yêu thích và lịch sử đồng ý bị xoá; thông tin đơn đã đặt có thể được tiệm giữ lại (không còn gắn với tài khoản) trong thời hạn pháp luật về kế toán, thuế yêu cầu.</p>,
    },
    {
      title: "6. Quyền của bạn",
      body: (
        <ul>
          <li>Xem và chỉnh sửa thông tin của mình trong trang <Link href="/tai-khoan">Tài khoản</Link>.</li>
          <li>Rút lại sự đồng ý nhận tin ưu đãi bất cứ lúc nào trong trang Tài khoản.</li>
          <li>Rút lại sự đồng ý và yêu cầu xoá dữ liệu: dùng nút “Xoá tài khoản” trong trang Tài khoản – việc xoá được thực hiện ngay.</li>
          <li>Yêu cầu cung cấp, hạn chế, phản đối xử lý hoặc khiếu nại: liên hệ tiệm qua số <a href={store.phoneHref}>{store.phone}</a>; tiệm phản hồi trong thời hạn pháp luật quy định.</li>
        </ul>
      ),
    },
    {
      title: "7. Bảo vệ dữ liệu",
      body: (
        <ul>
          <li>Phiên đăng nhập được xác thực ở máy chủ; dữ liệu khách hàng không công khai và chỉ đọc được qua máy chủ của website.</li>
          <li>Chỉ tài khoản quản lý do chủ tiệm cấp mới xem được thông tin khách hàng, để phục vụ đơn hàng.</li>
          <li>Nếu xảy ra sự cố lộ, mất dữ liệu, tiệm sẽ khắc phục và thông báo cho bạn cùng cơ quan có thẩm quyền theo quy định.</li>
        </ul>
      ),
    },
    {
      title: "8. Trẻ em",
      body: <p>Nếu bạn dưới 16 tuổi, vui lòng chỉ đăng nhập khi đã có sự đồng ý của cha mẹ hoặc người giám hộ.</p>,
    },
    {
      title: "9. Căn cứ và thay đổi chính sách",
      body: (
        <p>
          Chính sách được xây dựng theo Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15, các văn bản hướng dẫn thi hành và quy định pháp luật về an ninh mạng. Khi nội dung quan trọng thay đổi, tiệm cập nhật phiên bản và đề nghị bạn xác nhận lại ở lần đăng nhập tiếp theo.
        </p>
      ),
    },
  ];

  return (
    <article className="mx-auto max-w-[820px] px-5 pb-10 pt-10 md:px-6 md:pt-16">
      <h1 className="m-0 font-display text-[40px] font-semibold leading-[1.05] tracking-[-0.02em] md:text-[56px]">Chính sách bảo mật</h1>
      <p className="mb-0 mt-3 text-muted">Áp dụng khi bạn đăng nhập, đặt bánh và dùng website {store.name}. Phiên bản ngày {d}/{m}/{y}.</p>
      <div className="mt-10 flex flex-col gap-8 text-[16px] leading-relaxed [&_li]:mb-1.5 [&_p]:m-0 [&_p+p]:mt-3 [&_ul]:m-0 [&_ul]:pl-5">
        {sections.map((s) => (
          <section key={s.title} data-no-reveal className="flex flex-col gap-3">
            <h2 className="m-0 font-display text-[24px] font-semibold leading-tight">{s.title}</h2>
            <div className="text-maroon/90">{s.body}</div>
          </section>
        ))}
      </div>
    </article>
  );
}
