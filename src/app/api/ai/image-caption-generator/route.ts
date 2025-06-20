import { NextResponse } from "next/server";
import { z } from "zod";
import { getAIInstance } from "@/server/utils";
import { db } from "@/server/db";
import { generateText } from "ai";

const bodySchema = z.object({
  imageUrl: z.string().url(),
});

export async function POST(req: Request) {
  try {
    const bodyRaw: unknown = await req.json();
    const { imageUrl } = bodySchema.parse(bodyRaw);

    // Fetch AI model settings from DB
    const settings = await db.query.settings.findFirst();
    const ai = settings?.general?.ai;
    if (!ai) {
      return NextResponse.json({ error: "AI model settings not found" }, { status: 500 });
    }
    const enabledModels = Array.isArray(ai.enabledModels) ? ai.enabledModels : [];
    if (!ai.apiKey || enabledModels.length === 0) {
      return NextResponse.json({ error: "No AI model enabled or API key missing" }, { status: 500 });
    }

    // Get AI instance
    const { instance, model } = await getAIInstance({
      apiKey: ai.apiKey,
      enabledModels,
    });

    // Only OpenAI (gpt-4o, gpt-4-vision, etc.) supports image captioning in this setup
    if (model.provider !== "openai") {
      return NextResponse.json({ error: `Selected model (${model.name}) does not support image captioning.` }, { status: 400 });
    }

    // Use generateText for multimodal (image+text) prompt
    const prompt = "Describe this image in a single, concise caption.";
    let caption = "";
    try {
      const result = await generateText({
        model: instance,
        maxTokens: 60,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image", image: new URL(imageUrl) },
            ],
          },
        ],
      });
      caption = result?.text || "";
    } catch (err) {
      return NextResponse.json({ error: "Failed to generate caption: " + (err instanceof Error ? err.message : String(err)) }, { status: 500 });
    }

    if (!caption) {
      return NextResponse.json({ error: "No caption generated." }, { status: 500 });
    }

    return NextResponse.json({ caption });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
} 