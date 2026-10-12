import { createClient } from "@/utils/supabase/server";
import MemeCard, { type MemeData } from "../meme-card";

export default async function TopPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { data } = await supabase
        .from("memes")
        .select("id, image_url, prompt, caption, votes(user_id, value)");

    const memes = ((data ?? []) as MemeData[])
        .map((m) => ({
            m,
            score: m.votes.reduce((s, v) => s + v.value, 0),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

    const medals = ["🥇", "🥈", "🥉"];

    return (
        <main className="mx-auto max-w-5xl px-4 py-10">
            <h1 className="text-4xl font-black">Top memes 🏆</h1>
            <p className="mt-1 font-semibold">The funniest of all time, by votes.</p>

            {memes.length === 0 ? (
                <p className="mt-8 rounded-2xl border-4 border-dashed border-black p-8 text-center font-bold">
                    No memes yet. Make one and climb the board!
                </p>
            ) : (
                <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    {memes.map(({ m }, i) => (
                        <div key={m.id} className="relative">
                            <div className="absolute -left-3 -top-3 z-10 flex h-12 w-12 items-center justify-center rounded-full border-4 border-black bg-white text-2xl font-black">
                                {medals[i] ?? `#${i + 1}`}
                            </div>
                            <MemeCard meme={m} userId={user?.id ?? null} />
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
}