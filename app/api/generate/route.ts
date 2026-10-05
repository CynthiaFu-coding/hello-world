import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@/utils/supabase/server";

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
    if (!file.type.startsWith("image/")) {
        return NextResponse.json({ error: "File must be an image." }, { status: 400 });
    }
    if (file.size > 4 * 1024 * 1024) {
        return NextResponse.json({ error: "Image must be under 4 MB." }, { status: 400 });
    }
    if (!prompt) {
        return NextResponse.json({ error: "Please enter a prompt." }, { status: 400 });
    }

    // 1. 调用 Gemini 生成 caption
    const bytes = Buffer.from(await file.arrayBuffer());
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    let caption = "";
    try {
        const result = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: [
                {
                    role: "user",
                    parts: [
                        { inlineData: { mimeType: file.type, data: bytes.toString("base64") } },
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
    const extension = file.name.split(".").pop() || "jpg";
    const filePath = `${user.id}/${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
        .from("memes")
        .upload(filePath, bytes, { contentType: file.type });

    if (uploadError) {
        return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from("memes").getPublicUrl(filePath);

    // 3. 记录写进 memes 表（图片地址、prompt、caption）
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