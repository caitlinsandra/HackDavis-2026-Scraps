"use client";
import React, { useEffect, useMemo, useState } from "react";
import type {
  CuisineTag,
  DietaryTag,
  FriendPost,
  Ingredient,
  IngredientMatchKind,
  Recipe,
} from "./types";
import { pressDark, pressOutline } from "./pressableStyles";
import { findUseSource, isExpiringIngredient } from "./recipeIngredientMeta";
import { mockFriendPosts } from "./mockData";

interface RecipesProps {
  pantryIngredients: Ingredient[];
  onMealsCookedChange?: (delta: number) => void;
  onRecipeCookToggle?: (recipe: Recipe, nowCooked: boolean) => void;
  onRequestIngredient?: (friendName: string, ingredientLabel: string) => void;
}

const cardTints = [
  "bg-stone-100",
  "bg-amber-50",
  "bg-orange-50",
  "bg-stone-50",
];

const DIETARY_OPTIONS: DietaryTag[] = [
  "Vegetarian",
  "Vegan",
  "High Protein",
  "Gluten Free",
  "Dairy Free",
];

const TIME_OPTIONS = [
  { id: "under15" as const, label: "Under 15 min", maxMin: 15 },
  { id: "under30" as const, label: "Under 30 min", maxMin: 30 },
  { id: "under60" as const, label: "Under 1 hour", maxMin: 60 },
];

const CUISINE_OPTIONS: CuisineTag[] = [
  "Italian",
  "Mexican",
  "Asian",
  "American",
  "Mediterranean",
  "Indian",
];

const DIFFICULTY_OPTIONS: Recipe["difficulty"][] = ["Easy", "Medium", "Hard"];

const MATCH_OPTIONS: {
  id: IngredientMatchKind;
  label: string;
}[] = [
  { id: "pantry_only", label: "Uses only pantry items" },
  { id: "missing_1", label: "Missing 1 ingredient" },
  { id: "missing_2", label: "Missing 2 ingredients" },
  { id: "missing_3", label: "Missing 3 ingredients" },
  { id: "missing_4_plus", label: "Missing 4+ ingredients" },
];


function RecipeDetailSheet({
  recipe,
  onClose,
  onRequestIngredient,
}: {
  recipe: Recipe;
  onClose: () => void;
  onRequestIngredient?: (friendName: string, ingredientLabel: string) => void;
}) {
  const [requested, setRequested] = useState<Set<string>>(new Set());

  const wasteAmt = recipe.wasteSavings ?? recipe.savingsEstimate;

  const toggleRequest = (friendName: string, ingredientLabel: string) => {
    const key = `${recipe.id}-${friendName}-${ingredientLabel}`;
    let becameRequested = false;
    setRequested((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else {
        next.add(key);
        becameRequested = true;
      }
      return next;
    });
    if (becameRequested) {
      onRequestIngredient?.(friendName, ingredientLabel);
    }
  };

  return (
    <div className="fixed inset-0 z-[125] flex items-end justify-center bg-stone-900/40">
      <button
        type="button"
        aria-label="Close recipe"
        className="absolute inset-0 z-0"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-sm bg-white rounded-t-[28px] shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-stone-100 flex-shrink-0">
          <h2 className="font-display text-[22px] text-stone-900 leading-tight pr-4">
            {recipe.name}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={`text-[13px] font-semibold text-stone-900 ${pressOutline} rounded-lg px-3 py-1.5 flex-shrink-0`}
          >
            Done
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5 pb-8 flex flex-col gap-6">
          {recipe.imageUrl ? (
            <div className="rounded-2xl overflow-hidden border border-stone-100 -mt-1">
              <img
                src={recipe.imageUrl}
                alt=""
                className="w-full aspect-[16/10] object-cover"
              />
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <span className="text-6xl">{recipe.emoji}</span>
              <div className="text-[12px] text-stone-500 flex flex-wrap gap-x-2 gap-y-1">
                <span>{recipe.cookTime}</span>
                <span>·</span>
                <span>{recipe.difficulty}</span>
                <span>·</span>
                <span className="tabular-nums">Saves ~${recipe.savingsEstimate}</span>
              </div>
            </div>
          )}
          {recipe.imageUrl && (
            <div className="text-[12px] text-stone-500 flex flex-wrap gap-x-2 gap-y-1 -mt-2">
              <span>{recipe.cookTime}</span>
              <span>·</span>
              <span>{recipe.difficulty}</span>
              <span>·</span>
              <span className="tabular-nums">Saves ~${recipe.savingsEstimate}</span>
            </div>
          )}

          <section>
            <h3 className="text-[11px] uppercase tracking-[0.12em] text-stone-400 font-medium mb-3">
              Ingredients
            </h3>
            <ul className="flex flex-col gap-3">
              {recipe.allIngredients.map((ing, ingIdx) => {
                const exp = isExpiringIngredient(recipe, ing);
                const src = findUseSource(recipe, ing);
                const rk =
                  src?.source === "friend" && src.friendName
                    ? `${recipe.id}-${src.friendName}-${ing}`
                    : null;
                const didRequest = rk ? requested.has(rk) : false;

                return (
                  <li
                    key={`${recipe.id}-detail-ing-${ingIdx}-${ing}`}
                  
                    className="border border-stone-100 rounded-xl px-3 py-2.5 bg-stone-50/50"
                  >
                    <div className="flex items-start gap-2">
                      {exp && (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                      )}
                      {!exp && (
                        <span className="w-1.5 h-1.5 rounded-full bg-stone-300 mt-1.5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-medium text-stone-900">
                          {ing}
                        </p>
                        {src?.source === "yours" && (
                          <p className="text-[11px] text-emerald-700 mt-0.5">
                            In your pantry
                          </p>
                        )}
                        {src?.source === "friend" && src.friendName && (
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <p className="text-[11px] text-stone-600">
                              {src.friendName} may have this, coordinate on
                              Friends.
                            </p>
                            <button
                              type="button"
                              onClick={() =>
                                toggleRequest(src.friendName!, ing)
                              }
                              className={`text-[11px] font-semibold px-3 py-1 rounded-full border ${
                                didRequest
                                  ? `bg-stone-100 text-stone-600 border-stone-300 ${pressOutline}`
                                  : `bg-stone-900 text-white border-stone-900 ${pressDark}`
                              }`}
                            >
                              {didRequest ? "Requested" : "Request"}
                            </button>
                          </div>
                        )}
                        {!src && exp && (
                          <p className="text-[11px] text-red-600 mt-0.5">
                            Expiring soon, using this saves waste.
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            {(recipe.usesSources?.length ?? 0) > 0 && (
              <p className="text-[12px] text-stone-600 mt-4 leading-relaxed">
                This recipe pulls from your pantry and friends’ surplus, about{" "}
                <span className="font-semibold text-stone-900 tabular-nums">
                  ${wasteAmt}
                </span>{" "}
                saved from waste when you cook it tonight.
              </p>
            )}
          </section>

          <section>
            <h3 className="text-[11px] uppercase tracking-[0.12em] text-stone-400 font-medium mb-3">
              Steps
            </h3>
            <ol className="flex flex-col gap-3 list-decimal list-inside marker:text-stone-400">
              {recipe.steps.map((step, i) => (
                <li
                  key={i}
                  className="text-[13px] text-stone-800 leading-relaxed pl-1"
                >
                  {step}
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}

function recipePassesFilters(
  r: Recipe,
  dietary: Set<DietaryTag>,
  timeId: string | null,
  difficulty: Recipe["difficulty"] | null,
  cuisine: CuisineTag | null,
  match: IngredientMatchKind | null,
  favoritesOnly: boolean,
  favoriteIds: Set<string>
): boolean {
  if (favoritesOnly && !favoriteIds.has(r.id)) return false;
  if (dietary.size > 0) {
    const ok = r.dietaryTags.some((t) => dietary.has(t));
    if (!ok) return false;
  }
  if (timeId) {
    const opt = TIME_OPTIONS.find((o) => o.id === timeId);
    if (opt && r.cookTimeMinutes > opt.maxMin) return false;
  }
  if (difficulty !== null && r.difficulty !== difficulty) return false;
  if (cuisine !== null && r.cuisine !== cuisine) return false;
  if (match !== null && r.ingredientMatch !== match) return false;
  return true;
}

function pantryCoverageScore(r: Recipe): number {
  return r.usesSources?.filter((u) => u.source === "yours").length ?? 0;
}

function missingItemsCount(match: IngredientMatchKind): number {
  if (match === "pantry_only") return 0;
  if (match === "missing_1") return 1;
  if (match === "missing_2") return 2;
  if (match === "missing_3") return 3;
  return 4;
}

function matchesIngredientLabel(a: string, b: string): boolean {
  const left = a.toLowerCase().trim();
  const right = b.toLowerCase().trim();
  if (!left || !right) return false;
  return (
    left.includes(right) ||
    right.includes(left) ||
    left.split(/\s+/).some((w) => w.length > 2 && right.includes(w))
  );
}

function attachFriendSources(recipes: Recipe[], posts: FriendPost[]): Recipe[] {
  return recipes.map((recipe) => {
    const uses = [...(recipe.usesSources ?? [])];
    for (const post of posts) {
      if (post.daysLeft > 2) continue;
      const hit = recipe.allIngredients.find((line) =>
        matchesIngredientLabel(line, post.ingredientName)
      );
      if (!hit) continue;
      const alreadyHas = uses.some(
        (u) => u.source === "friend" && matchesIngredientLabel(u.ingredientLabel, hit)
      );
      if (!alreadyHas) {
        uses.push({
          ingredientLabel: hit,
          source: "friend",
          friendName: post.friendName.split(" ")[0],
        });
      }
    }
    return uses.length > 0 ? { ...recipe, usesSources: uses } : recipe;
  });
}

export default function Recipes({
  pantryIngredients = [],
  onMealsCookedChange,
  onRecipeCookToggle,
  onRequestIngredient,
}: RecipesProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [filterOpen, setFilterOpen] = useState(false);
  const [dietary, setDietary] = useState<Set<DietaryTag>>(new Set());
  const [timeId, setTimeId] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Recipe["difficulty"] | null>(
    null
  );
  const [cuisine, setCuisine] = useState<CuisineTag | null>(null);
  const [match, setMatch] = useState<IngredientMatchKind | null>(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [detailRecipe, setDetailRecipe] = useState<Recipe | null>(null);

  const [cooked, setCooked] = useState<Set<string>>(new Set());
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const [visibleCount, setVisibleCount] = useState(6);

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setFetchError(null);
    fetch("/api/themealdb/recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingredients: pantryIngredients }),
      signal: ac.signal,
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error ?? "Could not load recipes");
        }
        setRecipes(attachFriendSources(data.recipes ?? [], mockFriendPosts));
      })
      .catch((e: Error) => {
        if (e.name === "AbortError") return;
        setFetchError(e.message ?? "Could not load recipes");
        setRecipes([]);
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });
    return () => ac.abort();
    // Intentionally load once per page session; tab switches should not re-fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeFilterCount = useMemo(() => {
    let n = dietary.size;
    if (timeId) n += 1;
    if (difficulty !== null) n += 1;
    if (cuisine !== null) n += 1;
    if (match !== null) n += 1;
    if (favoritesOnly) n += 1;
    return n;
  }, [dietary, timeId, difficulty, cuisine, match, favoritesOnly]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
  
    return recipes
      .filter((r) =>
        recipePassesFilters(
          r,
          dietary,
          timeId,
          difficulty,
          cuisine,
          match,
          favoritesOnly,
          favorites
        )
      )
      .filter(
        (r) =>
          !q ||
          r.name.toLowerCase().includes(q) ||
          r.allIngredients.some((ing) =>
            ing.toLowerCase().includes(q)
          )
      )
      .sort((a, b) => {
        const coverage = pantryCoverageScore(b) - pantryCoverageScore(a);
        if (coverage !== 0) return coverage;
        const missing = a.allIngredients.length - b.allIngredients.length;
        if (missing !== 0) return missing;
        return a.name.localeCompare(b.name);
      });
  }, [
    recipes,
    dietary,
    timeId,
    difficulty,
    cuisine,
    match,
    favoritesOnly,
    favorites,
    searchQuery,
  ]);
  
  const visibleRecipes = filtered.slice(0, visibleCount);
  
  useEffect(() => {
    setVisibleCount(6);
  }, [
    searchQuery,
    dietary,
    timeId,
    difficulty,
    cuisine,
    match,
    favoritesOnly,
  ]);
  
  const toggleDietary = (tag: DietaryTag) => {
    setDietary((prev) => {
      const next = new Set(prev);
  
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
  
      return next;
    });
  };

  const clearFilters = () => {
    setDietary(new Set());
    setTimeId(null);
    setDifficulty(null);
    setCuisine(null);
    setMatch(null);
    setFavoritesOnly(false);
  };

  const toggleFav = (id: string) => {
    const next = new Set(favorites);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setFavorites(next);
  };

  return (
    <div className="flex flex-col gap-7 px-6 pt-5 pb-2">
      <div>
        <h1 className="font-display text-[34px] leading-[1.1] tracking-[-0.01em] text-stone-900">
          Cook tonight.
        </h1>
        
      </div>

      <div className="border-b border-stone-200 pb-3 flex items-center gap-3">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#a8a29e"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <circle cx="11" cy="11" r="6" />
          <line x1="20" y1="20" x2="15.5" y2="15.5" />
        </svg>
        <input
          type="text"
          placeholder="Search recipes"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent text-[14px] text-stone-800 placeholder-stone-400 focus:outline-none"
        />
      </div>

      {fetchError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-900">
          {fetchError}. Check your connection and try switching back to Cook.
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-[13px] font-medium border border-stone-300 bg-white text-stone-800 ${pressOutline}`}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
          </svg>
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-stone-900 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full tabular-nums min-w-[18px] text-center">
              {activeFilterCount}
            </span>
          )}
        </button>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={clearFilters}
            className={`text-[12px] text-stone-500 underline underline-offset-2 px-2 py-1 rounded-md ${pressOutline}`}
          >
            Clear
          </button>
        )}
      </div>

      {filterOpen && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-stone-900/40">
          <button
            type="button"
            aria-label="Close filters"
            className="absolute inset-0 z-0"
            onClick={() => setFilterOpen(false)}
          />
          <div className="relative z-10 w-full max-w-sm bg-white rounded-t-[28px] shadow-2xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-stone-100">
              <h2 className="font-display text-[22px] text-stone-900">Filters</h2>
              <button
                type="button"
                onClick={() => setFilterOpen(false)}
                className={`text-[13px] font-semibold text-stone-900 rounded-lg px-3 py-1.5 ${pressOutline}`}
              >
                Done
              </button>
            </div>
            <div className="overflow-y-auto px-6 py-5 flex flex-col gap-6 pb-8">
              <section>
                <h3 className="text-[11px] uppercase tracking-[0.12em] text-stone-400 font-medium mb-2.5">
                  Favorites
                </h3>
                <button
                  type="button"
                  onClick={() => setFavoritesOnly((v) => !v)}
                  className={`w-full text-left px-4 py-3 rounded-2xl text-[13px] font-medium border transition-all ${
                    favoritesOnly
                      ? `bg-stone-900 text-white border-stone-900 ${pressDark}`
                      : `bg-white text-stone-700 border-stone-300 ${pressOutline}`
                  }`}
                >
                  Favorites only
                </button>
              </section>

              <section>
                <h3 className="text-[11px] uppercase tracking-[0.12em] text-stone-400 font-medium mb-2.5">
                  Dietary
                </h3>
                <div className="flex flex-wrap gap-2">
                  {DIETARY_OPTIONS.map((tag) => {
                    const on = dietary.has(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleDietary(tag)}
                        className={`px-3.5 py-2 rounded-full text-[12px] font-medium border ${
                          on
                            ? `bg-stone-900 text-white border-stone-900 ${pressDark}`
                            : `bg-white text-stone-700 border-stone-300 ${pressOutline}`
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <h3 className="text-[11px] uppercase tracking-[0.12em] text-stone-400 font-medium mb-2.5">
                  Time
                </h3>
                <div className="flex flex-wrap gap-2">
                  {TIME_OPTIONS.map((opt) => {
                    const on = timeId === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          setTimeId((prev) =>
                            prev === opt.id ? null : opt.id
                          )
                        }
                        className={`px-3.5 py-2 rounded-full text-[12px] font-medium border ${
                          on
                            ? `bg-stone-900 text-white border-stone-900 ${pressDark}`
                            : `bg-white text-stone-700 border-stone-300 ${pressOutline}`
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <h3 className="text-[11px] uppercase tracking-[0.12em] text-stone-400 font-medium mb-2.5">
                  Difficulty
                </h3>
                <div className="flex flex-wrap gap-2">
                  {DIFFICULTY_OPTIONS.map((d) => {
                    const on = difficulty === d;
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() =>
                          setDifficulty((prev) => (prev === d ? null : d))
                        }
                        className={`px-3.5 py-2 rounded-full text-[12px] font-medium border ${
                          on
                            ? `bg-stone-900 text-white border-stone-900 ${pressDark}`
                            : `bg-white text-stone-700 border-stone-300 ${pressOutline}`
                        }`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <h3 className="text-[11px] uppercase tracking-[0.12em] text-stone-400 font-medium mb-2.5">
                  Cuisines
                </h3>
                <div className="flex flex-wrap gap-2">
                  {CUISINE_OPTIONS.map((c) => {
                    const on = cuisine === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() =>
                          setCuisine((prev) => (prev === c ? null : c))
                        }
                        className={`px-3.5 py-2 rounded-full text-[12px] font-medium border ${
                          on
                            ? `bg-stone-900 text-white border-stone-900 ${pressDark}`
                            : `bg-white text-stone-700 border-stone-300 ${pressOutline}`
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <h3 className="text-[11px] uppercase tracking-[0.12em] text-stone-400 font-medium mb-2.5">
                  Ingredient match
                </h3>
                <div className="flex flex-col gap-2">
                  {MATCH_OPTIONS.map((opt) => {
                    const on = match === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setMatch((prev) => (prev === opt.id ? null : opt.id))}
                        className={`text-left px-4 py-3 rounded-2xl text-[13px] font-medium border ${
                          on
                            ? `bg-stone-900 text-white border-stone-900 ${pressDark}`
                            : `bg-white text-stone-700 border-stone-300 ${pressOutline}`
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </section>

              <button
                type="button"
                onClick={() => {
                  clearFilters();
                  setFilterOpen(false);
                }}
                className={`w-full py-3 rounded-full text-[13px] font-medium border border-stone-300 text-stone-700 ${pressOutline}`}
              >
                Reset all
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-baseline justify-between -mb-3">
        <h2 className="font-display text-[20px] text-stone-900 tracking-tight">
          Recommended for you
        </h2>
        <button
          type="button"
          className={`text-[12px] text-stone-500 underline underline-offset-2 rounded-md px-1 ${pressOutline}`}
        >
          View all
        </button>
      </div>

      <div className="flex flex-col gap-5">
        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-10">
            <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-900 rounded-full animate-spin" />
            <p className="text-[13px] text-stone-500">Loading recipes…</p>
          </div>
        )}
        {!loading && 
          visibleRecipes.map((recipe, idx) => {
          const isCookedNow = cooked.has(recipe.id);
          const isFav = favorites.has(recipe.id);

          return (
            <div
              key={recipe.id}
              className={`flex flex-col gap-3 transition-opacity ${
                isCookedNow ? "opacity-50" : ""
              }`}
            >
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDetailRecipe(recipe)}
                  className={`w-full text-left flex flex-col gap-3 rounded-2xl -mx-1 px-1 py-0.5 ${pressOutline}`}
                >
                  <div
                    className={`relative ${recipe.imageUrl ? "bg-stone-100" : cardTints[idx % cardTints.length]} rounded-[22px] aspect-[4/3] flex items-center justify-center overflow-hidden pointer-events-none`}
                  >
                    {recipe.imageUrl ? (
                      <img
                        src={recipe.imageUrl}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <span
                        className="text-8xl"
                        style={{
                          filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.08))",
                        }}
                      >
                        {recipe.emoji}
                      </span>
                    )}
                    {recipe.expiringIngredients.length > 0 && (
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        <span className="text-[10px] font-medium text-stone-800 tracking-wide">
                          Uses {recipe.expiringIngredients.length} expiring
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pointer-events-none">
                    <h3 className="font-display text-[20px] text-stone-900 tracking-tight leading-snug">
                      {recipe.name}
                    </h3>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="text-[12px] text-stone-500">
                        {recipe.cookTime}
                      </span>
                      <span className="text-stone-300">·</span>
                      <span className="text-[12px] text-stone-500">
                        {recipe.difficulty}
                      </span>
                      <span className="text-stone-300">·</span>
                      <span className="text-[12px] text-stone-500 tabular-nums">
                        Saves ~${recipe.savingsEstimate}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pointer-events-none">
                    <span className="text-[11px] font-medium px-2.5 py-1 rounded-full border border-red-200 bg-red-50 text-red-700 inline-flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      {recipe.expiringIngredients.length} urgent items
                    </span>
                    <span className="text-[11px] font-medium px-2.5 py-1 rounded-full border border-stone-200 text-stone-700 inline-flex items-center gap-1.5">
                      Missing {missingItemsCount(recipe.ingredientMatch)}
                    </span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFav(recipe.id);
                  }}
                  className={`absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center ${pressOutline}`}
                  aria-label={isFav ? "Remove favorite" : "Save recipe"}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill={isFav ? "#0c0a09" : "none"}
                    stroke="#0c0a09"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  >
                    <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />
                  </svg>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  const next = new Set(cooked);
                  if (isCookedNow) {
                    next.delete(recipe.id);
                    onMealsCookedChange?.(-1);
                    onRecipeCookToggle?.(recipe, false);
                  } else {
                    next.add(recipe.id);
                    onMealsCookedChange?.(1);
                    onRecipeCookToggle?.(recipe, true);
                  }
                  setCooked(next);
                }}
                className={`w-full py-3.5 rounded-full text-[13px] font-medium tracking-wide mt-1 ${
                  isCookedNow
                    ? `bg-white text-stone-900 border border-stone-300 ${pressOutline}`
                    : `bg-stone-900 text-white ${pressDark}`
                }`}
              >
                {isCookedNow ? "Marked as cooked ✓" : "Mark as cooked"}
              </button>
            </div>
          );
        })}
      </div>

      {detailRecipe && (
        <RecipeDetailSheet
          recipe={detailRecipe}
          onClose={() => setDetailRecipe(null)}
          onRequestIngredient={onRequestIngredient}
        />
      )}
      {!loading && visibleCount < filtered.length && (
  <button
    type="button"
    onClick={() => setVisibleCount((n) => n + 6)}
    className={`w-full py-3 text-[13px] font-medium tracking-wide bg-white text-stone-600 hover:bg-stone-50 ${pressOutline}`}
  >
    Load more recipes
  </button>
)}
      {!loading && filtered.length === 0 && recipes.length > 0 && (
        <p className="text-[14px] text-stone-500 text-center py-8">
          {recipes.length === 0
            ? "No recipes from TheMealDB matched your pantry yet. Try staples TheMealDB lists often (chicken, tomato, onion, rice)."
            : "No recipes match these filters. Try adjusting or clearing filters."}
        </p>
      )}
      {!loading && recipes.length === 0 && !fetchError && (
        <p className="text-[14px] text-stone-500 text-center py-8">
          No recipes returned. Try again in a moment.
        </p>
      )}
    </div>
  );
}
