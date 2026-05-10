"use client";
import React from "react";
import type { Notification } from "./types";
import { pressOutline } from "./pressableStyles";

const notifGlyph: Record<string, string> = {
  warning: "!",
  success: "✓",
  info: "i",
};

export default function NotificationsSheet({
  open,
  notifications,
  onClose,
  onMarkAllRead,
  onMarkRead,
}: {
  open: boolean;
  notifications: Notification[];
  onClose: () => void;
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
}) {
  if (!open) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="fixed inset-0 z-[130] flex items-end justify-center bg-stone-900/40">
      <button
        type="button"
        aria-label="Close notifications"
        className="absolute inset-0 z-0"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-sm bg-white rounded-t-[28px] shadow-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-stone-100">
          <div className="flex items-baseline gap-2">
            <h2 className="font-display text-[22px] text-stone-900">
              Notifications
            </h2>
            {unreadCount > 0 && (
              <span className="text-[12px] text-stone-500 tabular-nums">
                ({unreadCount})
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllRead}
                className={`text-[12px] text-stone-600 font-medium ${pressOutline} rounded-lg px-2 py-1`}
              >
                Mark all read
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className={`text-[13px] font-semibold text-stone-900 ${pressOutline} rounded-lg px-2 py-1`}
            >
              Done
            </button>
          </div>
        </div>
        <div className="overflow-y-auto px-6 py-4 pb-8">
          <p className="text-[11px] text-stone-400 mb-3">
            Tap a notification or use Mark read to dismiss it from your count.
          </p>
          {notifications.length === 0 ? (
            <p className="text-[13px] text-stone-500 text-center py-10 px-4 leading-relaxed">
<<<<<<< HEAD
              Nothing here. Turn categories back on in Settings (Home tab),
=======
              Nothing here, turn categories back on in Settings (Home tab),
>>>>>>> aws
              or you&apos;re all caught up.
            </p>
          ) : (
          <div className="flex flex-col">
            {notifications.map((notif, idx) => (
              <div
                key={notif.id}
                className={`flex flex-col gap-1.5 py-3.5 ${
                  idx !== 0 ? "border-t border-stone-100" : ""
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (!notif.read) onMarkRead(notif.id);
                  }}
                  className={`flex items-start gap-3.5 text-left w-full rounded-xl -mx-2 px-2 py-1 ${pressOutline} ${
                    notif.read ? "opacity-50" : ""
                  }`}
                >
                  <span className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center text-[11px] font-semibold text-stone-700 flex-shrink-0 mt-0.5">
                    {notifGlyph[notif.type]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-stone-800 leading-snug">
                      {notif.message}
                    </p>
                    <p className="text-[11px] text-stone-400 mt-1">
                      {notif.time}
                    </p>
                  </div>
                  {!notif.read && (
                    <div className="w-1.5 h-1.5 rounded-full bg-stone-900 flex-shrink-0 mt-2" />
                  )}
                </button>
                {!notif.read && (
                  <button
                    type="button"
                    onClick={() => onMarkRead(notif.id)}
                    className={`self-end text-[11px] font-medium text-stone-600 underline underline-offset-2 ${pressOutline} rounded px-2 py-0.5`}
                  >
                    Mark read
                  </button>
                )}
              </div>
            ))}
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
