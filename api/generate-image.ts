/**
 * Generate / Upload NFT Image
 *
 * Two modes:
 *  - mode: "generate" → Gemini REST API image generation + Supabase Storage upload
 *  - mode: "upload"   → User-provided base64 image → Supabase Storage upload
 *
 * Both update nft_metadata_drafts.image_url and return public URL.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

function getSupabase() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
  if (!url || !key) return null;
  return createClient(url, key);
}

async function generateWithGemini(prompt: string): Promise<Buffer> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ["IMAGE", "TEXT"],
          imageMimeType: "image/png",
        },
      }),
    },
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error: ${res.status} — ${err}`);
  }

  const data = await res.json();

  // Find the image part in the response
  const candidates = data.candidates || [];
  for (const candidate of candidates) {
    const parts = candidate.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        return Buffer.from(part.inlineData.data, "base64");
      }
      // Alternative field name
      if (part.inline_data?.data) {
        return Buffer.from(part.inline_data.data, "base64");
      }
    }
  }

  throw new Error("Gemini did not return an image");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { mode, prompt, address, imageData, mimeType } = req.body;

  if (!address || typeof address !== "string") {
    return res.status(400).json({ error: "address required" });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return res.status(500).json({ error: "Storage not configured" });
  }

  let imageBuffer: Buffer;
  let contentType = "image/png";

  try {
    if (mode === "generate") {
      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ error: "prompt required for generate mode" });
      }
      imageBuffer = await generateWithGemini(prompt);
    } else if (mode === "upload") {
      if (!imageData || typeof imageData !== "string") {
        return res.status(400).json({ error: "imageData required for upload mode" });
      }
      // Strip data URI prefix if present
      const base64 = imageData.replace(/^data:image\/\w+;base64,/, "");
      imageBuffer = Buffer.from(base64, "base64");
      contentType = mimeType || "image/png";
    } else {
      return res.status(400).json({ error: "mode must be 'generate' or 'upload'" });
    }

    // Size check
    if (imageBuffer.length > MAX_IMAGE_SIZE) {
      return res.status(400).json({ error: "Image exceeds 2MB limit" });
    }

    // Upload to Supabase Storage
    const timestamp = Date.now();
    const ext = contentType.includes("jpeg") || contentType.includes("jpg") ? "jpg" : "png";
    const filePath = `nft-images/${address.toLowerCase()}/${timestamp}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("nft-images")
      .upload(filePath, imageBuffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("nft-images")
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    // Update draft metadata with image_url
    await supabase
      .from("nft_metadata_drafts")
      .update({ image_url: publicUrl, updated_at: new Date().toISOString() })
      .eq("address", address.toLowerCase());

    return res.status(200).json({
      success: true,
      imageUrl: publicUrl,
      filePath,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Image generation failed";
    return res.status(500).json({ error: message });
  }
}
