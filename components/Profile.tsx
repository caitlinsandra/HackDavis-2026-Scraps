"use client";
import React, { useState } from "react";
import type {
  DistanceUnit,
  NotificationPreferences,
  UserProfile,
} from "./types";
import { pressDark, pressOutline } from "./pressableStyles";

type ProfileSheet =
  | null
  | "environmentalImpact"
  | "settings"
  | "signOutConfirm";

interface ProfileProps {
  profile: UserProfile;
  notificationPrefs: NotificationPreferences;
  onNotificationPrefsChange: (prefs: NotificationPreferences) => void;
  distanceUnit: DistanceUnit;
  onDistanceUnitChange: (unit: DistanceUnit) => void;
  onAddFriends: () => void;
  onSignOut: () => void;
}

function ToggleRow({
  label,
  description,
  on,
  onToggle,
}: {
  label: string;
  description: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex w-full items-center gap-4 py-3.5 text-left border-b border-stone-100 last:border-0 rounded-lg -mx-1 px-1 ${pressOutline}`}
    >
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium text-stone-900">{label}</p>
        <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">
          {description}
        </p>
      </div>
      <span
        role="switch"
        aria-checked={on}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
          on ? "bg-stone-900" : "bg-stone-300"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-150 ease-out ${
            on ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );
}

function SheetChrome({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[129] flex items-end justify-center bg-stone-900/40">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 z-0"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-sm bg-white rounded-t-[28px] shadow-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-stone-100 flex-shrink-0">
          <h2 className="font-display text-[22px] text-stone-900 pr-4">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className={`text-[13px] font-semibold text-stone-900 rounded-lg px-3 py-1.5 flex-shrink-0 ${pressOutline}`}
          >
            Done
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5 pb-8">{children}</div>
      </div>
    </div>
  );
}

export default function Profile({
  profile,
  notificationPrefs,
  onNotificationPrefsChange,
  distanceUnit,
  onDistanceUnitChange,
  onAddFriends,
  onSignOut,
}: ProfileProps) {
  const [sheet, setSheet] = useState<ProfileSheet>(null);

  const setPref = <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    onNotificationPrefsChange({ ...notificationPrefs, [key]: value });
  };

  const milesHint =
    distanceUnit === "mi"
      ? Math.max(1, Math.round(profile.co2Saved * 2.5))
      : Math.max(1, Math.round(profile.co2Saved * 4));

  return (
    <div className="flex flex-col gap-7 px-6 pt-5 pb-2">
      <div>
        <h1 className="font-display text-[34px] leading-[1.1] tracking-[-0.01em] text-stone-900">
          Hi, {profile.name.split(" ")[0]}.
        </h1>
        <p className="text-[13px] text-stone-500 mt-3 leading-relaxed">
          Your snapshot, savings, impact, and people you cook with.
        </p>
      </div>

      <div className="border-b border-stone-200 pb-5">
        <p className="text-[10px] uppercase tracking-[0.18em] text-stone-400 font-medium">
          Saved this month
        </p>
        <div className="flex items-baseline gap-1.5 mt-2">
          <span className="font-display text-[56px] leading-none tracking-[-0.02em] text-stone-900 tabular-nums">
            ${profile.savedThisMonth}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 -mt-2">
        <div className="border border-stone-200 rounded-2xl p-4">
          <p className="font-display text-[22px] leading-none text-stone-900 tabular-nums">
            {profile.ingredientsRescued}
          </p>
          <p className="text-[10px] uppercase tracking-[0.12em] text-stone-400 mt-2 leading-tight">
            Items rescued
          </p>
        </div>
        <div className="border border-stone-200 rounded-2xl p-4">
          <p className="font-display text-[22px] leading-none text-stone-900 tabular-nums">
            {profile.co2Saved}
            <span className="text-[12px] font-sans-i font-medium text-stone-400 ml-0.5">
              kg
            </span>
          </p>
          <p className="text-[10px] uppercase tracking-[0.12em] text-stone-400 mt-2 leading-tight">
            CO₂ saved
          </p>
        </div>
        <div className="border border-stone-200 rounded-2xl p-4">
          <p className="font-display text-[22px] leading-none text-stone-900 tabular-nums">
            {profile.mealsCooked}
          </p>
          <p className="text-[10px] uppercase tracking-[0.12em] text-stone-400 mt-2 leading-tight">
            Meals cooked
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          onAddFriends();
        }}
        className={`flex items-center justify-center gap-2 w-full py-3.5 rounded-full text-[14px] font-semibold bg-stone-900 text-white ${pressDark}`}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <line x1="19" y1="8" x2="19" y2="14" />
          <line x1="22" y1="11" x2="16" y2="11" />
        </svg>
        Add friends
      </button>

      <div className="flex flex-col gap-1">
        <p className="text-[10px] uppercase tracking-[0.18em] text-stone-400 font-medium px-1 mb-1">
          More
        </p>
        <button
          type="button"
          onClick={() => setSheet("environmentalImpact")}
          className={`flex items-center justify-between w-full py-3.5 border-b border-stone-100 rounded-lg -mx-1 px-1 ${pressOutline}`}
        >
          <span className="text-[14px] text-stone-800 text-left">
            Your environmental impact
          </span>
          <Chevron />
        </button>
        <button
          type="button"
          onClick={() => setSheet("settings")}
          className={`flex items-center justify-between w-full py-3.5 rounded-lg -mx-1 px-1 ${pressOutline}`}
        >
          <span className="text-[14px] text-stone-800 text-left">Settings</span>
          <Chevron />
        </button>
      </div>

      <button
        type="button"
        onClick={() => setSheet("signOutConfirm")}
        className={`text-[13px] text-stone-500 text-center py-2 ${pressOutline} rounded-lg`}
      >
        Sign out
      </button>

      {sheet === "environmentalImpact" && (
        <SheetChrome
          title="Environmental impact"
          onClose={() => setSheet(null)}
        >
          <p className="text-[13px] text-stone-600 leading-relaxed mb-5">
            Scraps estimates impact from ingredients you rescue and meals you
            cook instead of tossing food.
          </p>
          <ul className="flex flex-col gap-4 text-[13px] text-stone-800">
            <li className="border border-stone-200 rounded-2xl p-4">
              <span className="text-[11px] uppercase tracking-[0.12em] text-stone-400 font-medium">
                Carbon
              </span>
              <p className="font-display text-[28px] text-stone-900 mt-1 tabular-nums">
                {profile.co2Saved}{" "}
                <span className="text-[14px] font-sans-i font-medium text-stone-500">
                  kg CO₂e
                </span>
              </p>
              <p className="text-[11px] text-stone-500 mt-2 leading-relaxed">
                Ballpark: similar order of magnitude to driving ~{milesHint}{" "}
                fewer {distanceUnit === "mi" ? "miles" : "kilometres"} by car
                (rough illustration, not personalized).
              </p>
            </li>
            <li className="border border-stone-200 rounded-2xl p-4">
              <span className="text-[11px] uppercase tracking-[0.12em] text-stone-400 font-medium">
                Rescue & cooking
              </span>
              <p className="mt-2 leading-relaxed text-stone-700">
                <span className="font-semibold text-stone-900 tabular-nums">
                  {profile.ingredientsRescued}
                </span>{" "}
                ingredients diverted from waste ·{" "}
                <span className="font-semibold text-stone-900 tabular-nums">
                  {profile.mealsCooked}
                </span>{" "}
                meals cooked at home using what you already have.
              </p>
            </li>
          </ul>
        </SheetChrome>
      )}

      {sheet === "settings" && (
        <SheetChrome title="Settings" onClose={() => setSheet(null)}>
          <p className="text-[12px] text-stone-500 leading-relaxed mb-5">
            Notifications and units, everything else lives on your other tabs.
          </p>

          <p className="text-[11px] uppercase tracking-[0.12em] text-stone-400 font-medium mb-2">
            Notifications
          </p>
          <p className="text-[11px] text-stone-500 mb-3 leading-relaxed">
            Choose what appears in your inbox and counts toward the bell badge.
          </p>
          <div className="flex flex-col mb-8">
            <ToggleRow
              label="Expiry & waste alerts"
              description="Reminders when pantry items are close to spoiling."
              on={notificationPrefs.expiryAlerts}
              onToggle={() =>
                setPref("expiryAlerts", !notificationPrefs.expiryAlerts)
              }
            />
            <ToggleRow
              label="Friend activity"
              description="When friends share ingredients or respond to requests."
              on={notificationPrefs.friendActivity}
              onToggle={() =>
                setPref("friendActivity", !notificationPrefs.friendActivity)
              }
            />
            <ToggleRow
              label="Weekly summary"
              description="Digest of savings, meals, and impact."
              on={notificationPrefs.weeklyDigest}
              onToggle={() =>
                setPref("weeklyDigest", !notificationPrefs.weeklyDigest)
              }
            />
          </div>

          <p className="text-[11px] uppercase tracking-[0.12em] text-stone-400 font-medium mb-2">
            Distance units
          </p>
          <p className="text-[12px] text-stone-500 mb-3 leading-relaxed">
            Used for comparisons on your environmental impact screen.
          </p>
          <div className="flex rounded-full border border-stone-300 p-1 bg-stone-50">
            {(["mi", "km"] as const).map((u) => {
              const active = distanceUnit === u;
              return (
                <button
                  key={u}
                  type="button"
                  onClick={() => onDistanceUnitChange(u)}
                  className={`flex-1 py-2 rounded-full text-[13px] font-medium transition-colors ${
                    active
                      ? `bg-stone-900 text-white ${pressDark}`
                      : `text-stone-600 ${pressOutline}`
                  }`}
                >
                  {u === "mi" ? "Miles" : "Kilometres"}
                </button>
              );
            })}
          </div>
        </SheetChrome>
      )}

      {sheet === "signOutConfirm" && (
        <div className="fixed inset-0 z-[131] flex items-end justify-center bg-stone-900/40">
          <button
            type="button"
            aria-label="Dismiss"
            className="absolute inset-0 z-0"
            onClick={() => setSheet(null)}
          />
          <div className="relative z-10 w-full max-w-sm bg-white rounded-t-[28px] shadow-2xl px-6 pt-6 pb-8 flex flex-col gap-4">
            <h2 className="font-display text-[22px] text-stone-900">Sign out?</h2>
            <p className="text-[13px] text-stone-600 leading-relaxed">
              You&apos;ll leave this session on this device. Your pantry in this
              demo resets to sample data until you use the app again.
            </p>
            <div className="flex flex-col gap-2 mt-2">
              <button
                type="button"
                onClick={() => setSheet(null)}
                className={`w-full py-3 rounded-full text-[14px] font-semibold border border-stone-300 bg-white text-stone-900 ${pressOutline}`}
              >
                Stay signed in
              </button>
              <button
                type="button"
                onClick={() => {
                  onSignOut();
                  setSheet(null);
                }}
                className={`w-full py-3 rounded-full text-[14px] font-semibold bg-red-600 text-white ${pressDark}`}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Chevron() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#a8a29e"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="9 6 15 12 9 18" />
    </svg>
  );
}
