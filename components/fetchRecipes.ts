import type { Ingredient, Recipe } from "./types";

export async function fetchRecipesByIngredients(
  ingredients: Ingredient[]
): Promise<Recipe[]> {
  try {
    const res = await fetch("/api/recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ingredients: ingredients.map((i) => ({
          name: i.name,
          urgency: i.urgency,
        })),
      }),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as unknown;
    if (!Array.isArray(data)) return [];
    return data as Recipe[];
  } catch {
    return [];
  }
}
