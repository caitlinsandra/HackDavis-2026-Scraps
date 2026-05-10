export interface DetectedIngredient {
  name: string;
  count: number;
}

export async function fetchDetectedIngredients(
  imageBase64: string
): Promise<DetectedIngredient[]> {
  const res = await fetch("/api/ingredients/detect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64 }),
  });

  const data = (await res.json()) as {
    ingredients?: unknown;
    labels?: unknown;
    error?: unknown;
  };
  if (!res.ok) {
    const message =
      typeof data.error === "string" ? data.error : "Ingredient detection failed.";
    throw new Error(message);
  }

  if (!Array.isArray(data.ingredients)) {
    return [];
  }

  return data.ingredients
    .filter(
      (value): value is { name: string; count?: number } =>
        !!value &&
        typeof value === "object" &&
        typeof (value as { name?: unknown }).name === "string"
    )
    .map((value) => ({
      name: value.name,
      count:
        typeof value.count === "number" && Number.isFinite(value.count)
          ? Math.max(1, Math.floor(value.count))
          : 1,
    }));
}
