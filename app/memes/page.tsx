import { createClient } from "@/utils/supabase/server";
import MemeCard, { type MemeData } from "../meme-card";

export default async function MemesPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { data } = await supabase
        .from("memes")
        .select("id, image_url, prompt, caption, votes(user_id, value)")
        .order("created_at", { ascending: false });

    const memes = (data ?? []) as MemeData[];

    return (
        <main className="mx-auto max-w-5xl px-4 py-10">
            <h1 className="text-4xl font-black">All memes 😂</h1>
            <p className="mt-1 font-semibold">Newest first. Vote on your favorites.</p>

            {memes.length === 0 ? (
                <p className="mt-8 rounded-2xl border-4 border-dashed border-black p-8 text-center font-bold">
                    No memes yet. Head to Create and make the first one!
                </p>
            ) : (
                <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    {memes.map((m) => (
                        <MemeCard key={m.id} meme={m} userId={user?.id ?? null} />
                    ))}
                </div>
            )}
        </main>
    );
}