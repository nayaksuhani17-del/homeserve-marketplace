import { NextResponse } from "next/server";
import OpenAI from "openai";
import { SERVICE_CATEGORIES } from "@/lib/constants";

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      const fallback = guessCategory(message);
      return NextResponse.json({ category: fallback, fallback: true });
    }

    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You classify home service requests into exactly one category from this list: ${SERVICE_CATEGORIES.join(", ")}. Reply with ONLY the category name, nothing else.`,
        },
        { role: "user", content: message },
      ],
      max_tokens: 20,
      temperature: 0.2,
    });

    const category =
      completion.choices[0]?.message?.content?.trim() || guessCategory(message);

    const matched =
      SERVICE_CATEGORIES.find(
        (c) => c.toLowerCase() === category.toLowerCase()
      ) ?? guessCategory(message);

    return NextResponse.json({ category: matched });
  } catch {
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

function guessCategory(message: string): string {
  const lower = message.toLowerCase();
  const keywords: Record<string, string[]> = {
    Plumber: ["leak", "pipe", "sink", "toilet", "plumb", "drain", "faucet"],
    Electrician: ["electric", "wire", "outlet", "light", "power", "circuit"],
    "House Cleaning": ["clean", "maid", "dust", "sanitize"],
    "Carpet Cleaning": ["carpet", "rug", "stain"],
    Painting: ["paint", "wall", "color"],
    Cooking: ["cook", "chef", "meal", "kitchen food"],
    "Car Mechanic": ["car", "auto", "engine", "vehicle", "brake"],
    "Computer Repair": ["computer", "laptop", "pc", "wifi", "tech"],
    "Lawn Mowing": ["lawn", "grass", "yard", "mow", "garden"],
    "House Shifting": ["move", "shift", "relocate", "moving"],
  };

  for (const [category, words] of Object.entries(keywords)) {
    if (words.some((w) => lower.includes(w))) return category;
  }

  return "House Cleaning";
}
