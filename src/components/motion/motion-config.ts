/**
 * Cau hinh cuon muot & hieu ung (cam giac lenis.dev) – ap dung cho TOAN BO trang.
 */
export const motionConfig = {
  /**
   * Smooth scroll (Lenis) LUON BAT, ke ca khi he dieu hanh bat "Giam chuyen dong".
   * Windows tat "Animation effects" se bao "reduced motion" cho trinh duyet – truoc day
   * dieu nay lam Lenis tu tat nen tuong nhu "co ma khong chay".
   * Dat true neu muon tat smooth scroll cho nguoi dung bat "Giam chuyen dong".
   */
  smoothScrollRespectsReducedMotion: false,
  /**
   * Hieu ung (chu truot len, anh mo man, parallax, banner tu chuyen, dai chu chay, transition CSS).
   * false = LUON chay, ke ca khi may bat "Giam chuyen dong" (theo yeu cau chu web).
   * Dat true neu muon than thien hon voi nguoi de chong mat: khi do cac hieu ung
   * se tat cho nhung nguoi bat "Giam chuyen dong" (class html.yub-reduced-motion).
   */
  animationsRespectReducedMotion: false,
  /** Do "luot" khi cuon chuot/touchpad: nho hon = muot/dai hon. lenis.dev ~0.1 */
  lerp: 0.11,
  wheelMultiplier: 1,
  /** Dien thoai: false = cuon native (on dinh nhat, nhat la iOS) */
  syncTouch: false,
} as const;

const reduceQuery = "(prefers-reduced-motion: reduce)";

/** He dieu hanh dang bat "Giam chuyen dong"? */
export const osPrefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia(reduceQuery).matches;

/** true neu KHONG chay smooth scroll */
export const smoothScrollDisabled = () => motionConfig.smoothScrollRespectsReducedMotion && osPrefersReducedMotion();

/** Media query cho gsap.matchMedia cua hieu ung trang tri */
export const motionOkQuery = motionConfig.animationsRespectReducedMotion ? "(prefers-reduced-motion: no-preference)" : "all";

/** true neu nen tat hieu ung trang tri (theo cau hinh + he dieu hanh) */
export const animationsReduced = () => motionConfig.animationsRespectReducedMotion && osPrefersReducedMotion();

/** Giu ten cu cho cac file khac dang import */
export const prefersReducedMotion = smoothScrollDisabled;
