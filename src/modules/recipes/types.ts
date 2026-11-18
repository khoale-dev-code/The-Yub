export type RecipeKind = "banh" | "do-uong";
export type RecipeFields = { batch: string; ingredients: string; steps: string; notes: string };
export type Recipe = RecipeFields & { revision: string };

export const recipeHome = "/admin/cong-thuc";
export const recipeListUrl = (kind: RecipeKind) => kind === "banh" ? recipeHome : `${recipeHome}?loai=do-uong`;
export const recipeUrl = (kind: RecipeKind, id: string) => `${recipeHome}/${kind}/${encodeURIComponent(id)}`;
export const isRecipeKind = (value: string): value is RecipeKind => value === "banh" || value === "do-uong";
export const recipeLimits = { batch: 100, ingredients: 8000, steps: 16000, notes: 4000 } as const;
