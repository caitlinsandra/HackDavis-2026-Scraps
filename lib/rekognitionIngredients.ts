export interface RekognitionIngredientDetection {
  name: string;
  count: number;
}

export interface RekognitionLabelInput {
  name: string;
  instanceCount?: number;
  confidence?: number;
}

const EXCLUDED_LABELS = new Set([
  "person",
  "human",
  "face",
  "crowd",
  "text",
  "font",
  "food",
  "produce",
  "fruit",
  "vegetable",
  "plant",
  "meal",
  "dish",
  "grocery store",
  "shopping cart",
  "supermarket",
  "shop",
  "market",
  "indoors",
  "car",
  "vehicle",
  "wheel",
  "transportation",
  "breakfast",
  "citrus fruit",
  "natural foods",
  "whole foods",
]);

const NAME_ALIASES: Record<string, string> = {
  "red onion": "Onion",
  "yellow onion": "Onion",
  onion: "Onion",
  "bell pepper": "Bell Pepper",
  pepper: "Bell Pepper",
  "brussels sprout": "Brussels Sprouts",
  "brussels sprouts": "Brussels Sprouts",
  "bread": "Bread",
  "sliced mushrooms": "Mushrooms",
  mushroom: "Mushrooms",
  mushrooms: "Mushrooms",
  apple: "Apple",
  apples: "Apple",
  orange: "Orange",
  oranges: "Orange",
  milk: "Milk",
  egg: "Egg",
  eggs: "Egg",
  juice: "Juice",
  lettuce: "Lettuce",
  spinach: "Spinach",
  tomato: "Tomato",
  avocado: "Avocado",
  carrot: "Carrot",
  asparagus: "Asparagus",
  broccoli: "Broccoli",
  cauliflower: "Cauliflower",
  cabbage: "Cabbage",
  celery: "Celery",
  cucumber: "Cucumber",
  eggplant: "Eggplant",
  garlic: "Garlic",
  ginger: "Ginger",
  banana: "Banana",
  bananas: "Banana",
  grapes: "Grapes",
  peach: "Peach",
  peaches: "Peach",
  chicken: "Chicken",
  beef: "Beef",
  cheese: "Cheese",
};

const GROCERY_KEYWORDS = new Set([
  ...Object.keys(NAME_ALIASES),
]);

function toTitleCase(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function normalizeIngredientLabels(labels: string[]): string[] {
  const seen = new Set<string>();
  const results: string[] = [];

  for (const raw of labels) {
    const normalized = raw.trim().toLowerCase();
    if (!normalized || EXCLUDED_LABELS.has(normalized)) {
      continue;
    }

    const key = normalized.replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ");
    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    results.push(toTitleCase(key));
  }

  return results;
}

function normalizeIngredientName(raw: string): string | null {
  const normalized = raw.trim().toLowerCase();
  if (!normalized || EXCLUDED_LABELS.has(normalized)) {
    return null;
  }

  const key = normalized.replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
  if (!key || EXCLUDED_LABELS.has(key)) {
    return null;
  }

  return NAME_ALIASES[key] ?? toTitleCase(key);
}

export function toDetectedIngredients(
  labels: RekognitionLabelInput[],
  options?: { allowUncounted?: boolean; minConfidence?: number }
): RekognitionIngredientDetection[] {
  const allowUncounted = options?.allowUncounted ?? false;
  const minConfidence = options?.minConfidence ?? 0;
  const counts = new Map<string, number>();

  for (const label of labels) {
    if ((label.confidence ?? 0) < minConfidence) continue;
    const name = normalizeIngredientName(label.name);
    if (!name) continue;
    const rawCount = label.instanceCount ?? 0;
    const amount = rawCount > 0 ? rawCount : allowUncounted ? 1 : 0;
    if (amount <= 0) continue;
    counts.set(name, (counts.get(name) ?? 0) + amount);
  }

  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function isLikelyGroceryLabel(raw: string): boolean {
  const normalized = raw.trim().toLowerCase();
  if (!normalized) return false;
  if (EXCLUDED_LABELS.has(normalized)) return false;
  if (NAME_ALIASES[normalized]) return true;
  return [...GROCERY_KEYWORDS].some((keyword) => normalized.includes(keyword));
}
