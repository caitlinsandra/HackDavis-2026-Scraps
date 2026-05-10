import type {
  CuisineTag,
  DietaryTag,
  IngredientMatchKind,
  Recipe,
  RecipeUsesSource,
  UrgencyLevel,
} from "@/components/types";

const BASE = "https://www.themealdb.com/api/json/v1/1";

/** Raw meal row from list or lookup responses. */
export type MealDbRaw = Record<string, string | null | undefined>;

export async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`TheMealDB ${res.status}`);
  return res.json() as Promise<T>;
}

export function extractIngredients(meal: MealDbRaw): string[] {
  const out: string[] = [];
  for (let i = 1; i <= 20; i++) {
    const ingredientRaw = meal[`strIngredient${i}`];
    const measureRaw = meal[`strMeasure${i}`];
    const ingredient =
      typeof ingredientRaw === "string" ? ingredientRaw.trim() : "";
    const measure = typeof measureRaw === "string" ? measureRaw.trim() : "";
    if (!ingredient) continue;
    out.push([measure, ingredient].filter(Boolean).join(" ").trim());
  }
  return out;
}

export function ingredientLinesMatch(
  pantryName: string,
  recipeLine: string
): boolean {
  const p = pantryName.toLowerCase().trim();
  const r = recipeLine.toLowerCase().trim();
  if (!p || !r) return false;
  if (r === p) return true;
  if (r.includes(p) || p.includes(r)) return true;
  const pWords = p.split(/\s+/).filter((w) => w.length > 2);
  const rWords = r.split(/\s+/).filter((w) => w.length > 2);
  return pWords.some((pw) =>
    rWords.some((rw) => rw.includes(pw) || pw.includes(rw))
  );
}

export type PantryLite = {
  name: string;
  urgency: UrgencyLevel;
  daysLeft: number;
};

function mapAreaToCuisine(area: string | undefined): CuisineTag {
  const a = (area ?? "").toLowerCase();
  if (a.includes("italy") || a.includes("italian")) return "Italian";
  if (a.includes("mexic")) return "Mexican";
  if (a.includes("chinese") || a.includes("thai") || a.includes("japan"))
    return "Asian";
  if (a.includes("india") || a.includes("pakistan")) return "Indian";
  if (a.includes("greece") || a.includes("turkey") || a.includes("lebanon"))
    return "Mediterranean";
  return "American";
}

function stepsFromInstructions(text: string | undefined): string[] {
  if (!text?.trim()) return ["Open the recipe source for full steps."];
  const sanitizeStep = (raw: string): string => {
    return raw
      .replace(/^\s*(?:step\s*)?\d+\s*[:.)-]?\s*/i, "")
      .trim();
  };

  const lines = text
    .split(/\r?\n+/)
    .map((s) => sanitizeStep(s))
    .filter((s) => s.length > 0 && !/^step\s*\d*$/i.test(s));
  if (lines.length > 1) return lines;
  const byPeriod = text
    .split(/\.\s+/)
    .map((s) => sanitizeStep(s))
    .filter((s) => s.length > 0 && !/^step\s*\d*$/i.test(s));
  return byPeriod.length > 1
    ? byPeriod.map((s) => (s.endsWith(".") ? s : `${s}.`))
    : [sanitizeStep(text)];
}

function computeMatch(
  pantry: PantryLite[],
  allIngs: string[]
): {
  matchedCount: number;
  missingApprox: number;
  expiringDisplay: string[];
  usesSources: RecipeUsesSource[];
  ingredientMatch: IngredientMatchKind;
} {
  const matchedRecipeLines = new Set<string>();
  const expiringDisplay: string[] = [];
  const usesSources: RecipeUsesSource[] = [];

  for (const p of pantry) {
    const line = allIngs.find((r) => ingredientLinesMatch(p.name, r));
    if (line) {
      matchedRecipeLines.add(line);
      usesSources.push({
        ingredientLabel: line,
        source: "yours",
      });
      if (p.urgency !== "green") {
        expiringDisplay.push(line);
      }
    }
  }

  const matchedCount = matchedRecipeLines.size;
  const missingApprox = Math.max(0, allIngs.length - matchedCount);

  let ingredientMatch: IngredientMatchKind = "missing_4_plus";
  if (missingApprox <= 0 && allIngs.length > 0) ingredientMatch = "pantry_only";
  else if (missingApprox === 1) ingredientMatch = "missing_1";
  else if (missingApprox === 2) ingredientMatch = "missing_2";
  else if (missingApprox === 3) ingredientMatch = "missing_3";
  else if (missingApprox >= 4) ingredientMatch = "missing_4_plus";

  return {
    matchedCount,
    missingApprox,
    expiringDisplay,
    usesSources,
    ingredientMatch,
  };
}

export function mealToRecipe(meal: MealDbRaw, pantry: PantryLite[]): Recipe {
  const id = String(meal.idMeal ?? "");
  const name = String(meal.strMeal ?? "Recipe");
  const allIngredients = extractIngredients(meal);
  const {
    matchedCount,
    expiringDisplay,
    usesSources,
    ingredientMatch,
  } = computeMatch(pantry, allIngredients);

  const savingsEstimate = Math.min(
    35,
    Math.max(3, 4 + matchedCount * 3 + Math.min(8, expiringDisplay.length * 2))
  );

  const dietaryTags: DietaryTag[] = [];
  const cat = (meal.strCategory ?? "").toLowerCase();
  if (cat.includes("vegetarian") && !cat.includes("vegan")) {
    dietaryTags.push("Vegetarian");
  }
  if (cat.includes("vegan")) dietaryTags.push("Vegan");

  const steps = stepsFromInstructions(
    typeof meal.strInstructions === "string" ? meal.strInstructions : ""
  );

  const thumb =
    typeof meal.strMealThumb === "string" ? meal.strMealThumb : undefined;

  return {
    id: `mdb-${id}`,
    name,
    emoji: "🍽️",
    cookTime: "30 min",
    cookTimeMinutes: 30,
    difficulty: steps.length > 8 ? "Medium" : "Easy",
    expiringIngredients: expiringDisplay,
    allIngredients,
    savingsEstimate,
    dietaryTags,
    cuisine: mapAreaToCuisine(
      typeof meal.strArea === "string" ? meal.strArea : undefined
    ),
    ingredientMatch,
    usesSources,
    wasteSavings: expiringDisplay.length > 0 ? savingsEstimate : undefined,
    steps,
    imageUrl: thumb,
  };
}

/** Ingredient names to try with filter.php?i= */
export function ingredientFilterQueries(name: string): string[] {
  const t = name.trim();
  if (!t) return [];
  const parts = t.split(/\s+/).filter(Boolean);
  const q = new Set<string>();
  q.add(t);
  if (parts.length > 1) q.add(parts[parts.length - 1]);
  if (parts.length > 2) q.add(parts.slice(-2).join(" "));
  return [...q];
}

export type SearchByLetterResponse = { meals: MealDbRaw[] | null };

export async function searchByLetter(letter: string): Promise<MealDbRaw[]> {
  const L = letter.toLowerCase().slice(0, 1);
  if (!/[a-z]/.test(L)) return [];
  const data = await fetchJson<SearchByLetterResponse>(
    `${BASE}/search.php?f=${encodeURIComponent(L)}`
  );
  return data.meals ?? [];
}

export type FilterResponse = { meals: { idMeal: string }[] | null };

export async function filterByIngredient(
  ingredient: string
): Promise<string[]> {
  const q = ingredient.trim();
  if (!q) return [];
  const data = await fetchJson<FilterResponse>(
    `${BASE}/filter.php?i=${encodeURIComponent(q)}`
  );
  return (data.meals ?? []).map((m) => m.idMeal);
}

export type LookupResponse = { meals: MealDbRaw[] | null };

export async function lookupMeal(id: string): Promise<MealDbRaw | null> {
  const data = await fetchJson<LookupResponse>(
    `${BASE}/lookup.php?i=${encodeURIComponent(id)}`
  );
  const m = data.meals?.[0];
  return m ?? null;
}
