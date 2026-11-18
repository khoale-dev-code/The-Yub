import type { RecipeFields, RecipeKind } from "./types";

type Sample = RecipeFields & { id: string; kind: RecipeKind; name: string };

export const samples: Sample[] = [
  {
    id: "croissant-bo", kind: "banh", name: "Croissant bơ", batch: "8 chiếc",
    ingredients: "Bột mì số 13 — 300 g\nSữa tươi lạnh — 155 g\nĐường — 30 g\nMen instant — 5 g\nMuối — 5 g\nBơ lạt làm bột — 25 g\nBơ lạt để cán — 135 g\nTrứng đánh tan — 1 quả",
    steps: "Nhồi bột, sữa, đường, men và muối đến khi bột kết khối. Thêm 25 g bơ, nhồi mịn rồi dàn phẳng và ủ lạnh qua đêm.\nCán 135 g bơ thành tấm. Bọc kín bơ bằng bột, cán dài và gấp ba. Lặp lại cho đủ ba lần gấp, cho bột nghỉ lạnh 30 phút giữa các lần.\nCán bột dày khoảng 4 mm, cắt 8 tam giác rồi cuộn từ đáy lên đỉnh.\nỦ đến khi bánh nở xốp và rung nhẹ khi lắc khay. Quét trứng mỏng.\nNướng trong lò đã làm nóng ở 190°C khoảng 18–22 phút đến khi vàng đều.",
    notes: "Nếu bơ mềm và bắt đầu rịn ra khi cán, đặt cả khối vào ngăn mát trước khi tiếp tục."
  },
  {
    id: "tart-trung", kind: "banh", name: "Tart trứng", batch: "6 bánh tart nhỏ",
    ingredients: "Đế tart ngàn lớp — 6 cái\nLòng đỏ trứng — 2 cái\nSữa tươi — 90 ml\nKem sữa — 60 ml\nĐường — 28 g\nVani — 2 ml",
    steps: "Làm nóng lò ở 200°C. Đặt sáu đế tart vào khuôn.\nKhuấy đường với sữa và kem đến khi tan. Cho lòng đỏ và vani vào, khuấy nhẹ rồi lọc qua rây.\nRót nhân đến khoảng ¾ chiều cao đế.\nNướng 20–25 phút đến khi vỏ vàng và nhân vừa đông. Để bánh nghỉ 5 phút trước khi lấy ra khỏi khuôn.",
    notes: "Khuấy nhẹ tay để mặt nhân ít bọt."
  },
  {
    id: "bong-lan-chanh", kind: "banh", name: "Bông lan chanh", batch: "1 khuôn tròn 16 cm",
    ingredients: "Trứng — 3 quả\nĐường — 75 g\nBột mì số 8 — 80 g\nBơ lạt đun chảy — 25 g\nSữa tươi — 20 ml\nVỏ chanh vàng bào — 1 thìa cà phê",
    steps: "Lót đáy khuôn và làm nóng lò ở 165°C.\nĐánh trứng với đường đến khi hỗn hợp bông, nhấc que lên thấy vệt chảy thành dải.\nRây bột vào làm hai lượt, trộn vét nhẹ từ đáy lên. Trộn một ít bột bánh với bơ, sữa và vỏ chanh rồi đổ lại vào âu.\nRót vào khuôn, nướng khoảng 28–35 phút. Kiểm tra bằng que thử rồi để nguội trên giá.",
    notes: "Chỉ bào lớp vỏ vàng của chanh để bánh thơm dịu."
  },
  {
    id: "banh-cuon-kem", kind: "banh", name: "Bánh cuộn kem", batch: "1 cuộn, khoảng 8 lát",
    ingredients: "Trứng — 3 quả\nĐường cho cốt — 65 g\nBột mì số 8 — 60 g\nSữa tươi — 25 ml\nDầu ăn — 20 ml\nKem whipping lạnh — 150 ml\nĐường cho kem — 12 g",
    steps: "Lót giấy vào khay 24 × 28 cm. Làm nóng lò ở 170°C.\nĐánh trứng với 65 g đường đến khi bông thành dải. Rây bột vào, trộn nhẹ. Hòa sữa và dầu với một ít hỗn hợp rồi trộn lại.\nDàn đều trên khay, nướng khoảng 12–15 phút. Khi bánh còn ấm, cuộn lỏng với giấy rồi để nguội.\nĐánh kem lạnh với 12 g đường đến khi tạo chóp. Mở cốt bánh, phết kem rồi cuộn lại và giữ lạnh cho định hình.",
    notes: "Chừa khoảng 2 cm ở mép cuối để kem không tràn ra khi cuộn."
  },
  {
    id: "cafe-sua", kind: "do-uong", name: "Cà phê sữa", batch: "1 ly đá, size M",
    ingredients: "Cốt cà phê phin — 45 ml\nSữa đặc — 25 ml\nĐá viên — 120 g",
    steps: "Đong sữa đặc vào ly.\nCho cốt cà phê còn ấm vào, khuấy từ đáy đến khi sữa tan đều.\nThêm đá, đảo nhẹ và phục vụ.",
    notes: "Đong cốt cà phê sau khi pha để mỗi ly có cùng độ đậm."
  },
  {
    id: "bac-xiu", kind: "do-uong", name: "Bạc xỉu", batch: "1 ly đá, size M",
    ingredients: "Sữa tươi — 90 ml\nSữa đặc — 20 ml\nCốt cà phê phin — 25 ml\nĐá viên — 100 g",
    steps: "Hòa sữa đặc với sữa tươi trong ly.\nCho đá vào rồi đánh nhẹ cốt cà phê để tạo bọt.\nRót cà phê sát mặt đá để giữ hai tầng màu.",
    notes: "Dùng ly trong để thấy rõ lớp sữa và cà phê."
  },
  {
    id: "matcha-latte", kind: "do-uong", name: "Matcha latte", batch: "1 ly đá, size M",
    ingredients: "Bột matcha — 3 g\nNước ấm khoảng 75°C — 40 ml\nSữa tươi — 120 ml\nSiro đường — 12 ml\nĐá viên — 100 g",
    steps: "Rây matcha vào chén, thêm nước ấm. Đánh theo hình chữ W đến khi bột tan.\nHòa sữa với siro đường, rót vào ly rồi thêm đá.\nRót matcha thành dòng nhỏ lên mặt đá.",
    notes: "Đánh matcha ngay trước khi pha để giữ lớp bọt mịn."
  },
  {
    id: "tra-dao-cam-sa", kind: "do-uong", name: "Trà đào cam sả", batch: "1 ly đá, size L",
    ingredients: "Trà đen — 4 g\nNước nóng — 150 ml\nSả đập dập — 1 nhánh\nSiro đào — 20 ml\nNước cam — 30 ml\nĐào ngâm — 2 lát\nĐá viên — 140 g",
    steps: "Ủ trà và sả với nước nóng trong 4 phút, lọc lấy nước.\nHòa trà với siro đào và để nguội bớt, sau đó thêm nước cam.\nLắc cùng đá, rót ra ly và thêm đào ngâm.",
    notes: "Nếm lại độ ngọt theo độ chín của cam."
  },
];

export const foldName = (value: string) => value.trim().toLocaleLowerCase("vi").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
