import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@/utils/supabase/server";
import convert from "heic-convert";

export const maxDuration = 60;

async function askGemini(
    ai: GoogleGenAI,
    parts: Record<string, unknown>[]
): Promise<string> {
    const models = ["gemini-3.8-flash", "gemini-3.8-flash-lite"];
    let lastError = "";
    for (const model of models) {
        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                const result = await ai.models.generateContent({
                    model,
                    contents: [{ role: "user", parts }],
                });
                const text = (result.text ?? "").trim();
                if (text) return text;
            } catch (e) {
                lastError = (e as Error).message;
                await new Promise((r) => setTimeout(r, 1500));
            }
        }
    }
    throw new Error(lastError || "AI returned nothing");
}

export async function POST(request: Request) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    }

    const formData = await request.formData();
    const mode = String(formData.get("mode") ?? "upload");
    const prompt = String(formData.get("prompt") ?? "").trim();

    if (!prompt) {
        return NextResponse.json({ error: "Please enter a prompt." }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    let bytes: Buffer;
    let mimeType = "image/jpeg";
    let extension = "jpg";
    let caption = "";
    let imagePrompt: string | null = null;

    if (mode === "ai") {
        // 1. Gemini 写画面描述和配文
        let raw = "";
        try {
            raw = await askGemini(ai, [
                {
                    text:
                        `Someone wants a funny meme about: "${prompt}".\n` +
                        `Reply with exactly two lines and nothing else:\n` +
                        `IMAGE: <a vivid English description of the picture, no text, no letters, no words in the image>\n` +
                        `CAPTION: <one short, funny meme caption in English>`,
                },
            ]);
        } catch (e) {
            return NextResponse.json(
                { error: `AI is busy right now, please try again. (${(e as Error).message})` },
                { status: 502 }
            );
        }

        const imageLine = raw.match(/IMAGE:\s*(.+)/i)?.[1]?.trim();
        const captionLine = raw.match(/CAPTION:\s*(.+)/i)?.[1]?.trim();
        if (!imageLine || !captionLine) {
            return NextResponse.json({ error: "AI gave a weird answer. Try again!" }, { status: 502 });
        }
        imagePrompt = `${imageLine}, funny meme photo style, no text, no letters, no watermark`;
        caption = captionLine.replace(/^["']|["']$/g, "");

        // 2. Pollinations 生图
        const url =
            `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}` +
            `?width=768&height=768&nologo=true&seed=${Math.floor(Math.random() * 1e6)}`;

        let imgRes: Response | null = null;
        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                imgRes = await fetch(url, { signal: AbortSignal.timeout(40000) });
                if (imgRes.ok) break;
            } catch {
                imgRes = null;
            }
        }
        if (!imgRes || !imgRes.ok) {
            return NextResponse.json(
                { error: "The AI painter is resting. Please try again in a minute." },
                { status: 502 }
            );
        }
        bytes = Buffer.from(await imgRes.arrayBuffer());
        mimeType = imgRes.headers.get("content-type") ?? "image/jpeg";
        extension = mimeType.includes("png") ? "png" : "jpg";
    } else {
        // 上传模式
        const file = formData.get("image");
        if (!(file instanceof File) || file.size === 0) {
            return NextResponse.json({ error: "Please choose an image." }, { status: 400 });
        }
        const isHeic =
            /heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);
        if (!file.type.startsWith("image/") && !isHeic) {
            return NextResponse.json({ error: "File must be an image." }, { status: 400 });
        }
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({ error: "Image must be under 10 MB." }, { status: 400 });
        }

        bytes = Buffer.from(await file.arrayBuffer());
        mimeType = file.type || "image/jpeg";
        extension = file.name.split(".").pop() || "jpg";

        if (isHeic) {
            try {
                const jpeg = await convert({
                    buffer: bytes as unknown as Parameters<typeof convert>[0]["buffer"],
                    format: "JPEG",
                    quality: 0.85,
                });
                bytes = Buffer.from(jpeg);
                mimeType = "image/jpeg";
                extension = "jpg";
            } catch {
                return NextResponse.json(
                    { error: "Could not read this HEIC image. Try a JPG or PNG." },
                    { status: 400 }
                );
            }
        }

        try {
            caption = await askGemini(ai, [
                { inlineData: { mimeType, data: bytes.toString("base64") } },
                {
                    text:
                        `${prompt}\n\nWrite one short, funny meme caption for this image. ` +
                        `Reply with only the caption text.`,
                },
            ]);
        } catch (e) {
            return NextResponse.json(
                { error: `AI is busy right now, please try again. (${(e as Error).message})` },
                { status: 502 }
            );
        }
    }

    // 存图片
    const filePath = `${user.id}/${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage
        .from("memes")
        .upload(filePath, bytes, { contentType: mimeType });
    if (uploadError) {
        return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }
    const { data: urlData } = supabase.storage.from("memes").getPublicUrl(filePath);

    // 存记录
    const { error: insertError } = await supabase.from("memes").insert({
        image_url: urlData.publicUrl,
        prompt,
        image_prompt: imagePrompt,
        caption,
    });
    if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ caption });
}