/**
 * Anh dung tren trang Cau chuyen – kem kich thuoc goc de hien thi DUNG TI LE (khong cat).
 * Anh trong /images/story la anh tham khao nguoi dung cung cap: thay bang anh chup that
 * cua tiem truoc khi cong bo (giu ten file, cap nhat width/height neu ti le khac).
 */
export interface StoryPhoto {
  src: string;
  width: number;
  height: number;
  alt: string;
}

export const storyPhotos = {
  rollLatte: { src: "/images/story/roll-latte.jpg", width: 735, height: 979, alt: "Hai lát bánh cuộn kem, dâu tây và ly latte đá trên đĩa trắng" },
  swirlBreakfast: { src: "/images/story/swirl-breakfast.jpg", width: 736, height: 981, alt: "Bánh cuộn xoắn, ổi hồng, trứng lòng đào và ly cà phê sữa" },
  peachToast: { src: "/images/story/peach-toast.jpg", width: 1050, height: 1400, alt: "Lát bánh mì phết kem, đào vàng xếp lớp với lá húng quế, bên ly cà phê sữa đá" },
  bagelBlueberry: { src: "/images/story/bagel-blueberry.jpg", width: 736, height: 981, alt: "Bánh vòng phết kem phô mai với việt quất, bên tách cà phê" },
  matchaBagel: { src: "/images/story/matcha-bagel.jpg", width: 840, height: 1400, alt: "Bánh vòng phết kem matcha bên tách cà phê đen" },
  canele: { src: "/images/story/canele-financier.jpg", width: 1080, height: 1080, alt: "Bánh canelé và financier trên đĩa sứ viền xanh" },
  rawCroissants: { src: "/images/story/raw-croissants.jpg", width: 900, height: 1200, alt: "Những chiếc croissant đã cuộn, đang ủ chờ nướng" },
  croissantTray: { src: "/images/story/croissant-tray.jpg", width: 736, height: 920, alt: "Khay croissant vàng giòn được mang ra quầy" },
  shapingHands: { src: "/images/story/shaping-hands.jpg", width: 1048, height: 1200, alt: "Đôi tay cuộn bột tạo hình croissant" },
  eggTartsOven: { src: "/images/story/egg-tarts-oven.jpg", width: 736, height: 981, alt: "Mẻ tart trứng vàng óng trong lò nướng" },
  painChocolat: { src: "/images/story/pain-chocolat.jpg", width: 1200, height: 1365, alt: "Bánh sừng bò sô-cô-la nhiều lớp được gắp bằng kẹp" },
  cubeStack: { src: "/images/products/cube-stack.jpg", width: 867, height: 1300, alt: "Bánh ngàn lớp xếp chồng, lộ rõ các lớp bơ" },
  crossSection: { src: "/images/products/cross-section.jpg", width: 736, height: 1104, alt: "Bốn lát croissant cắt đôi xếp chồng, thấy rõ từng lớp" },
  choco: { src: "/images/products/choco.jpg", width: 971, height: 1300, alt: "Croissant sô-cô-la vừa ra lò, nhân sô-cô-la chảy" },
  redBoxCake: { src: "/images/products/red-box-cake.jpg", width: 1034, height: 1300, alt: "Bánh kem trái cây đặt trong hộp quà màu đỏ" },
  croissantCoffee: { src: "/images/products/croissant-coffee.jpg", width: 731, height: 1300, alt: "Khay croissant nhiều vị bên ly cà phê" },
} satisfies Record<string, StoryPhoto>;
