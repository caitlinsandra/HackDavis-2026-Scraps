import { NextResponse } from "next/server";
import {
  DetectLabelsCommand,
  RekognitionClient,
} from "@aws-sdk/client-rekognition";
import {
  isLikelyGroceryLabel,
  toDetectedIngredients,
} from "@/lib/rekognitionIngredients";

export const runtime = "nodejs";

type Body = {
  imageBase64?: string;
};

type DetectedItem = {
  name: string;
  count: number;
};

const FOOD_PARENT_HINTS = new Set([
  "food and beverage",
  "food",
  "produce",
  "fruit",
  "vegetable",
  "meal",
  "dish",
  "drink",
]);

function getRekognitionClient() {
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!region) {
    return null;
  }

  if (!accessKeyId || !secretAccessKey) {
    // Fall back to AWS default credential provider chain:
    // env vars, shared config/credentials files, IAM role, etc.
    return new RekognitionClient({ region });
  }

  return new RekognitionClient({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

function getCustomModelConfig() {
  const projectVersionArn = process.env.AWS_REKOGNITION_PROJECT_VERSION_ARN?.trim();
  const minConfidenceRaw = process.env.AWS_REKOGNITION_CUSTOM_MIN_CONFIDENCE?.trim();
  const minConfidence =
    minConfidenceRaw && !Number.isNaN(Number(minConfidenceRaw))
      ? Number(minConfidenceRaw)
      : 55;

  if (!projectVersionArn) return null;
  return { projectVersionArn, minConfidence };
}

function mergeDetectedItems(
  primary: DetectedItem[],
  supplements: DetectedItem[]
): DetectedItem[] {
  const byName = new Map<string, number>();
  for (const item of primary) {
    byName.set(item.name, Math.max(1, item.count));
  }
  for (const item of supplements) {
    if (byName.has(item.name)) continue;
    byName.set(item.name, Math.max(1, item.count));
  }
  return [...byName.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const imageBase64 = body.imageBase64?.trim();
    if (!imageBase64) {
      return NextResponse.json(
        { error: "Expected { imageBase64: string }" },
        { status: 400 }
      );
    }

    const client = getRekognitionClient();
    if (!client) {
      return NextResponse.json(
        { error: "AWS_REGION is missing on the server." },
        { status: 500 }
      );
    }

    const command = new DetectLabelsCommand({
      Image: {
        Bytes: Buffer.from(imageBase64, "base64"),
      },
      MaxLabels: 60,
      MinConfidence: 45,
    });

    const response = await client.send(command);
    const customConfig = getCustomModelConfig();

    if (customConfig) {
      const customResponse = await client.send(
        new DetectCustomLabelsCommand({
          ProjectVersionArn: customConfig.projectVersionArn,
          Image: { Bytes: Buffer.from(imageBase64, "base64") },
          MinConfidence: customConfig.minConfidence,
        })
      );

      const customIngredients = toDetectedIngredients(
        (customResponse.CustomLabels ?? []).map((label) => ({
          // Class names should come from your trained dataset labels.
          name: label.Name ?? "",
          // One bounding box per detected item enables per-item counting.
          instanceCount: label.Geometry?.BoundingBox ? 1 : 0,
          confidence: label.Confidence ?? 0,
        })),
        {
          allowUncounted: false,
          minConfidence: customConfig.minConfidence,
        }
      ).slice(0, 20);

      if (customIngredients.length > 0) {
        return NextResponse.json({
          ingredients: customIngredients,
          labels: customIngredients.map((item) => item.name),
          detector: "rekognition-custom-labels",
        });
      }
    }

    const allLabels = response.Labels ?? [];
    const foodLikely = allLabels
      .filter((label) => {
        const parents = label.Parents ?? [];
        return parents.some((parent) =>
          FOOD_PARENT_HINTS.has((parent.Name ?? "").toLowerCase())
        );
      })
      .map((label) => ({
        name: label.Name ?? "",
        instanceCount: label.Instances?.length ?? 0,
        confidence: label.Confidence ?? 0,
      }));

    const base = allLabels.map((label) => ({
      name: label.Name ?? "",
      instanceCount: label.Instances?.length ?? 0,
      confidence: label.Confidence ?? 0,
    }));

    // Primary path: use concrete object instances for count accuracy.
    const instanceBased = toDetectedIngredients(foodLikely, {
      allowUncounted: false,
      minConfidence: 45,
    });

    // Supplement: keep likely produce labels with no instances (e.g. onions) as count=1.
    const highConfidenceFoodLabels = toDetectedIngredients(foodLikely, {
      allowUncounted: true,
      minConfidence: 65,
    }).filter((item) => isLikelyGroceryLabel(item.name));

    // Global fallback when food-parent hints are sparse.
    const highConfidenceGlobal = toDetectedIngredients(base, {
      allowUncounted: true,
      minConfidence: 75,
    }).filter((item) => isLikelyGroceryLabel(item.name));

    const ingredients = mergeDetectedItems(
      mergeDetectedItems(instanceBased, highConfidenceFoodLabels),
      highConfidenceGlobal
    ).slice(0, 12);

    return NextResponse.json({
      ingredients,
      labels: ingredients.map((item) => item.name),
      detector: "rekognition-detect-labels",
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Detection failed";
    console.error("Rekognition ingredient detection failed", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
