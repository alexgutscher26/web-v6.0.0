"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, Check, Hash, Sparkles } from "lucide-react";
import { api } from "@/trpc/react";

export default function HashtagGeneratorPage() {
  const [input, setInput] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [allCopied, setAllCopied] = useState(false);
  
  const { data: usage, isLoading: usageLoading } = api.usage.getCurrentUsage.useQuery();

  const remainingCredits = usage?.limit && usage?.used 
    ? Math.max(0, usage.limit - usage.used) 
    : null;

  const handleGenerate = useCallback(async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    setError(null);
    setHashtags([]);
    setCopiedIndex(null);
    setAllCopied(false);

    try {
      const response = await fetch("/api/ai/hashtag-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input.trim() }),
      });

      if (!response.ok) {
        const errorDataRaw: unknown = await response.json().catch(() => ({}));
        let message = "Failed to generate hashtags";
        let errorData: Record<string, unknown> = {};
        if (errorDataRaw && typeof errorDataRaw === "object" && errorDataRaw !== null) {
          errorData = errorDataRaw as Record<string, unknown>;
        }
        if (
          "error" in errorData && typeof errorData.error === "string"
        ) {
          message = errorData.error;
        } else if (
          "message" in errorData && typeof errorData.message === "string"
        ) {
          message = errorData.message;
        }
        throw new Error(message);
      }

      const dataRaw: unknown = await response.json();
      let hashtagsArr: string[] = [];
      if (
        dataRaw &&
        typeof dataRaw === "object" &&
        "hashtags" in dataRaw &&
        Array.isArray((dataRaw as Record<string, unknown>).hashtags)
      ) {
        hashtagsArr = (dataRaw as { hashtags: unknown[] }).hashtags.filter(
          (tag): tag is string => typeof tag === "string" && tag.trim().length > 0
        );
      } else {
        throw new Error("Invalid response format");
      }
      const validHashtags = hashtagsArr
        .map(tag => tag.replace(/^#/, "").trim())
        .filter(tag => tag.length > 0);
      setHashtags(validHashtags);
    } catch (err) {
      let errorMessage = "Failed to generate hashtags";
      if (err instanceof Error) {
        errorMessage = err.message ?? errorMessage;
      } else if (
        typeof err === "object" &&
        err !== null &&
        "message" in err &&
        typeof (err as { message?: unknown }).message === "string"
      ) {
        errorMessage = (err as { message: string }).message ?? errorMessage;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [input]);

  const copyHashtag = useCallback(async (hashtag: string, index: number) => {
    try {
      await navigator.clipboard.writeText(`#${hashtag}`);
      setCopiedIndex(index);
      void window.setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, []);

  const copyAllHashtags = useCallback(async () => {
    if (hashtags.length === 0) return;
    try {
      const hashtagString = hashtags.map(tag => `#${tag}`).join(" ");
      await navigator.clipboard.writeText(hashtagString);
      setAllCopied(true);
      void window.setTimeout(() => setAllCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy all hashtags:", err);
    }
  }, [hashtags]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void handleGenerate();
    }
  }, [handleGenerate]);

  const isGenerateDisabled = !input.trim() || loading || (remainingCredits !== null && remainingCredits <= 0);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Card className="shadow-lg">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-2">
            <Hash className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl">Hashtag Generator</CardTitle>
          </div>
          
          <p className="text-muted-foreground">
            Generate AI-powered hashtag suggestions to boost your social media reach and engagement.
          </p>
          
          <div className="flex justify-between items-center pt-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4" />
              <span>Powered by AI</span>
            </div>
            
            <div className="text-sm">
              Credits: {" "}
              <Badge variant={remainingCredits === null || remainingCredits > 10 ? "secondary" : remainingCredits > 0 ? "outline" : "destructive"}>
                {usageLoading ? "..." : remainingCredits ?? "—"}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="content-input" className="text-sm font-medium">
              Your Content
            </label>
            <Textarea
              id="content-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Describe your post, paste your caption, or enter a topic...&#10;&#10;Tip: Press Ctrl+Enter (Cmd+Enter on Mac) to generate"
              rows={5}
              className="resize-none"
              maxLength={1000}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{input.length}/1000 characters</span>
              <span>Ctrl+Enter to generate</span>
            </div>
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={isGenerateDisabled}
            className="w-full h-11"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating hashtags...
              </>
            ) : (
              <>
                <Hash className="mr-2 h-4 w-4" />
                Generate Hashtags
              </>
            )}
          </Button>

          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive font-medium">Error</p>
              <p className="text-sm text-destructive/80 mt-1">{error}</p>
            </div>
          )}

          {hashtags.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Generated Hashtags ({hashtags.length})</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyAllHashtags}
                  className="h-8"
                >
                  {allCopied ? (
                    <>
                      <Check className="mr-1 h-3 w-3" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1 h-3 w-3" />
                      Copy All
                    </>
                  )}
                </Button>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {hashtags.map((tag, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors group"
                  >
                    <span className="font-mono text-sm select-all">#{tag}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyHashtag(tag, index)}
                      className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Copy hashtag"
                    >
                      {copiedIndex === index ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>

              <div className="text-xs text-muted-foreground p-3 bg-muted/30 rounded-lg">
                💡 <strong>Pro tip:</strong> Use a mix of popular and niche hashtags for better reach. 
                Popular hashtags increase visibility, while niche ones help you connect with your target audience.
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}