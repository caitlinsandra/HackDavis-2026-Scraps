import type {
  CuisineTag,
  IngredientMatchKind,
  Recipe,
  UrgencyLevel,
} from "../components/types";

const API = "https://www.themealdb.com/api/json/v1/1";

type MealDbMealFull = Record<string, string | null>;

export interface PantryItemInput {
  name: string;
  urgency: UrgencyLevel;
}

function normalizeToken(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ");
}

function ingredientFilterVariants(pantryName: string): string[] {
  const n = normalizeToken(pantryName);
  const out: string[] = [];
  const add = (v: string) => {
    const t = v.trim();
    if (t.length >= 2) out.push(t);
  };
  add(n);
  const words = n.split(" ").filter((w) => w.length > 0);
  if (words.length > 1) {
    add(words[words.length - 1]);
    add(words[0]);
  }
  if (n.endsWith("es") && n.length > 4) add(n.slice(0, -2));
  if (n.endsWith("s") && n.length > 3) add(n.slice(0, -1));
  return [...new Set(out)];
}

function pantryLetters(pantryNames: string[]): string[] {
  const letters = new Set<string>();
  for (const name of pantryNames) {
    for (const word of normalizeToken(name).split(" ")) {
      const c = word.charAt(0);
      if (c >= "a" && c <= "z") letters.add(c);
    }
  }
  return [...letters];
}

function pantryMatchesIngredient(
  pantryNames: string[],
  recipeIng: string | null
): string | null {
  if (!recipeIng) return null;
  const r = normalizeToken(recipeIng);
  if (!r) return null;
  for (const p of pantryNames) {
    const pn = normalizeToken(p);
    if (!pn) continue;
    if (r.includes(pn) || pn.includes(r)) return p;
    const rw = r.split(" ");
    const pw = pn.split(" ");
    for (const a of rw) {
      if (a.length < 3) continue;
      for (const b of pw) {
        if (b.length < 3) continue;
        if (a === b || a.includes(b) || b.includes(a)) return p;
      }
    }
  }
  return null;
}

function mealTouchesPantry(
  m: MealDbMealFull,
  pantryNames: string[]
): boolean {
  const title = normalizeToken((m.strMeal as string) ?? "");
  for (const p of pantryNames) {
    for (const t of normalizeToken(p).split(" ").filter((w) => w.length > 2)) {
      if (title.includes(t)) return true;
    }
  }
  for (const r of extractRawIngredientNames(m)) {
    if (pantryMatchesIngredient(pantryNames, r)) return true;
  }
  return false;
}

function mapAreaToCuisine(area: string | null): CuisineTag {
  if (!area) return "American";
  const a = area.toLowerCase();
  if (a.includes("italy") || a.includes("italian")) return "Italian";
  if (a.includes("mexic") || a === "mexican") return "Mexican";
  if (a.includes("india") || a === "indian") return "Indian";
  if (a.includes("american") || a.includes("usa")) return "American";
  if (
    a.includes("china") ||
    a.includes("chinese") ||
    a.includes("japan") ||
    a.includes("japanese") ||
    a.includes("thai") ||
    a.includes("viet") ||
    a.includes("korea") ||
    a.includes("asian")
  )
    return "Asian";
  if (
    a.includes("greek") ||
    a.includes("turkish") ||
    a.includes("morocco") ||
    a.includes("spanish") ||
    a.includes("french") ||
    a.includes("tunisia") ||
    a.includes("egypt") ||
    a.includes("mediterranean")
  )
    return "Mediterranean";
  return "American";
}

function categoryEmoji(category: string | null): string {
  if (!category) return "🍽️";
  const c = category.toLowerCase();
  if (c.includes("chicken")) return "🍗";
  if (c.includes("beef")) return "🥩";
  if (c.includes("pork")) return "🥓";
  if (c.includes("seafood") || c.includes("fish")) return "🐟";
  if (c.includes("dessert") || c.includes("sweet")) return "🍰";
  if (c.includes("pasta")) return "🍝";
  if (c.includes("vegetarian") || c.includes("vegan")) return "🥗";
  if (c.includes("breakfast")) return "🍳";
  if (c.includes("side")) return "🥘";
  return "🍽️";
}

function parseSteps(instructions: string | null): string[] {
  if (!instructions) return ["No written steps in TheMealDB for this meal."];
  const chunks = instructions
    .split(/\r?\n+/)
    .map((s) => s.replace(/^\d+[\).\s]+/, "").trim())
    .filter((s) => s.length > 0);
  return chunks.length > 0 ? chunks : [instructions.trim()];
}

function stableMinutesFromId(id: string): { minutes: number; label: string } {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const span = 10 + (h % 41);
  return { minutes: span, label: `${span} min` };
}

function stableDifficulty(id: string): Recipe["difficulty"] {
  const n = Number(id) || 0;
  const m = n % 3;
  if (m === 0) return "Easy";
  if (m === 1) return "Medium";
  return "Hard";
}

function computeIngredientMatch(
  recipeCount: number,
  matchedCount: number
): IngredientMatchKind {
  const missing = recipeCount - matchedCount;
  if (missing <= 0) return "pantry_only";
  if (missing === 1) return "missing_1";
  if (missing === 2) return "missing_2";
  if (missing === 3) return "missing_3";
  return "missing_4_plus";
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`TheMealDB ${res.status}`);
  return res.json() as Promise<T>;
}

type FilterResponse = { meals: { idMeal: string; strMeal: string }[] | null };

async function filterByIngredient(
  ingredientQuery: string
): Promise<{ idMeal: string; strMeal: string }[]> {
  const data = await fetchJson<FilterResponse>(
    `${API}/filter.php?i=${encodeURIComponent(ingredientQuery)}`
  );
  return data.meals ?? [];
}

type SearchResponse = { meals: MealDbMealFull[] | null };

async function searchByFirstLetter(letter: string): Promise<MealDbMealFull[]> {
  const data = await fetchJson<SearchResponse>(
    `${API}/search.php?f=${encodeURIComponent(letter)}`
  );
  return data.meals ?? [];
}

type LookupResponse = { meals: MealDbMealFull[] | null };

async function lookupMeal(id: string): Promise<MealDbMealFull | null> {
  const data = await fetchJson<LookupResponse>(
    `${API}/lookup.php?i=${encodeURIComponent(id)}`
  );
  return data.meals?.[0] ?? null;
}

function extractRecipeIngredients(m: MealDbMealFull): string[] {
  const list: string[] = [];
  for (let i = 1; i <= 20; i++) {
    const ing = m[`strIngredient${i}` as keyof MealDbMealFull] as
      | string
      | null;
    const measure = m[`strMeasure${i}` as keyof MealDbMealFull] as
      | string
      | null;
    if (!ing || !String(ing).trim()) continue;
    const line = [measure?.trim(), ing.trim()].filter(Boolean).join(" ");
    list.push(line || ing.trim());
  }
  return list;
}

function extractRawIngredientNames(m: MealDbMealFull): string[] {
  const list: string[] = [];
  for (let i = 1; i <= 20; i++) {
    const ing = m[`strIngredient${i}` as keyof MealDbMealFull] as
      | string
      | null;
    if (ing && ing.trim()) list.push(ing.trim());
  }
  return list;
}

function mealToRecipe(
  m: MealDbMealFull,
  pantryNames: string[],
  expiringNames: Set<string>,
  source: "filter" | "search"
): Recipe | null {
  const id = m.idMeal as string | null;
  if (!id) return null;

  const rawNames = extractRawIngredientNames(m);
  const allIngredients = extractRecipeIngredients(m);
  if (allIngredients.length === 0) return null;

  const matchedPantry = new Set<string>();
  for (const rname of rawNames) {
    const hit = pantryMatchesIngredient(pantryNames, rname);
    if (hit) matchedPantry.add(hit);
  }

  if (matchedPantry.size === 0 && source === "search") {
    if (!mealTouchesPantry(m, pantryNames)) return null;
  }

  const expiringIngredients = [...matchedPantry].filter((n) =>
    expiringNames.has(n)
  );

  const recipeCount = rawNames.length;
  const matchedCount = matchedPantry.size;
  const ingredientMatch = computeIngredientMatch(recipeCount, matchedCount);

  const { minutes, label } = stableMinutesFromId(id);
  const usesSources = [...matchedPantry].map((ingredientLabel) => ({
    ingredientLabel,
    source: "yours" as const,
  }));

  const savingsEstimate = Math.min(
    25,
    Math.max(3, expiringIngredients.length * 4 + matchedPantry.size * 2)
  );

  const area = (m.strArea as string | null) ?? null;

  return {
    id,
    name: (m.strMeal as string) || "Recipe",
    emoji: categoryEmoji((m.strCategory as string | null) ?? null),
    cookTime: label,
    cookTimeMinutes: minutes,
    difficulty: stableDifficulty(id),
    expiringIngredients,
    allIngredients,
    savingsEstimate,
    dietaryTags: [],
    cuisine: mapAreaToCuisine(area),
    ingredientMatch,
    usesSources,
    steps: parseSteps((m.strInstructions as string | null) ?? null),
  };
}

/**
 * Loads recipes from TheMealDB using:
 * - `filter.php?i=` for each pantry line (best ingredient match)
 * - `search.php?f=` for first letters of pantry words (dataset browse you asked for),
 *   keeping only meals that still match the pantry by title or ingredients.
 */
export async function fetchRecipesForPantry(
  pantry: PantryItemInput[]
): Promise<Recipe[]> {
  const pantryNames = pantry.map((p) => p.name).filter((n) => n.trim());
  const expiringNames = new Set(
    pantry.filter((p) => p.urgency !== "green").map((p) => p.name)
  );

  if (pantryNames.length === 0) return [];

  const fromFilter = new Set<string>();

  for (const name of pantryNames) {
    for (const variant of ingredientFilterVariants(name)) {
      try {
        const meals = await filterByIngredient(variant);
        for (const row of meals.slice(0, 14)) {
          fromFilter.add(row.idMeal);
        }
      } catch {
        continue;
      }
    }
  }

  const mealById = new Map<string, MealDbMealFull>();

  const filterIds = [...fromFilter];
  const batchSize = 8;
  for (let i = 0; i < filterIds.length; i += batchSize) {
    const chunk = filterIds.slice(i, i + batchSize);
    const rows = await Promise.all(chunk.map((id) => lookupMeal(id)));
    for (let j = 0; j < chunk.length; j++) {
      const row = rows[j];
      if (row) mealById.set(chunk[j], row);
    }
  }

  const letters = pantryLetters(pantryNames).slice(0, 10);
  for (const letter of letters) {
    try {
      const meals = await searchByFirstLetter(letter);
      for (const m of meals) {
        const id = m.idMeal as string | null;
        if (!id || mealById.has(id)) continue;
        if (!mealTouchesPantry(m, pantryNames)) continue;
        mealById.set(id, m);
        if (mealById.size >= 45) break;
      }
    } catch {
      continue;
    }
    if (mealById.size >= 45) break;
  }

  const recipes: Recipe[] = [];
  for (const [id, m] of mealById) {
    const source = fromFilter.has(id) ? "filter" : "search";
    const r = mealToRecipe(m, pantryNames, expiringNames, source);
    if (r) recipes.push(r);
  }

  recipes.sort((a, b) => {
    const fa = fromFilter.has(a.id) ? 1 : 0;
    const fb = fromFilter.has(b.id) ? 1 : 0;
    if (fa !== fb) return fb - fa;
    const ex = b.expiringIngredients.length - a.expiringIngredients.length;
    if (ex !== 0) return ex;
    const ma =
      a.allIngredients.length -
      (a.ingredientMatch === "pantry_only"
        ? 0
        : a.ingredientMatch === "missing_1"
          ? 1
          : a.ingredientMatch === "missing_2"
            ? 2
            : a.ingredientMatch === "missing_3"
              ? 3
              : 4);
    const mb =
      b.allIngredients.length -
      (b.ingredientMatch === "pantry_only"
        ? 0
        : b.ingredientMatch === "missing_1"
          ? 1
          : b.ingredientMatch === "missing_2"
            ? 2
            : b.ingredientMatch === "missing_3"
              ? 3
              : 4);
    return mb - ma;
  });

  return recipes.slice(0, 28);
}
