import { NextResponse } from "next/server";
import type { Ingredient, Recipe } from "@/components/types";
import {
  filterByIngredient,
  ingredientFilterQueries,
  lookupMeal,
  mealToRecipe,
  searchByLetter,
  type PantryLite,
} from "@/lib/themealdb/mapMeal";

export const runtime = "nodejs";

const MAX_LOOKUPS = 40;
const MAX_FILTER_QUERIES = 14;

/** Build recipe list from TheMealDB: baseline `search.php?f=a` plus meals that use pantry ingredients. */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const ingredients = (body.ingredients ?? []) as Pick<
      Ingredient,
      "name" | "urgency" | "daysLeft"
    >[];

    const pantry: PantryLite[] = ingredients.map((i) => ({
      name: i.name,
      urgency: i.urgency,
      daysLeft: i.daysLeft,
    }));

    const idSet = new Set<string>();

    const letterMeals = await searchByLetter("a");
    for (const m of letterMeals) {
      const id = m.idMeal;
      if (id) idSet.add(String(id));
    }

    const tried = new Set<string>();
    for (const p of pantry) {
      for (const q of ingredientFilterQueries(p.name)) {
        if (tried.size >= MAX_FILTER_QUERIES) break;
        const key = q.toLowerCase();
        if (tried.has(key)) continue;
        tried.add(key);
        try {
          const ids = await filterByIngredient(q);
          for (const id of ids) idSet.add(id);
        } catch {
          /* unknown ingredient name in API */
        }
      }
    }

    const ids = [...idSet].slice(0, MAX_LOOKUPS + 20);
    const meals: NonNullable<Awaited<ReturnType<typeof lookupMeal>>>[] = [];
    for (const id of ids) {
      if (meals.length >= MAX_LOOKUPS) break;
      const m = await lookupMeal(id);
      if (m) meals.push(m);
    }

    let recipes: Recipe[] = meals.map((m) => mealToRecipe(m, pantry));

    const hasPantry = pantry.length > 0;
    if (hasPantry) {
      const withMatch = recipes.filter(
        (r) => (r.usesSources?.filter((u) => u.source === "yours").length ?? 0) > 0
      );
      if (withMatch.length > 0) recipes = withMatch;
    }

    recipes.sort((a, b) => {
      const ma =
        a.usesSources?.filter((u) => u.source === "yours").length ?? 0;
      const mb =
        b.usesSources?.filter((u) => u.source === "yours").length ?? 0;
      if (mb !== ma) return mb - ma;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({ recipes });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to load recipes", recipes: [] as Recipe[] },
      { status: 500 }
    );
  }
}
