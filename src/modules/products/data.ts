import type { Drink, Product } from "./types";

/**
 * Seed data cho MVP – trung khop voi ban thiet ke tren canvas.
 * Gia la GIA MAU de demo UI; gia ban chinh thuc se do chu tiem
 * nhap qua Admin (hoac supabase/seed.sql) truoc khi di live.
 */
export const products: Product[] = [
  { id: "p-croissant-bo", slug: "croissant-bo", name: "Croissant bơ", description: "Vỏ giòn nhiều lớp, thơm bơ.", category: "croissant", status: "ready", priceVnd: 35000, image: "cubeStack", imagePosition: "center 35%" },
  {
    id: "p-croissant-socola", slug: "croissant-so-co-la", name: "Croissant sô-cô-la",
    description: "Vỏ bơ giòn tách lớp, ruột mềm, bên trong là hai thanh sô-cô-la đen tan chảy khi bánh còn ấm.",
    tagline: "Sô-cô-la đen chảy bên trong.",
    category: "croissant", status: "oven", priceVnd: 42000, image: "choco", imagePosition: "center 45%",
    gallery: ["choco", "crossSection", "croissantCoffee", "cubeStack"],
    variants: [
      { id: "one", label: "1 cái", priceVnd: 42000 },
      { id: "box4", label: "Hộp 4 cái", priceVnd: 160000 },
      { id: "box6", label: "Hộp 6 cái", priceVnd: 235000 },
    ],
    details: {
      highlights: [
        { title: "Vỏ giòn tách lớp", text: "Bẻ ra nghe giòn, ruột mềm.", image: "crossSection" },
        { title: "Sô-cô-la tan chảy", text: "Hai thanh sô-cô-la đen bên trong.", image: "choco" },
        { title: "Ngon nhất khi ấm", text: "Ăn trong 2 giờ đầu sau khi ra lò.", image: "croissantCoffee" },
      ],
      ingredients: "Bột mì, bơ lạt, sữa tươi, trứng, đường, men, muối và sô-cô-la đen.",
      allergens: "Có gluten, sữa, trứng; làm chung bếp với các loại hạt.",
    },
  },
  { id: "p-croissant-hanh-nhan", slug: "croissant-hanh-nhan", name: "Croissant hạnh nhân", description: "Kem hạnh nhân, lát hạnh nhân rang.", category: "croissant", status: "ready", priceVnd: 45000, image: "crossSection", imagePosition: "center 30%" },
  { id: "p-croissant-mam-xoi", slug: "croissant-mam-xoi", name: "Croissant mâm xôi", description: "Nhân sốt mâm xôi chua nhẹ.", category: "croissant", status: "oven", priceVnd: 45000, image: "raspberry", imagePosition: "center 40%" },
  { id: "p-croissant-4-vi", slug: "croissant-4-vi", name: "Croissant 4 vị", description: "Bơ, hạnh nhân, phô mai mâm xôi, sô-cô-la.", category: "croissant", status: "pre", priceVnd: 160000, image: "crossSection", imagePosition: "center 45%" },
  { id: "p-tart-trung", slug: "tart-trung", name: "Tart trứng", description: "Vỏ ngàn lớp, nhân trứng sữa.", category: "tart", status: "ready", priceVnd: 25000, image: "eggTarts" },
  { id: "p-tart-trai-cay", slug: "tart-trai-cay", name: "Tart trái cây", description: "Dâu, việt quất, xoài tươi.", category: "tart", status: "ready", priceVnd: 39000, image: "fruitEggTarts" },
  { id: "p-tart-kem-mua", slug: "tart-kem-mua", name: "Tart kem mùa", description: "Chanh, cherry, pistachio.", category: "tart", status: "ready", priceVnd: 59000, image: "fourDesserts", imagePosition: "center 40%" },
  { id: "p-hop-tart-4-vi", slug: "hop-tart-4-vi", name: "Hộp tart 4 vị", description: "Tart trái cây mọng, gói hộp sẵn.", category: "tart", status: "pre", priceVnd: 180000, image: "berryTartBox", imagePosition: "center 45%" },
  { id: "p-hop-tart-7-vi", slug: "hop-tart-7-vi", name: "Hộp tart 7 vị", description: "Matcha, chanh, dâu, việt quất…", category: "tart", status: "pre", priceVnd: 230000, image: "tartRack", imagePosition: "center 45%" },
  { id: "p-banh-kem-dau", slug: "banh-kem-dau", name: "Bánh kem dâu", description: "Nhiều tầng cốt, kem sữa, dâu tươi.", category: "cake", status: "ready", priceVnd: 55000, image: "strawberryCake", imagePosition: "center 70%" },
  { id: "p-banh-kem-trai-cay", slug: "banh-kem-trai-cay-16cm", name: "Bánh kem trái cây 16cm", description: "Kem tươi, dâu, mâm xôi, việt quất.", category: "cake", status: "pre", priceVnd: 420000, image: "redBoxCake", imagePosition: "center 55%" },
  { id: "p-bong-lan-chanh", slug: "bong-lan-chanh", name: "Bông lan chanh", description: "Cốt mềm, kem chanh thơm mát.", category: "cake", status: "pre", priceVnd: 55000, image: "lemonCake", imagePosition: "center 65%" },
  { id: "p-cheesecake-viet-quat", slug: "cheesecake-viet-quat", name: "Cheesecake việt quất", description: "Béo mịn, phủ sô-cô-la trắng.", category: "cake", status: "out", priceVnd: 45000, image: "blueberryCheesecake", imagePosition: "center 75%" },
  { id: "p-banh-cuon-kem", slug: "banh-cuon-kem", name: "Bánh cuộn kem", description: "Cốt mềm, kem sữa nhẹ.", category: "cake", status: "ready", priceVnd: 39000, image: "rollCake", imagePosition: "center 55%" },
  { id: "p-cookie-hop-6-vi", slug: "cookie-hop-6-vi", name: "Cookie hộp 6 vị", description: "Sô-cô-la, matcha, hạt dẻ…", category: "cookie", status: "ready", priceVnd: 150000, image: "cookies", imagePosition: "center 55%" },
  { id: "p-combo-croissant-cacao", slug: "combo-croissant-cacao", name: "Croissant & cacao nóng", description: "Croissant bơ vừa ra lò, tách cacao đậm và ly kem tươi rắc bột cacao.", category: "combo", status: "ready", priceVnd: 75000, compareAtVnd: 80000, image: "croissantCocoa", imagePosition: "center 45%" },
  { id: "p-combo-banh-cuon-latte", slug: "combo-banh-cuon-latte", name: "Bánh cuộn & latte đá", description: "Hai lát bánh cuộn kem sữa, vài trái dâu tươi và ly latte đá mát lạnh.", category: "combo", status: "ready", priceVnd: 79000, compareAtVnd: 85000, image: "rollCake", imagePosition: "center 45%" },
  { id: "p-combo-pancake-americano", slug: "combo-pancake-americano", name: "Pancake & americano", description: "Chồng pancake mềm, kem sữa chua và việt quất, cùng ly americano đá.", category: "combo", status: "ready", priceVnd: 85000, compareAtVnd: 94000, image: "pancake", imagePosition: "center 55%" },
];

const L = (m: number) => m + 6000;

export const drinks: Drink[] = [
  { id: "d-cafe-den", name: "Cà phê đen", description: "Đậm vị, hậu đắng nhẹ.", temps: ["hot", "ice"], group: "coffee", priceMVnd: 25000, priceLVnd: L(25000) },
  { id: "d-cafe-sua", name: "Cà phê sữa", description: "Sữa đặc, ngọt dịu.", temps: ["hot", "ice"], group: "coffee", priceMVnd: 29000, priceLVnd: L(29000) },
  { id: "d-bac-xiu", name: "Bạc xỉu", description: "Nhiều sữa, ít cà phê.", temps: ["hot", "ice"], group: "coffee", priceMVnd: 32000, priceLVnd: L(32000) },
  { id: "d-cafe-muoi", name: "Cà phê muối", description: "Lớp kem muối béo, mằn mặn.", temps: ["ice"], group: "coffee", priceMVnd: 35000, priceLVnd: L(35000) },
  { id: "d-cafe-cot-dua", name: "Cà phê cốt dừa", description: "Cốt dừa béo, xay cùng đá.", temps: ["ice"], group: "coffee", priceMVnd: 39000, priceLVnd: L(39000) },
  { id: "d-americano", name: "Americano", description: "Espresso pha loãng, thanh nhẹ.", temps: ["hot", "ice"], group: "coffee", priceMVnd: 39000, priceLVnd: L(39000) },
  { id: "d-latte", name: "Latte", description: "Espresso và sữa tươi.", temps: ["hot", "ice"], group: "coffee", priceMVnd: 45000, priceLVnd: L(45000) },
  { id: "d-cappuccino", name: "Cappuccino", description: "Bọt sữa dày, rắc cacao.", temps: ["hot"], group: "coffee", priceMVnd: 45000, priceLVnd: null },
  { id: "d-tra-dao-cam-sa", name: "Trà đào cam sả", description: "Trà đen, đào ngâm, cam và sả.", temps: ["ice"], group: "tea", priceMVnd: 42000, priceLVnd: L(42000) },
  { id: "d-tra-vai", name: "Trà vải", description: "Thơm vải, chua ngọt nhẹ.", temps: ["ice"], group: "tea", priceMVnd: 39000, priceLVnd: L(39000) },
  { id: "d-tra-oi-hong", name: "Trà ổi hồng", description: "Ổi hồng thơm, vị thanh.", temps: ["ice"], group: "tea", priceMVnd: 39000, priceLVnd: L(39000) },
  { id: "d-tra-chanh-day", name: "Trà chanh dây", description: "Chua thanh, mát lạnh.", temps: ["ice"], group: "tea", priceMVnd: 35000, priceLVnd: L(35000) },
  { id: "d-tra-sen-vang", name: "Trà sen vàng", description: "Trà ô long, hạt sen, kem sữa.", temps: ["ice"], group: "tea", priceMVnd: 45000, priceLVnd: L(45000) },
  { id: "d-tra-nong", name: "Trà nóng – ấm nhỏ", description: "Một ấm nhỏ cho buổi chiều.", temps: ["hot"], group: "tea", priceMVnd: 30000, priceLVnd: null },
  { id: "d-matcha-latte", name: "Matcha latte", description: "Matcha và sữa tươi.", temps: ["hot", "ice"], group: "other", priceMVnd: 49000, priceLVnd: L(49000) },
  { id: "d-cacao-nong-kem", name: "Cacao nóng kem", description: "Cacao đậm, kem tươi đánh bông.", temps: ["hot"], group: "other", priceMVnd: 45000, priceLVnd: null },
  { id: "d-cacao-sua-da", name: "Cacao sữa đá", description: "Đậm cacao, béo nhẹ.", temps: ["ice"], group: "other", priceMVnd: 39000, priceLVnd: L(39000) },
  { id: "d-sua-tuoi", name: "Sữa tươi", description: "Hợp cùng bánh ngọt.", temps: ["hot", "ice"], group: "other", priceMVnd: 29000, priceLVnd: L(29000) },
  { id: "d-nuoc-cam", name: "Nước cam", description: "Vắt khi bạn gọi.", temps: ["ice"], group: "juice", priceMVnd: 39000, priceLVnd: L(39000) },
  { id: "d-sinh-to-dau", name: "Sinh tố dâu", description: "Dâu tươi xay cùng sữa chua.", temps: ["ice"], group: "juice", priceMVnd: 45000, priceLVnd: L(45000) },
];
