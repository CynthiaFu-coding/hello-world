import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@/utils/supabase/server";
import convert from "heic-convert";

export async function POST(request: Request) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("image");
    const prompt = String(formData.get("prompt") ?? "").trim();

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
    if (!prompt) {
        return NextResponse.json({ error: "Please enter a prompt." }, { status: 400 });
    }

    // 读取图片；如果是 HEIC，转成 JPEG
    let bytes: Buffer = Buffer.from(await file.arrayBuffer());
    let mimeType = file.type;
    let extension = file.name.split(".").pop() || "jpg";

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

    // 1. 调用 Gemini 生成 caption
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    let caption = "";
    try {
        const result = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: [
                {
                    role: "user",
                    parts: [
                        { inlineData: { mimeType, data: bytes.toString("base64") } },
                        {
                            text:
                                `${prompt}\n\nWrite one short, funny meme caption for this image. ` +
                                `Reply with only the caption text.`,
                        },
                    ],
                },
            ],
        });
        caption = (result.text ?? "").trim();
    } catch (e) {
        return NextResponse.json(
            { error: `AI generation failed: ${(e as Error).message}` },
            { status: 502 }
        );
    }

    if (!caption) {
        return NextResponse.json({ error: "AI returned no caption." }, { status: 502 });
    }

    // 2. 图片存进 Storage 的 memes 桶
    const filePath = `${user.id}/${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
        .from("memes")
        .upload(filePath, bytes, { contentType: mimeType });

    if (uploadError) {
        return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from("memes").getPublicUrl(filePath);

    // 3. 记录写进 memes 表
    const { error: insertError } = await supabase.from("memes").insert({
        image_url: urlData.publicUrl,
        prompt,
        caption,
    });

    if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ caption });
}