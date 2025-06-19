import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { billing } from "@/server/db/schema/billing-schema";
import { usage } from "@/server/db/schema/usage-schema";
import { and, eq, or } from "drizzle-orm";
import { auth } from "@/server/auth";
import { getAIInstance } from "@/server/utils";

const inputSchema = z.object({
  text: z.string().min(5, "Text is too short for hashtag generation")
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user || typeof session.user.id !== 'string') {
      console.error('HashtagGen Error: Unauthorized', { session });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    // Get active billing (subscription) for the user
    const activeBillingResult = await db.query.billing.findFirst({
      where: and(
        eq(billing.userId, userId),
        or(eq(billing.status, "active"), eq(billing.status, "APPROVED")),
      ),
      with: { product: true },
    });
    let activeBilling: typeof activeBillingResult | undefined = undefined;
    if (
      activeBillingResult &&
      typeof activeBillingResult === 'object' &&
      activeBillingResult !== null &&
      'product' in activeBillingResult &&
      typeof (activeBillingResult as { product?: unknown }).product === 'object'
    ) {
      activeBilling = activeBillingResult;
    }
    if (!activeBilling?.product) {
      console.error('HashtagGen Error: No active subscription found', { userId, activeBillingResult });
      return NextResponse.json({ error: "No active subscription found" }, { status: 402 });
    }
    // Get usage for the current billing period
    const currentUsageResult = await db.query.usage.findFirst({
      where: and(
        eq(usage.userId, userId),
        eq(usage.productId, activeBilling.productId),
      ),
    });
    let currentUsage: { used?: number } | undefined = undefined;
    if (
      currentUsageResult &&
      typeof currentUsageResult === 'object' &&
      currentUsageResult !== null &&
      'used' in currentUsageResult &&
      typeof (currentUsageResult as { used?: unknown }).used === 'number'
    ) {
      currentUsage = { used: (currentUsageResult as { used: number }).used };
    }
    const used = currentUsage?.used ?? 0;
    const limit = activeBilling.product.limit ?? 0;
    if (limit > 0 && used >= limit) {
      console.error('HashtagGen Error: No credits left', { userId, used, limit });
      return NextResponse.json({ error: "No credits left" }, { status: 402 });
    }
    const bodyResult = await req.json();
    const isValidBody = (val: unknown): val is { text: string } =>
      typeof val === 'object' && val !== null && 'text' in val && typeof (val as { text?: unknown }).text === 'string';
    const body = isValidBody(bodyResult) ? bodyResult : { text: '' };
    const parsed = inputSchema.safeParse(body);
    if (!parsed.success) {
      console.error('HashtagGen Error: Invalid input', { body });
      return NextResponse.json({ error: parsed.error?.message ?? "Invalid input" }, { status: 400 });
    }
    // Increment usage
    if (currentUsage) {
      await db.update(usage)
        .set({ used: used + 1, updatedAt: new Date() })
        .where(and(eq(usage.userId, userId), eq(usage.productId, activeBilling.productId)));
    } else {
      await db.insert(usage).values({
        userId,
        productId: activeBilling.productId,
        used: 1,
      });
    }
    // Get OpenAI API key and enabled models from settings
    const settings = await db.query.settings.findFirst();
    const aiSettings = settings?.general?.ai;
    if (!aiSettings?.apiKey || !aiSettings.enabledModels || aiSettings.enabledModels.length === 0) {
      return NextResponse.json({ error: "OpenAI API key or enabled models not set in admin dashboard." }, { status: 500 });
    }
    const { instance: openaiInstance } = await getAIInstance({
      apiKey: aiSettings.apiKey,
      enabledModels: aiSettings.enabledModels,
    });
    // Call OpenAI or your AI provider
    const prompt = `Suggest 10 relevant, trending hashtags for the following post. Only return the hashtags, comma-separated, no explanations.\n\nPost: ${parsed.data.text}`;
    let hashtags: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const result = await openaiInstance.doGenerate({
      prompt: [
        { role: "user", content: [{ type: "text", text: prompt }] }
      ],
      inputFormat: "messages",
      mode: { type: "regular" },
      maxTokens: 100,
      temperature: 0.7,
    }) as unknown;
    let hashtagsRaw = '';
    if (
      typeof result === 'object' &&
      result !== null &&
      'generations' in result &&
      Array.isArray((result as { generations?: unknown }).generations) &&
      (result as { generations: unknown[] }).generations.length > 0
    ) {
      const gen0 = (result as { generations: unknown[] }).generations[0];
      if (
        typeof gen0 === 'object' &&
        gen0 !== null &&
        'text' in gen0 &&
        typeof (gen0 as { text?: unknown }).text === 'string'
      ) {
        hashtagsRaw = (gen0 as { text: string }).text;
      }
    } else if (
      typeof result === 'object' &&
      result !== null &&
      'text' in result &&
      typeof (result as { text?: unknown }).text === 'string'
    ) {
      hashtagsRaw = (result as { text: string }).text;
    } else {
      console.error('HashtagGen Error: AI result invalid', { result });
    }
    if (hashtagsRaw) {
      hashtags = hashtagsRaw
        .replace(/[#\n]/g, "")
        .split(/,|\s+/)
        .map((tag: string) => tag.trim().replace(/^#+/, ""))
        .filter(Boolean)
        .slice(0, 10);
    }
    return NextResponse.json({ hashtags });
  } catch (e) {
    let errorMsg = "Internal error";
    if (e instanceof Error) {
      errorMsg = e.message ?? errorMsg;
    } else if (typeof e === 'object' && e !== null && 'message' in e && typeof (e as { message?: unknown }).message === 'string') {
      errorMsg = (e as { message: string }).message ?? errorMsg;
    }
    console.error('HashtagGen Error: Exception thrown', { error: e });
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
} 