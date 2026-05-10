"use client";
import React, { useMemo, useRef, useState } from "react";
import PantryDashboard from "./PantryDashboard";
import AddIngredient from "./AddIngredient";
import Recipes from "./Recipes";
import Social from "./Social";
import Profile from "./Profile";
import NotificationsSheet from "./NotificationsSheet";
import EditProfileSheet from "./EditProfileSheet";
import { pressFlat } from "./pressableStyles";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  DistanceUnit,
  Ingredient,
  IngredientExchangeRequest,
  NotificationPreferences,
  UserProfile,
} from "./types";
import { filterNotificationsByPreferences } from "./notificationsFilter";
import { getDaysLeft, getUrgency } from "./ingredientUtils";
import {
  mockIngredients,
  mockRecipes,
  mockFriendPosts,
  mockExchangeRequests,
  mockProfile,
} from "./mockData";

type Tab = "pantry" | "add" | "recipes" | "social" | "profile";

/* Cook (chef hat) and Add (+) are swapped vs. the original order */
const tabs: { id: Tab; label: string }[] = [
  { id: "pantry", label: "Pantry" },
  { id: "recipes", label: "Cook" },
  { id: "add", label: "Add" },
  { id: "social", label: "Friends" },
  { id: "profile", label: "More" },
];

// Monoline icons — 1.5 stroke, neutral, consistent geometry
function TabIcon({ id, active }: { id: Tab; active: boolean }) {
  const stroke = active ? "#0c0a09" : "#a8a29e";
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke,
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (id) {
    case "pantry":
      // Grocery basket + handle — pantry ingredients (no jar, no tab badge)
      return (
        <svg {...common}>
          <path d="M8 9V7.5a4 4 0 018 0V9" />
          <path d="M5 10h14l-1.5 10a2 2 0 01-2 1.5H8.5a2 2 0 01-2-1.5L5 10z" />
        </svg>
      );
    case "add":
      return (
        <svg {...common}>
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      );
    case "recipes":
      // Fork & knife — “meals” / dining (readable at 22px)
      return (
        <svg {...common}>
          <path d="M8 4v15" />
          <path d="M6 4v4M8 4v4M10 4v4" />
          <path d="M17 4l5 15" />
          <path d="M17 4l3 4v7l-3 4" />
        </svg>
      );
    case "social":
      // Two people
      return (
        <svg {...common}>
          <circle cx="9" cy="9" r="3" />
          <path d="M3 19c0-3 2.7-5 6-5s6 2 6 5" />
          <circle cx="17" cy="8" r="2.5" />
          <path d="M15 14c2.5 0 5 1.5 5 4" />
        </svg>
      );
    case "profile":
      // Settings / more
      return (
        <svg {...common}>
          <path d="M5 7h14" />
          <path d="M5 12h14" />
          <path d="M5 17h14" />
        </svg>
      );
  }
}

export default function ScrapsApp() {
  const [activeTab, setActiveTab] = useState<Tab>("pantry");
  const [ingredients, setIngredients] = useState<Ingredient[]>(mockIngredients);
  const [profile, setProfile] = useState<UserProfile>(mockProfile);
  const [notifications, setNotifications] = useState(mockProfile.notifications);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [exchangeRequests, setExchangeRequests] = useState<
    IngredientExchangeRequest[]
  >(mockExchangeRequests);
  const [friendPosts, setFriendPosts] = useState(mockFriendPosts);
  const [notificationPrefs, setNotificationPrefs] =
    useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);
    const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>("mi");

    const ingredientMatchKey = (
      name: string,
      expiryDate?: string
    ) => {
      return `${name.toLowerCase()}-${expiryDate ?? "none"}`;
    };
    
  const addRedirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleAddIngredient = (
      newIng: Ingredient,
      options?: { stayOnAddTab?: boolean }
    ) => {
      setIngredients((prev) => {
        const key = ingredientMatchKey(newIng.name, newIng.expiryDate);
    
        const i = prev.findIndex(
          (x) => ingredientMatchKey(x.name, x.expiryDate) === key
        );
    
        if (i >= 0) {
          const existing = prev[i];
    
          const merged: Ingredient = {
            ...existing,
            count: existing.count + newIng.count,
            estimatedValue:
              existing.estimatedValue + newIng.estimatedValue,
            isShared: existing.isShared || newIng.isShared,
            autoShared: existing.autoShared || newIng.autoShared,
          };
    
          const next = [...prev];
          next[i] = merged;
    
          return next.sort((a, b) => a.daysLeft - b.daysLeft);
        }
    
        const updated = [newIng, ...prev];
    
        return updated.sort((a, b) => a.daysLeft - b.daysLeft);
      });
    
      if (addRedirectTimeoutRef.current) {
        clearTimeout(addRedirectTimeoutRef.current);
        addRedirectTimeoutRef.current = null;
      }
      if (!options?.stayOnAddTab) {
        addRedirectTimeoutRef.current = setTimeout(() => setActiveTab("pantry"), 1200);
      }
    };

  const handleRecipeCookToggle = (recipeId: string, isCookedNow: boolean) => {
    const recipe = mockRecipes.find((r) => r.id === recipeId);
    if (!recipe) return;
    setProfile((prev) => ({
      ...prev,
      mealsCooked: Math.max(0, prev.mealsCooked + (isCookedNow ? 1 : -1)),
      savedThisMonth: Math.max(
        0,
        prev.savedThisMonth + (isCookedNow ? recipe.savingsEstimate : -recipe.savingsEstimate)
      ),
    }));
    setIngredients((prev) => {
      const next = [...prev];
      for (const used of recipe.expiringIngredients) {
        const idx = next.findIndex((ing) => ing.name.toLowerCase().includes(used.toLowerCase()));
        if (idx < 0) continue;
        const ing = next[idx];
        const newCount = Math.max(0, ing.count + (isCookedNow ? -1 : 1));
        if (newCount <= 0) {
          next.splice(idx, 1);
        } else {
          next[idx] = {
            ...ing,
            count: newCount,
            quantity: String(newCount),
            estimatedValue: Number(
              Math.max(0, ing.estimatedValue + (isCookedNow ? -ing.estimatedValue / Math.max(1, ing.count) : ing.estimatedValue / Math.max(1, ing.count))).toFixed(2)
            ),
          };
        }
      }
      return next.sort((a, b) => a.daysLeft - b.daysLeft);
    });
  };

  const handleRecipeRequestIngredient = (friendName: string, ingredientName: string) => {
    const post = friendPosts.find(
      (p) =>
        p.friendName.toLowerCase().includes(friendName.toLowerCase()) &&
        p.ingredientName.toLowerCase().includes(ingredientName.toLowerCase())
    );
    const reqId = `outgoing-recipe-${friendName}-${ingredientName}`.toLowerCase().replace(/\s+/g, "-");
    setExchangeRequests((prev) => {
      if (prev.some((r) => r.id === reqId)) return prev;
      return [
        ...prev,
        {
          id: reqId,
          direction: "outgoing",
          counterpartyName: friendName,
          counterpartyInitials: friendName.split(/\s+/).map((x) => x[0]).join("").slice(0, 2).toUpperCase(),
          ingredientName,
          ingredientEmoji: post?.ingredientEmoji ?? "🥬",
          quantity: post?.quantity ?? "1 count",
          status: "pending",
        },
      ];
    });
    if (post) {
      setFriendPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, requested: true } : p)));
    }
    setActiveTab("social");
  };

  const handleRemoveIngredient = (id: string) => {
    setIngredients((prev) => prev.filter((ing) => ing.id !== id));
  };

  const handleToggleShare = (id: string) => {
    setIngredients((prev) =>
      prev.map((ing) =>
        ing.id === id ? { ...ing, isShared: !ing.isShared } : ing
      )
    );
  };

  const handleUpdateIngredient = (
    id: string,
    updates: Partial<Ingredient>
  ) => {
    setIngredients((prev) => {
      if (updates.count !== undefined && updates.count <= 0) {
        return prev.filter((ing) => ing.id !== id);
      }
      const next = prev.map((ing) => {
        if (ing.id !== id) return ing;
        const merged = { ...ing, ...updates };
        if (updates.count !== undefined) {
          const oldC = ing.count;
          const newC = updates.count;
          if (oldC > 0 && newC > 0 && oldC !== newC) {
            merged.estimatedValue = ing.estimatedValue * (newC / oldC);
          }
          merged.count = newC;
        }
        if (updates.expiryDate !== undefined) {
          const days = getDaysLeft(updates.expiryDate);
          merged.daysLeft = days;
          merged.urgency = getUrgency(days);
        }
        if (updates.estimatedValue !== undefined && updates.count === undefined) {
          merged.estimatedValue = updates.estimatedValue;
        }
        return merged;
      });
      return next.sort((a, b) => a.daysLeft - b.daysLeft);
    });
  };

  const sharedIngredients = ingredients.filter((i) => i.isShared);

  const inboxNotifications = useMemo(
    () => filterNotificationsByPreferences(notifications, notificationPrefs),
    [notifications, notificationPrefs]
  );
  const unreadNotifs = inboxNotifications.filter((n) => !n.read).length;
  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const openNotifications = () => setNotificationsOpen(true);

  const profileFirstName =
    profile.name.trim().split(/\s+/)[0] || profile.name.trim() || "there";

  const saveProfileIdentity = (next: { name: string; initials: string }) => {
    setProfile((p) => ({ ...p, name: next.name, initials: next.initials }));
  };

  const handleSignOut = () => {
    setIngredients(mockIngredients);
    setProfile(mockProfile);
    setNotifications(mockProfile.notifications.map((n) => ({ ...n })));
    setExchangeRequests(mockExchangeRequests.map((r) => ({ ...r })));
    setNotificationPrefs({ ...DEFAULT_NOTIFICATION_PREFERENCES });
    setDistanceUnit("mi");
    setNotificationsOpen(false);
    setProfileEditOpen(false);
    setActiveTab("pantry");
  };

  const notifBadge =
    unreadNotifs > 9 ? "9+" : unreadNotifs > 0 ? String(unreadNotifs) : null;

  return (
    <>
      {/* Font loading — Playfair (display serif) + Inter (body sans) */}
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Inter:wght@400;500;600&display=swap");
        .font-display {
          font-family: "Playfair Display", Georgia, serif;
          font-feature-settings: "ss01";
        }
        .font-sans-i {
          font-family: "Inter", system-ui, sans-serif;
        }
      `}</style>

      <div className="min-h-screen bg-stone-200 flex items-start justify-center py-6 px-4 font-sans-i">
        {/* Phone frame — fixed height so the tab bar stays at the bottom of the screen */}
        <div className="relative w-full max-w-sm bg-white rounded-[44px] border border-stone-300 overflow-hidden shadow-2xl flex flex-col h-[812px] max-h-[calc(100vh-48px)]">
          <NotificationsSheet
            open={notificationsOpen}
            onClose={() => setNotificationsOpen(false)}
            notifications={inboxNotifications}
            onMarkAllRead={markAllNotificationsRead}
            onMarkRead={markNotificationRead}
          />
          <EditProfileSheet
            open={profileEditOpen}
            onClose={() => setProfileEditOpen(false)}
            name={profile.name}
            fallbackInitials={profile.initials}
            onSave={saveProfileIdentity}
          />
          {/* iPhone-style chrome: island + nav row (avatar · centered title · mail) */}
          <header className="shrink-0 bg-white">
            <div className="flex justify-center pt-3 pb-2" aria-hidden>
              <div className="h-[31px] w-[126px] rounded-[20px] bg-stone-900 shadow-inner shadow-black/15" />
            </div>
            <div className="flex items-center min-h-[44px] px-4 pb-3 pt-0.5">
              <div className="w-11 shrink-0 flex justify-start items-center">
                <button
                  type="button"
                  onClick={() => setProfileEditOpen(true)}
                  className={`w-11 h-11 rounded-full bg-stone-100 flex items-center justify-center text-sm font-medium text-stone-600 border border-stone-200 ${pressFlat}`}
                  aria-label="Edit profile"
                >
                  {profile.initials}
                </button>
              </div>
              <h1 className="flex-1 min-w-0 text-center font-display text-[30px] font-semibold tracking-[-0.02em] text-stone-900 leading-snug px-2">
                Scraps
              </h1>
              <div className="w-11 shrink-0 flex justify-end items-center">
                <button
                  type="button"
                  onClick={openNotifications}
                  className={`relative w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-800 border border-stone-200/80 ${pressFlat}`}
                  aria-label={
                    unreadNotifs > 0
                      ? `Notifications, ${unreadNotifs} unread`
                      : "Notifications"
                  }
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="m3 7 8.5 6.5a2 2 0 0 0 2.5 0L21 7" />
                  </svg>
                  {notifBadge !== null && (
                    <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-[5px] rounded-full bg-red-500 text-white text-[10px] font-bold leading-none flex items-center justify-center tabular-nums ring-2 ring-white">
                      {notifBadge}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </header>

          {/* Screen content — scrolls; nav stays pinned to the frame bottom */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain pb-[88px]">
            {activeTab === "pantry" && (
              <PantryDashboard
                ingredients={ingredients}
                userFirstName={profileFirstName}
                onToggleShare={handleToggleShare}
                onUpdateIngredient={handleUpdateIngredient}
                onRemoveIngredient={handleRemoveIngredient}
              />
            )}
            {activeTab === "add" && (
              <AddIngredient onAdd={handleAddIngredient} />
            )}
            {activeTab === "recipes" && (
              <Recipes
                recipes={mockRecipes}
                onRecipeCookToggle={handleRecipeCookToggle}
                onRequestIngredient={handleRecipeRequestIngredient}
              />
            )}
            {activeTab === "social" && (
              <Social
                friendPosts={friendPosts}
                mySharedIngredients={sharedIngredients}
                exchangeRequests={exchangeRequests}
                setExchangeRequests={setExchangeRequests}
                setFriendPosts={setFriendPosts}
              />
            )}
            {activeTab === "profile" && (
              <Profile
                profile={profile}
                notificationPrefs={notificationPrefs}
                onNotificationPrefsChange={setNotificationPrefs}
                distanceUnit={distanceUnit}
                onDistanceUnitChange={setDistanceUnit}
                onAddFriends={() => setActiveTab("social")}
                onSignOut={handleSignOut}
              />
            )}
          </div>

          {/* Bottom nav — flat 5 tabs, monoline icons, hairline top border */}
          <div className="absolute bottom-0 left-0 right-0 z-30 bg-white border-t border-stone-100">
            <div className="flex items-center px-2 pt-2.5 pb-1">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex flex-col items-center gap-1 py-1.5 rounded-xl ${pressFlat}`}
                    aria-label={tab.label}
                  >
                    <TabIcon id={tab.id} active={isActive} />
                  </button>
                );
              })}
            </div>
            {/* Home indicator */}
            <div className="flex justify-center pb-2">
              <div className="w-32 h-[3px] rounded-full bg-stone-900/80" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
