import { NextResponse } from "next/server";
import { fetchRecipesForPantry } from "@/lib/theMealDbRecipes";
import type { UrgencyLevel } from "@/components/types";

export const runtime = "nodejs";

type Body = {
  ingredients?: { name: string; urgency: UrgencyLevel }[];
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const items = body.ingredients;
    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: "Expected { ingredients: { name, urgency }[] }" },
        { status: 400 }
      );
    }
    const recipes = await fetchRecipesForPantry(items);
    return NextResponse.json(recipes);
  } catch {
    return NextResponse.json([]);
  }
}
