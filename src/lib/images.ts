/**
 * Anh san pham dang dung tam (anh tham khao da duyet tren canvas).
 * Thay bang anh chup that cua tiem truoc khi ra mat – chi can doi file
 * trong public/images/products, giu nguyen ten.
 */
export const productImages = {
  cubeStack: "/images/products/cube-stack.jpg",
  crossSection: "/images/products/cross-section.jpg",
  choco: "/images/products/choco.jpg",
  raspberry: "/images/products/raspberry.jpg",
  tartRack: "/images/products/tart-rack.jpg",
  fourDesserts: "/images/products/four-desserts.jpg",
  fruitEggTarts: "/images/products/fruit-egg-tarts.jpg",
  eggTarts: "/images/products/egg-tarts.jpg",
  croissantCoffee: "/images/products/croissant-coffee.jpg",
  cookies: "/images/products/cookies.jpg",
  tartBox: "/images/products/tart-box.jpg",
  berryTartBox: "/images/products/berry-tart-box.jpg",
  redBoxCake: "/images/products/red-box-cake.jpg",
  strawberryCake: "/images/products/strawberry-cake.jpg",
  lemonCake: "/images/products/lemon-cake.jpg",
  blueberryCheesecake: "/images/products/blueberry-cheesecake.jpg",
  croissantCocoa: "/images/products/croissant-cocoa.jpg",
  rollCake: "/images/products/roll-cake.jpg",
  pancake: "/images/products/pancake.jpg",
} as const;

export type ProductImageKey = keyof typeof productImages;

export const brandImages = {
  logoMaroon: "/images/brand/logo-maroon.png",
  logoCream: "/images/brand/logo-cream.png",
  /** Kich thuoc goc logo (dung cho next/image) */
  logoWidth: 837,
  logoHeight: 447,
} as const;
