"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUploadThing } from "@/utils/uploadthing";
import { Loader2, Upload, Image as ImageIcon, Sparkles, Copy, Check } from "lucide-react";
import Image from "next/image";
import { z } from "zod";

const captionResponseSchema = z.object({
  caption: z.string(),
});
const errorResponseSchema = z.object({
  error: z.string(),
});

export default function ImageCaptionGeneratorPage() {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [caption, setCaption] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const { isUploading, startUpload } = useUploadThing(
    (routeRegistry) => routeRegistry.imageUploader,
  );

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    setCaption("");
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const upload = await startUpload([file]);
      if (upload?.[0]?.url) {
        setImageUrl(upload[0].url);
        await fetchCaption(upload[0].url);
      } else {
        setError("Failed to upload image. No URL returned.");
      }
    } catch (err: unknown) {
      let message = "Failed to upload image.";
      if (typeof err === "object" && err !== null && "message" in err) {
        const maybeMsg = (err as { message?: unknown }).message;
        if (typeof maybeMsg === "string") {
          message = maybeMsg;
        }
        if (typeof maybeMsg === "string" && maybeMsg.includes("FORBIDDEN")) {
          message = "You must be logged in to upload images. Please log in and try again.";
        }
      }
      setError(message);
      // Log the error for debugging
      // eslint-disable-next-line no-console
      console.error("UploadThing error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCaption = async (url: string) => {
    setLoading(true);
    setError("");
    setCaption("");
    try {
      const res = await fetch("/api/ai/image-caption-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: url }),
      });
      const data: unknown = await res.json();
      if (res.ok) {
        const parsed = captionResponseSchema.safeParse(data);
        if (parsed.success) {
          setCaption(parsed.data.caption);
        } else {
          setError("Failed to parse caption response.");
        }
      } else {
        const parsed = errorResponseSchema.safeParse(data);
        setError(parsed.success ? parsed.data.error : "Failed to generate caption.");
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (caption) {
      try {
        await navigator.clipboard.writeText(caption);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy text: ", err);
      }
    }
  };

  const isProcessing = isUploading || loading;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <div className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 p-3">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
          </div>
          <h1 className="mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-4xl font-bold text-transparent">
            AI Image Caption Generator
          </h1>
          <p className="text-lg text-muted-foreground">
            Upload an image and let AI create a descriptive caption for you
          </p>
        </div>

        {/* Main Card */}
        <div className="overflow-hidden rounded-2xl border bg-card shadow-xl">
          {/* Upload Section */}
          <div className="border-b p-8">
            <div className="relative">
              <Input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleImageChange}
                disabled={isProcessing}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className={`
                  flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all duration-200
                  ${
                    isProcessing
                      ? "cursor-not-allowed border-muted bg-muted"
                      : "cursor-pointer border-primary/30 bg-primary/10 hover:border-primary/40 hover:bg-primary/20"
                  }
                `}
              >
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
                  {isProcessing ? (
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  ) : (
                    <Upload className="h-8 w-8 text-primary" />
                  )}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  {isProcessing ? "Processing..." : "Choose an image to upload"}
                </h3>
                <p className="text-center text-sm text-muted-foreground">
                  Supports JPEG, PNG, GIF, and WebP formats
                </p>
              </label>
            </div>
          </div>

          {/* Image Preview Section */}
          {imageUrl && (
            <div className="bg-muted p-8">
              <div className="relative overflow-hidden rounded-xl bg-card shadow-md">
                <Image
                  src={imageUrl}
                  alt="Uploaded preview"
                  width={512}
                  height={320}
                  className="w-full max-h-80 object-contain"
                />
              </div>

              {/* Generate Button */}
              <div className="mt-6 flex justify-center">
                <Button
                  onClick={() => imageUrl && fetchCaption(imageUrl)}
                  disabled={!imageUrl || loading || isUploading}
                  className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-3 text-lg font-semibold text-white shadow-lg transition-all duration-200 hover:from-blue-600 hover:to-purple-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating Caption...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Generate Caption
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Results Section */}
          {(caption || error) && (
            <div className="p-8">
              {caption && (
                <div className="rounded-xl border bg-muted p-6">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
                      <ImageIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-grow">
                      <h3 className="mb-2 font-semibold text-foreground">
                        Generated Caption
                      </h3>
                      <p className="text-lg leading-relaxed text-foreground">
                        {caption}
                      </p>
                    </div>
                    <Button
                      onClick={copyToClipboard}
                      variant="ghost"
                      size="sm"
                      className="flex-shrink-0 hover:bg-primary/20"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-primary" />
                      ) : (
                        <Copy className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-destructive/20">
                      <span className="text-sm font-bold text-destructive">
                        !
                      </span>
                    </div>
                    <div>
                      <h3 className="mb-1 font-semibold text-destructive">
                        Error
                      </h3>
                      <p className="text-destructive">{error}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Powered by AI • Upload images responsibly</p>
        </div>
      </div>
    </div>
  );
}