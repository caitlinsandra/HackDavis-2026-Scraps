export type UrgencyLevel = "red" | "yellow" | "green";

export interface Ingredient {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  /** Same name + expiry rows are merged; each add bumps this (e.g. soup boxes). */
  count: number;
  expiryDate: string; // ISO string
  daysLeft: number;
  urgency: UrgencyLevel;
  estimatedValue: number;
  emoji: string;
  isShared: boolean; // posted to social board
  autoShared: boolean; // auto-posted because red
}

export type DietaryTag =
  | "Vegetarian"
  | "Vegan"
  | "High Protein"
  | "Gluten Free"
  | "Dairy Free";

export type CuisineTag =
  | "Italian"
  | "Mexican"
  | "Asian"
  | "American"
  | "Mediterranean"
  | "Indian";

/** How well the recipe matches pantry / friends inventory */
export type IngredientMatchKind =
  | "pantry_only"
  | "missing_1"
  | "missing_2"
  | "missing_3"
  | "missing_4_plus";

export interface RecipeUsesSource {
  ingredientLabel: string;
  source: "yours" | "friend";
  /** First name when source is friend */
  friendName?: string;
}

export interface Recipe {
  id: string;
  name: string;
  emoji: string;
  imageUrl?: string;
  cookTime: string;
  /** Numeric minutes for filter buckets */
  cookTimeMinutes: number;
  difficulty: "Easy" | "Medium" | "Hard";
  expiringIngredients: string[];
  allIngredients: string[];
  savingsEstimate: number;
  dietaryTags: DietaryTag[];
  cuisine: CuisineTag;
  ingredientMatch: IngredientMatchKind;
  /** Per-ingredient attribution when showing cross-household “uses” */
  usesSources?: RecipeUsesSource[];
  /** Shown as “$X saved from waste” when present */
  wasteSavings?: number;
  /** Ordered cooking steps for the recipe detail view */
  steps: string[];
}

export interface FriendPost {
  id: string;
  friendName: string;
  friendInitials: string;
  ingredientName: string;
  ingredientEmoji: string;
  daysLeft: number;
  urgency: UrgencyLevel;
  quantity: string;
  isAutoShared: boolean; // true = expiring, false = surplus
  requested: boolean;
}

export type ExchangeRequestStatus = "pending" | "approved" | "declined";

/** Items you asked friends for, or friends asked you for */
export interface IngredientExchangeRequest {
  id: string;
  /** You requested from a friend */
  direction: "outgoing" | "incoming";
  counterpartyName: string;
  counterpartyInitials: string;
  ingredientName: string;
  ingredientEmoji: string;
  quantity: string;
  status: ExchangeRequestStatus;
}

export interface UserProfile {
  name: string;
  initials: string;
  savedThisMonth: number;
  ingredientsRescued: number;
  co2Saved: number;
  mealsCooked: number;
  notifications: Notification[];
}

export interface Notification {
  id: string;
  message: string;
  time: string;
  type: "warning" | "info" | "success";
  read: boolean;
}

/** Controls which notification categories appear in the inbox and count toward the badge. */
export interface NotificationPreferences {
  expiryAlerts: boolean;
  friendActivity: boolean;
  weeklyDigest: boolean;
}

export type DistanceUnit = "mi" | "km";

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  expiryAlerts: true,
  friendActivity: true,
  weeklyDigest: true,
};
