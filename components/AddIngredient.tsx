"use client";
import React, { useRef, useState } from "react";
import { Ingredient, UrgencyLevel } from "./types";
import { getDaysLeft, getUrgency, parseAddBatchCount } from "./ingredientUtils";
import { pressDark, pressOutline } from "./pressableStyles";
import {
<<<<<<< HEAD
  DetectedIngredient,
=======
  type DetectedIngredient,
>>>>>>> aws
  fetchDetectedIngredients,
} from "./fetchDetectedIngredients";

interface AddIngredientProps {
  onAdd: (ingredient: Ingredient, options?: { stayOnAddTab?: boolean }) => void;
<<<<<<< HEAD
=======
}

interface ReviewIngredient {
  id: string;
  name: string;
  count: number;
>>>>>>> aws
}

const EMOJI_MAP: Record<string, string> = {
  spinach: "🥬", strawberr: "🍓", tomato: "🍅", carrot: "🥕",
  cheese: "🧀", egg: "🥚", milk: "🥛", flour: "🌾", bread: "🍞",
  chicken: "🍗", beef: "🥩", fish: "🐟", rice: "🍚", pasta: "🍝",
  apple: "🍎", banana: "🍌", lemon: "🍋", onion: "🧅", garlic: "🧄",
  pepper: "🫑", broccoli: "🥦", potato: "🥔", mushroom: "🍄", butter: "🧈",
  yogurt: "🫙", orange: "🍊", blueberr: "🫐", avocado: "🥑",
  soup: "🥫",
};

function getEmoji(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, emoji] of Object.entries(EMOJI_MAP)) {
    if (lower.includes(key)) return emoji;
  }
  return "🛒";
}

const urgencyDot: Record<UrgencyLevel, string> = {
  red: "bg-red-500",
  yellow: "bg-amber-400",
  green: "bg-emerald-500",
};

const urgencyText: Record<UrgencyLevel, string> = {
  red: "text-red-600",
  yellow: "text-amber-600",
  green: "text-emerald-700",
};

export default function AddIngredient({ onAdd }: AddIngredientProps) {
  const [tab, setTab] = useState<"manual" | "scan">("manual");
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("count");
  const [expiryDate, setExpiryDate] = useState("");
  const [estimatedValue, setEstimatedValue] = useState("");
  const [success, setSuccess] = useState(false);
  const [scanning, setScanning] = useState(false);
<<<<<<< HEAD
  const [scanError, setScanError] = useState("");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewItems, setReviewItems] = useState<
    Array<{ id: string; name: string; count: number }>
  >([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
=======
  const [scanError, setScanError] = useState<string | null>(null);
  const [detectedNames, setDetectedNames] = useState<string[]>([]);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewItems, setReviewItems] = useState<ReviewIngredient[]>([]);

  const estimateShelfLifeDays = (ingredientName: string): number => {
    const lower = ingredientName.toLowerCase();
    if (lower.includes("berry") || lower.includes("spinach") || lower.includes("lettuce")) {
      return 4;
    }
    if (lower.includes("mushroom") || lower.includes("milk") || lower.includes("juice")) {
      return 6;
    }
    if (lower.includes("apple") || lower.includes("orange") || lower.includes("onion")) {
      return 12;
    }
    if (lower.includes("potato") || lower.includes("garlic")) {
      return 20;
    }
    return 7;
  };

  const toBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Unable to read selected image."));
      reader.onload = () => {
        const dataUrl = String(reader.result ?? "");
        const base64 = dataUrl.split(",")[1] ?? "";
        if (!base64) {
          reject(new Error("Unable to process selected image."));
          return;
        }
        resolve(base64);
      };
      reader.readAsDataURL(file);
    });
  };

  const addDetectedIngredient = (ingredientName: string, amount: number) => {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + estimateShelfLifeDays(ingredientName));
    const expiryIso = expiry.toISOString().split("T")[0];
    const days = getDaysLeft(expiryIso);
    const urgency = getUrgency(days);
    const count = Math.max(1, Math.floor(amount));

    const newIngredient: Ingredient = {
      id: `${Date.now()}-${ingredientName}`,
      name: ingredientName,
      quantity: String(count),
      unit: "count",
      count,
      expiryDate: expiryIso,
      daysLeft: days,
      urgency,
      estimatedValue: 0,
      emoji: getEmoji(ingredientName),
      isShared: urgency === "red",
      autoShared: urgency === "red",
    };

    onAdd(newIngredient, { stayOnAddTab: true });
  };

  const addBlankReviewItem = () => {
    setReviewItems((prev) => [
      ...prev,
      { id: `${Date.now()}-${prev.length}`, name: "", count: 1 },
    ]);
  };

  const applyReviewedItems = () => {
    const cleaned = reviewItems
      .map((item) => ({
        name: item.name.trim(),
        count: Math.max(1, Math.floor(item.count)),
      }))
      .filter((item) => item.name.length > 0);

    if (cleaned.length === 0) {
      setScanError("Add at least one item before saving.");
      return;
    }

    cleaned.forEach((item) => addDetectedIngredient(item.name, item.count));
    setDetectedNames(
      cleaned.map((item) => `${item.count} ${item.name}${item.count > 1 ? "s" : ""}`)
    );
    setReviewOpen(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };
>>>>>>> aws

  const handleAdd = () => {
    if (!name || !expiryDate) return;
    const days = getDaysLeft(expiryDate);
    const urgency = getUrgency(days);
    const isCountableUnit = unit === "count" || unit === "bag";
    const lineCount = isCountableUnit ? parseAddBatchCount(quantity || "1") : 1;
    const newIngredient: Ingredient = {
      id: Date.now().toString(),
      name,
      quantity: quantity || "1",
      unit,
      count: lineCount,
      expiryDate,
      daysLeft: days,
      urgency,
      estimatedValue: parseFloat(estimatedValue) || 0,
      emoji: getEmoji(name),
      isShared: urgency === "red",
      autoShared: urgency === "red",
    };
    onAdd(newIngredient);
    setName(""); setQuantity(""); setExpiryDate(""); setEstimatedValue("");
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

<<<<<<< HEAD
  const estimateShelfLifeDays = (itemName: string): number => {
    const n = itemName.toLowerCase();
    if (n.includes("banana") || n.includes("berry")) return 3;
    if (n.includes("spinach") || n.includes("lettuce")) return 4;
    if (n.includes("tomato") || n.includes("avocado")) return 5;
    if (n.includes("apple") || n.includes("orange")) return 10;
    if (n.includes("onion") || n.includes("potato")) return 14;
    return 7;
  };

  const buildIngredientFromDetected = (item: DetectedIngredient): Ingredient => {
    const days = estimateShelfLifeDays(item.name);
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + days);
    const expiryIso = expiry.toISOString().split("T")[0];
    const urgency = getUrgency(getDaysLeft(expiryIso));
    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: item.name,
      quantity: String(item.count),
      unit: "count",
      count: Math.max(1, item.count),
      expiryDate: expiryIso,
      daysLeft: getDaysLeft(expiryIso),
      urgency,
      estimatedValue: Number((Math.max(1, item.count) * 1.5).toFixed(2)),
      emoji: getEmoji(item.name),
      isShared: urgency === "red",
      autoShared: urgency === "red",
    };
  };

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const raw = String(reader.result ?? "");
        const b64 = raw.includes(",") ? raw.split(",")[1] : raw;
        resolve(b64);
      };
      reader.onerror = () => reject(reader.error ?? new Error("Unable to read image"));
      reader.readAsDataURL(file);
    });

  const handleScanUpload = async (file: File) => {
    setScanError("");
    setScanning(true);
    try {
      const imageBase64 = await toBase64(file);
      const detected = await fetchDetectedIngredients(imageBase64);
      if (!detected.length) {
        setScanError("No ingredients were detected. Try a clearer grocery photo.");
        return;
      }
      setReviewItems(
        detected.map((d, idx) => ({
          id: `${Date.now()}-${idx}`,
          name: d.name,
          count: Math.max(1, d.count),
=======
  const handleScanUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setScanError(null);
    setDetectedNames([]);
    setScanning(true);
    try {
      const base64 = await toBase64(file);
      const detected = await fetchDetectedIngredients(base64);

      if (detected.length === 0) {
        setScanError("No ingredients were detected. Try a clearer grocery photo.");
        return;
      }

      setReviewItems(
        detected.map((item: DetectedIngredient, idx) => ({
          id: `${Date.now()}-${idx}-${item.name}`,
          name: item.name,
          count: Math.max(1, item.count),
>>>>>>> aws
        }))
      );
      setReviewOpen(true);
    } catch (error) {
<<<<<<< HEAD
      setScanError(error instanceof Error ? error.message : "Scan failed.");
    } finally {
      setScanning(false);
    }
  };

  const saveReviewedItems = () => {
    const cleaned = reviewItems
      .map((x) => ({ ...x, name: x.name.trim(), count: Math.max(1, Math.floor(x.count || 1)) }))
      .filter((x) => x.name.length > 0);
    for (const item of cleaned) {
      onAdd(buildIngredientFromDetected(item), { stayOnAddTab: true });
    }
    setReviewOpen(false);
    setReviewItems([]);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
=======
      setScanError(
        error instanceof Error
          ? error.message
          : "Scan failed. Check AWS credentials and try again."
      );
    } finally {
      setScanning(false);
      event.target.value = "";
    }
>>>>>>> aws
  };

  const inputClass =
    "w-full bg-transparent border-0 border-b border-stone-200 focus:border-stone-900 px-0 py-3 text-[15px] font-normal text-stone-900 placeholder-stone-300 focus:outline-none focus:ring-0 transition-colors";

  return (
    <div className="flex flex-col gap-7 px-6 pt-5 pb-2">
      {reviewOpen && (
        <div className="fixed inset-0 z-[130] flex items-end justify-center bg-stone-900/40">
          <button
            type="button"
            aria-label="Close review"
            className="absolute inset-0 z-0"
            onClick={() => setReviewOpen(false)}
          />
          <div className="relative z-10 w-full max-w-sm bg-white rounded-t-[28px] shadow-2xl max-h-[88vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-stone-100">
              <h2 className="font-display text-[22px] text-stone-900">Review scan</h2>
              <button
                type="button"
                onClick={() => setReviewOpen(false)}
                className={`text-[13px] font-semibold text-stone-900 rounded-lg px-3 py-1.5 ${pressOutline}`}
              >
                Close
              </button>
            </div>
            <div className="overflow-y-auto px-6 py-5 pb-6 flex flex-col gap-3">
              {reviewItems.map((item) => (
                <div key={item.id} className="grid grid-cols-[1fr_78px_32px] gap-2 items-center">
                  <div className="relative">
                    <span
                      aria-hidden
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-[2px] h-5 bg-stone-900/80 animate-pulse"
                    />
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) =>
                        setReviewItems((prev) =>
                          prev.map((x) =>
                            x.id === item.id ? { ...x, name: e.target.value } : x
                          )
                        )
                      }
                      placeholder="Ingredient name"
                      className="w-full border border-stone-300 rounded-xl pl-7 pr-3 py-2 text-[14px] text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-900 caret-stone-900"
                    />
                  </div>
                  <input
                    type="number"
                    min={1}
                    value={item.count}
                    onChange={(e) =>
                      setReviewItems((prev) =>
                        prev.map((x) =>
                          x.id === item.id
                            ? { ...x, count: Number(e.target.value) || 1 }
                            : x
                        )
                      )
                    }
                    className="border border-stone-300 rounded-xl px-2 py-2 text-[14px] text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-900 caret-stone-900 text-center"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setReviewItems((prev) => prev.filter((x) => x.id !== item.id))
                    }
                    className={`text-stone-400 text-[18px] leading-none rounded-md ${pressOutline}`}
                    aria-label="Remove item"
                  >
                    ×
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={addBlankReviewItem}
                className={`mt-1 py-2.5 rounded-full text-[12px] font-medium border border-stone-300 text-stone-700 ${pressOutline}`}
              >
                + Add missing item
              </button>
            </div>
            <div className="px-6 pb-6 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={applyReviewedItems}
                className={`w-full py-3 rounded-full text-[13px] font-medium bg-stone-900 text-white ${pressDark}`}
              >
                Add reviewed items
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Title */}
      <div>
        <h1 className="font-display text-[34px] leading-[1.1] tracking-[-0.01em] text-stone-900">
          Add to pantry.
        </h1>
      </div>

      <div className="grid grid-cols-2 bg-stone-100 rounded-full p-1 gap-1">
        <button
          type="button"
          onClick={() => setTab("manual")}
          className={`rounded-full py-2 text-[12px] font-medium transition ${
            tab === "manual"
              ? `bg-white text-stone-900 shadow-sm ${pressOutline}`
              : "text-stone-500"
          }`}
        >
          Manual
        </button>
        <button
          type="button"
          onClick={() => setTab("scan")}
          className={`rounded-full py-2 text-[12px] font-medium transition ${
            tab === "scan"
              ? `bg-white text-stone-900 shadow-sm ${pressOutline}`
              : "text-stone-500"
          }`}
        >
          Scan
        </button>
      </div>

      {tab === "scan" ? (
        <div className="flex flex-col gap-4">
          <div className="bg-stone-50 rounded-[22px] aspect-[4/3] flex flex-col items-center justify-center gap-4 border border-stone-200">
            {scanning ? (
              <>
                <div className="w-10 h-10 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
                <p className="text-[13px] text-stone-600 font-medium tracking-wide">
                  Scanning...
                </p>
              </>
            ) : (
              <>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#57534e" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="6" width="18" height="14" rx="2" />
                  <circle cx="12" cy="13" r="3.5" />
                  <path d="M9 6l1.5-2h3L15 6" />
                </svg>
                <p className="text-[13px] text-stone-500 text-center px-6 leading-relaxed">
                  Upload a grocery photo to
                  <br />
<<<<<<< HEAD
                  detect ingredients.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      void handleScanUpload(file);
                    }
                    e.currentTarget.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`bg-stone-900 text-white px-6 py-2.5 rounded-full text-[13px] font-medium ${pressDark}`}
                >
                  Choose photo
                </button>
                {scanError && <p className="text-[12px] text-red-600 px-6 text-center">{scanError}</p>}
=======
                  pantry, or grocery cart.
                </p>
                <label
                  className={`bg-stone-900 text-white px-6 py-2.5 rounded-full text-[13px] font-medium cursor-pointer ${pressDark}`}
                >
                  Upload grocery photo
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleScanUpload}
                  />
                </label>
>>>>>>> aws
              </>
            )}
          </div>
          {detectedNames.length > 0 && (
            <p className="text-[12px] text-emerald-700 leading-relaxed text-center px-4">
              Added to pantry: {detectedNames.join(", ")}
            </p>
          )}
          {scanError && (
            <p className="text-[12px] text-red-600 leading-relaxed text-center px-4">
              {scanError}
            </p>
          )}
          <p className="text-[12px] text-stone-500 leading-relaxed text-center px-4">
<<<<<<< HEAD
            Scan results open in a review screen where you can edit counts and names before saving.
=======
            AI identifies ingredients and adds them with default values. Edit dates and quantities after scan.
>>>>>>> aws
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Name */}
          <div>
            <label className="text-[10px] uppercase tracking-[0.15em] text-stone-400 font-medium">
              Ingredient
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Baby spinach"
              className={inputClass}
            />
            {name && (
              <p className="text-[11px] text-stone-400 mt-1.5 flex items-center gap-1.5">
                <span>{getEmoji(name)}</span>
                <span>
                  {getEmoji(name) !== "🥫" ? "Recognized" : "Will use generic icon"}
                </span>
              </p>
            )}
          </div>

          {/* Quantity + Unit */}
          <div className="flex gap-5">
            <div className="flex-1">
              <label className="text-[10px] uppercase tracking-[0.15em] text-stone-400 font-medium">
                Quantity
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="1"
                className={inputClass}
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] uppercase tracking-[0.15em] text-stone-400 font-medium">
                Unit
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className={`${inputClass} appearance-none cursor-pointer text-stone-700`}
              >
                {["count", "oz", "lbs", "kg", "g", "pint", "bag", "gallon", "cup", "bunch"].map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Expiry */}
          <div>
            <label className="text-[10px] uppercase tracking-[0.15em] text-stone-400 font-medium">
              Expires
            </label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className={`${inputClass} text-stone-700`}
            />
            {expiryDate && (
              <div className="mt-2 flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${urgencyDot[getUrgency(getDaysLeft(expiryDate))]}`} />
                <span className={`text-[12px] font-medium ${urgencyText[getUrgency(getDaysLeft(expiryDate))]}`}>
                  {getDaysLeft(expiryDate) <= 0
                    ? "Expires today"
                    : `${getDaysLeft(expiryDate)} days left`}
                </span>
                {getUrgency(getDaysLeft(expiryDate)) === "red" && (
                  <span className="text-[11px] text-stone-400">
                    · Will auto-share
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Value */}
          <div>
            <label className="text-[10px] uppercase tracking-[0.15em] text-stone-400 font-medium">
              Estimated value
            </label>
<<<<<<< HEAD
            <div className="relative flex items-center">
              <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[15px] text-stone-400">
=======
            <div className="flex items-center gap-1 border-b border-stone-200">
              <span className="text-[15px] text-stone-400 pt-[1px]">
>>>>>>> aws
                $
              </span>
              <input
                type="number"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(e.target.value)}
                placeholder="0.00"
                step="0.01"
<<<<<<< HEAD
                className={`${inputClass} pl-4 tabular-nums`}
=======
                className="flex-1 bg-transparent py-3 text-[15px] text-stone-900 placeholder-stone-300 focus:outline-none"
>>>>>>> aws
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="button"
            onClick={handleAdd}
            disabled={!name || !expiryDate}
            className={`w-full bg-stone-900 disabled:bg-stone-200 disabled:text-stone-400 disabled:active:scale-100 text-white font-medium py-3.5 rounded-full text-[13px] tracking-wide mt-2 ${pressDark}`}
          >
            {success ? "Added ✓" : "Add to pantry"}
          </button>
        </div>
      )}

      {reviewOpen && (
        <div className="fixed inset-0 z-[121] flex items-end justify-center bg-stone-900/40">
          <button type="button" className="absolute inset-0" onClick={() => setReviewOpen(false)} aria-label="Close review" />
          <div className="relative z-10 w-full max-w-sm bg-white rounded-t-[28px] shadow-2xl px-6 pt-6 pb-8 max-h-[88vh] overflow-y-auto">
            <h2 className="font-display text-[24px] text-stone-900">Review scanned items</h2>
            <p className="text-[12px] text-stone-500 mt-1">Edit anything before adding to pantry.</p>
            <div className="mt-4 flex flex-col gap-2">
              {reviewItems.map((item) => (
                <div key={item.id} className="grid grid-cols-[1fr_78px_32px] gap-2 items-center">
                  <div className="relative">
                    <span aria-hidden className="absolute left-3 top-1/2 -translate-y-1/2 w-[2px] h-5 bg-stone-900/80 animate-pulse" />
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) =>
                        setReviewItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, name: e.target.value } : x)))
                      }
                      placeholder="Ingredient name"
                      className="w-full border border-stone-300 rounded-xl pl-7 pr-3 py-2 text-[14px] text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-900 caret-stone-900"
                    />
                  </div>
                  <input
                    type="number"
                    min={1}
                    value={item.count}
                    onChange={(e) =>
                      setReviewItems((prev) =>
                        prev.map((x) => (x.id === item.id ? { ...x, count: Math.max(1, Number(e.target.value) || 1) } : x))
                      )
                    }
                    className="border border-stone-300 rounded-xl px-2 py-2 text-[14px] text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-900 caret-stone-900 text-center"
                  />
                  <button
                    type="button"
                    onClick={() => setReviewItems((prev) => prev.filter((x) => x.id !== item.id))}
                    className={`h-9 rounded-lg border border-stone-300 text-stone-500 ${pressOutline}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() =>
                setReviewItems((prev) => [
                  ...prev,
                  { id: `${Date.now()}-${Math.random()}`, name: "", count: 1 },
                ])
              }
              className={`w-full mt-3 py-2.5 rounded-xl border border-stone-300 text-[13px] text-stone-700 ${pressOutline}`}
            >
              + Add missing item
            </button>
            <button type="button" onClick={saveReviewedItems} className={`w-full mt-3 py-3.5 rounded-full bg-stone-900 text-white text-[13px] font-medium ${pressDark}`}>
              Save to pantry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
