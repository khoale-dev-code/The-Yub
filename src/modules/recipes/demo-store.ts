import type { Recipe } from "./types";

export function demoRecipes() {
  const scope = globalThis as typeof globalThis & { __yubRecipes?: Map<string, Recipe> };
  return scope.__yubRecipes ??= new Map();
}
