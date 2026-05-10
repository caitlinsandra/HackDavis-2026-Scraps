"use client";
import React, { useState } from "react";
import type {
  FriendPost,
  Ingredient,
  IngredientExchangeRequest,
  ExchangeRequestStatus,
  UrgencyLevel,
} from "./types";
import { pressDark, pressOutline } from "./pressableStyles";

/** Stable id for outgoing rows created from the Friends feed (Request button). */
function outgoingRequestIdForFriendPost(postId: string): string {
  return `outgoing-post-${postId}`;
}

interface SocialProps {
  friendPosts: FriendPost[];
  setFriendPosts: React.Dispatch<React.SetStateAction<FriendPost[]>>;
  mySharedIngredients: Ingredient[];
  exchangeRequests: IngredientExchangeRequest[];
  setExchangeRequests: React.Dispatch<
    React.SetStateAction<IngredientExchangeRequest[]>
  >;
}

const urgencyDot: Record<UrgencyLevel, string> = {
  red: "bg-red-500",
  yellow: "bg-amber-400",
  green: "bg-emerald-500",
};

const urgencyText: Record<UrgencyLevel, string> = {
  red: "text-red-600",
  yellow: "text-amber-600",
  green: "text-stone-500",
};

const avatarTints = [
  "bg-stone-100 text-stone-700",
  "bg-stone-200 text-stone-700",
  "bg-amber-50 text-amber-900",
  "bg-stone-50 text-stone-700",
];

const statusStyle: Record<
  IngredientExchangeRequest["status"],
  string
> = {
  pending: "bg-amber-100 text-amber-900 border-amber-200",
  approved: "bg-emerald-100 text-emerald-900 border-emerald-200",
  declined: "bg-red-100 text-red-900 border-red-200",
};

export default function Social({
  friendPosts,
  setFriendPosts,
  mySharedIngredients,
  exchangeRequests,
  setExchangeRequests,
}: SocialProps) {
  const [tab, setTab] = useState<"available" | "mine" | "requests">(
    "available"
  );
  const namesMatch = (a: string, b: string) =>
    a.trim().toLowerCase() === b.trim().toLowerCase() ||
    a.trim().toLowerCase().includes(b.trim().toLowerCase()) ||
    b.trim().toLowerCase().includes(a.trim().toLowerCase());
  const ingredientMatch = namesMatch;
  const hasOutgoingRequestForPost = (post: FriendPost) =>
    exchangeRequests.some(
      (req) =>
        req.direction === "outgoing" &&
        ingredientMatch(req.ingredientName, post.ingredientName) &&
        namesMatch(req.counterpartyName, post.friendName)
    );

  const norm = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const namesMatch = (a: string, b: string) => {
    const na = norm(a);
    const nb = norm(b);
    return na === nb || na.startsWith(nb) || nb.startsWith(na);
  };

  const ingredientMatch = (a: string, b: string) => {
    const na = norm(a);
    const nb = norm(b);
    return (
      na === nb ||
      na.includes(nb) ||
      nb.includes(na) ||
      na.split(" ").some((part) => part.length > 2 && nb.includes(part))
    );
  };

  const hasOutgoingRequestForPost = (post: FriendPost) => {
    return exchangeRequests.some(
      (r) =>
        r.direction === "outgoing" &&
        r.status !== "declined" &&
        namesMatch(r.counterpartyName, post.friendName) &&
        ingredientMatch(r.ingredientName, post.ingredientName)
    );
  };

  const toggleRequest = (id: string) => {
    const post = friendPosts.find((p) => p.id === id);
    if (!post) return;

    const nextRequested = !post.requested;
    const reqId = outgoingRequestIdForFriendPost(id);

    setFriendPosts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, requested: nextRequested } : p
      )
    );

    setExchangeRequests((prev) => {
      if (nextRequested) {
        if (prev.some((r) => r.id === reqId)) return prev;
        const row: IngredientExchangeRequest = {
          id: reqId,
          direction: "outgoing",
          counterpartyName: post.friendName,
          counterpartyInitials: post.friendInitials,
          ingredientName: post.ingredientName,
          ingredientEmoji: post.ingredientEmoji,
          quantity: post.quantity,
          status: "pending",
        };
        return [...prev, row];
      }
      return prev.filter((r) => r.id !== reqId);
    });
  };

<<<<<<< HEAD
  const visiblePosts = friendPosts.filter((p) => !hasOutgoingRequestForPost(p));
  const urgentPosts = visiblePosts.filter((p) => p.urgency === "red");
  const otherPosts = visiblePosts.filter((p) => p.urgency !== "red");
=======
  const availablePosts = posts
    .map((p) => ({
      ...p,
      requested: p.requested || hasOutgoingRequestForPost(p),
    }))
    .filter((p) => !p.requested);

  const urgentPosts = availablePosts.filter((p) => p.urgency === "red");
  const otherPosts = availablePosts.filter((p) => p.urgency !== "red");
>>>>>>> aws

  const outgoing = exchangeRequests.filter((r) => r.direction === "outgoing");
  const incoming = exchangeRequests.filter((r) => r.direction === "incoming");

  const resolveIncoming = (id: string, status: Exclude<ExchangeRequestStatus, "pending">) => {
    setExchangeRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );
  };

  return (
    <div className="flex flex-col gap-7 px-6 pt-5 pb-2">
      <div>
        <h1 className="font-display text-[34px] leading-[1.1] tracking-[-0.01em] text-stone-900">
          Community Pantry.
        </h1>
        <p className="text-[13px] text-stone-500 mt-3">
          Claim what&apos;s expiring or share your surplus.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          {(
            [
              ["available", "From friends"],
              ["mine", "My posts"],
              ["requests", "Requests"],
            ] as const
          ).map(([id, label]) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`flex-1 min-w-0 py-2.5 rounded-full text-[12px] font-medium border ${
                  active
                    ? `bg-stone-900 text-white border-stone-900 ${pressDark}`
                    : `bg-white text-stone-700 border-stone-300 ${pressOutline}`
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {tab === "available" ? (
        <div className="flex flex-col gap-1">
          {urgentPosts.length > 0 && (
            <>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <h2 className="text-[10px] uppercase tracking-[0.18em] text-stone-500 font-medium">
                  Expiring soon
                </h2>
              </div>
              <div className="flex flex-col gap-3 mb-4">
                {urgentPosts.map((post, i) => (
                  <FriendPostCard
                    key={post.id}
                    post={post}
                    avatarColor={avatarTints[i % avatarTints.length]}
                    onToggleRequest={toggleRequest}
                  />
                ))}
              </div>
            </>
          )}

          {otherPosts.length > 0 && (
            <>
              <div className="flex items-center gap-2 mb-3 mt-2">
                <span className="w-1.5 h-1.5 rounded-full bg-stone-300" />
                <h2 className="text-[10px] uppercase tracking-[0.18em] text-stone-500 font-medium">
                  Surplus available
                </h2>
              </div>
              <div className="flex flex-col gap-3">
                {otherPosts.map((post, i) => (
                  <FriendPostCard
                    key={post.id}
                    post={post}
                    avatarColor={
                      avatarTints[(i + urgentPosts.length) % avatarTints.length]
                    }
                    onToggleRequest={toggleRequest}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      ) : tab === "mine" ? (
        <div className="flex flex-col gap-3">
          <div className="border border-stone-200 rounded-2xl px-4 py-3.5">
            <p className="text-[12px] text-stone-600 leading-relaxed">
              <span className="font-medium text-stone-900">Auto-share:</span>{" "}
              items expiring within 2 days appear here automatically. You can
              also share surplus manually from your pantry.
            </p>
          </div>

          {mySharedIngredients.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3 text-stone-400">
              <span className="text-3xl opacity-50">🫙</span>
              <p className="text-[13px] font-medium text-stone-600">
                Nothing shared yet
              </p>
              <p className="text-[11px] text-center px-8 leading-relaxed">
                Items expiring in 2 days or less will appear here automatically.
              </p>
            </div>
          ) : (
            mySharedIngredients.map((ing, idx) => (
              <div
                key={ing.id}
                className={`flex items-center gap-4 py-3.5 ${
                  idx !== 0 ? "border-t border-stone-100" : ""
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-stone-50 flex items-center justify-center text-2xl flex-shrink-0">
                  {ing.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${urgencyDot[ing.urgency]}`}
                    />
                    <p className="text-[15px] text-stone-900 font-medium truncate">
                      {ing.name}
                    </p>
                  </div>
                  <p className="text-[12px] text-stone-400 mt-0.5 ml-3.5">
                    {ing.count > 1 ? `${ing.count} × ` : ""}
                    {ing.quantity} {ing.unit}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span
                    className={`text-[13px] tabular-nums font-medium ${urgencyText[ing.urgency]}`}
                  >
                    {ing.daysLeft <= 1 ? "Today" : `${ing.daysLeft}d`}
                  </span>
                  {ing.autoShared && (
                    <span className="text-[10px] text-stone-400 tracking-wide">
                      Auto
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <p className="text-[12px] text-stone-500 leading-relaxed">
            Track ingredient requests you&apos;ve sent and requests friends have
            sent you.
          </p>

          {outgoing.length > 0 && (
            <section>
              <h2 className="text-[10px] uppercase tracking-[0.18em] text-stone-500 font-medium mb-3">
                You requested
              </h2>
              <div className="flex flex-col gap-3">
                {outgoing.map((r) => (
                  <ExchangeRequestRow key={r.id} request={r} />
                ))}
              </div>
            </section>
          )}

          {incoming.length > 0 && (
            <section>
              <h2 className="text-[10px] uppercase tracking-[0.18em] text-stone-500 font-medium mb-3">
                Requested from you
              </h2>
              <div className="flex flex-col gap-3">
                {incoming.map((r) => (
                  <ExchangeRequestRow
                    key={r.id}
                    request={r}
                    onResolveIncoming={
                      r.status === "pending"
                        ? (resolution) => resolveIncoming(r.id, resolution)
                        : undefined
                    }
                  />
                ))}
              </div>
            </section>
          )}

          {outgoing.length === 0 && incoming.length === 0 && (
            <p className="text-[13px] text-stone-500 text-center py-12">
              No requests yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ExchangeRequestRow({
  request,
  onResolveIncoming,
}: {
  request: IngredientExchangeRequest;
  /** When set (incoming + pending), row shows Accept / Decline instead of a static Pending pill. */
  onResolveIncoming?: (
    resolution: Exclude<ExchangeRequestStatus, "pending">
  ) => void;
}) {
  const label =
    request.direction === "outgoing"
      ? `From ${request.counterpartyName}`
      : `${request.counterpartyName} asked you`;

  const showIncomingActions =
    request.direction === "incoming" &&
    request.status === "pending" &&
    onResolveIncoming;

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-semibold flex-shrink-0 bg-stone-100 text-stone-700`}
          >
            {request.counterpartyInitials}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-stone-500">{label}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xl">{request.ingredientEmoji}</span>
              <p className="text-[14px] font-medium text-stone-900 truncate">
                {request.ingredientName}
              </p>
            </div>
            <p className="text-[11px] text-stone-400 mt-0.5">{request.quantity}</p>
          </div>
        </div>
        {!showIncomingActions && (
          <span
            className={`text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full border flex-shrink-0 ${statusStyle[request.status]}`}
          >
            {request.status === "pending"
              ? "Pending"
              : request.status === "approved"
              ? "Approved"
              : "Declined"}
          </span>
        )}
      </div>

      {showIncomingActions && (
        <div className="flex gap-2 mt-4 pt-3 border-t border-stone-100">
          <button
            type="button"
            onClick={() => onResolveIncoming("declined")}
            className={`flex-1 py-2.5 rounded-full text-[12px] font-medium border border-stone-300 bg-white text-stone-800 ${pressOutline}`}
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => onResolveIncoming("approved")}
            className={`flex-1 py-2.5 rounded-full text-[12px] font-medium bg-stone-900 text-white ${pressDark}`}
          >
            Accept
          </button>
        </div>
      )}
    </div>
  );
}

function FriendPostCard({
  post,
  avatarColor,
  onToggleRequest,
}: {
  post: FriendPost;
  avatarColor: string;
  onToggleRequest: (id: string) => void;
}) {
  const uDot: Record<UrgencyLevel, string> = {
    red: "bg-red-500",
    yellow: "bg-amber-400",
    green: "bg-emerald-500",
  };

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-4">
      <div className="flex items-center gap-3 mb-3.5">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-semibold ${avatarColor}`}
        >
          {post.friendInitials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-medium text-stone-900 truncate">
            {post.friendName}
          </p>
          <p className="text-[11px] text-stone-500">
            {post.isAutoShared ? "Sharing expiring item" : "Sharing surplus"}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${uDot[post.urgency]}`} />
          <span className="text-[11px] text-stone-600 tabular-nums">
            {post.daysLeft <= 1 ? "1 day" : `${post.daysLeft} days`}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-3 border-t border-stone-100">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl flex-shrink-0">{post.ingredientEmoji}</span>
          <div className="min-w-0">
            <p className="text-[14px] font-medium text-stone-900 truncate">
              {post.ingredientName}
            </p>
            <p className="text-[11px] text-stone-400">{post.quantity}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onToggleRequest(post.id)}
          className={`px-4 py-2 rounded-full text-[12px] font-medium flex-shrink-0 ${
            post.requested
              ? `bg-white text-stone-700 border border-stone-300 ${pressOutline}`
              : `bg-stone-900 text-white ${pressDark}`
          }`}
        >
          {post.requested ? "Requested" : "Request"}
        </button>
      </div>
    </div>
  );
}
