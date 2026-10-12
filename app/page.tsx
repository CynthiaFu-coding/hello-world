import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import MemeCard, { type MemeData } from "./meme-card";

export default async function Home() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { data } = await supabase
        .from("memes")
        .select("id, image_url, prompt, caption, votes(user_id, value)")
        .order("created_at", { ascending: false })
        .limit(6);

    const memes = (data ?? []) as MemeData[];

    return (
        <main className="mx-auto max-w-5xl px-4 py-10">
            <section className="rounded-3xl border-4 border-black bg-[var(--yellow)] p-8 shadow-[8px_8px_0_0_#000] sm:p-12">
                <h1 className="text-4xl font-black leading-tight sm:text-6xl">
                    Say a silly idea.
                    <br />
                    <span className="text-[var(--pink)] [-webkit-text-stroke:2px_#000]">
                        Get a meme.
                    </span>
                </h1>
                <p className="mt-4 max-w-xl text-lg font-semibold">
                    Type one sentence, AI draws the picture and writes the
                    caption. Then everyone votes on what is funniest.
                </p>
                <Link
                    href="/create"
                    className="mt-6 inline-block rounded-full border-4 border-black bg-white px-8 py-3 text-xl font-black shadow-[5px_5px_0_0_#000] transition hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
                >
                    Make a meme ✨
                </Link>
            </section>

            <div className="mt-12 flex items-end justify-between">
                <h2 className="text-3xl font-black">Fresh memes 🔥</h2>
                <Link href="/memes" className="font-bold underline">
                    See all →
                </Link>
            </div>

            {memes.length === 0 ? (
                <p className="mt-6 rounded-2xl border-4 border-dashed border-black p-8 text-center font-bold">
                    No memes yet. Be the first to make one!
                </p>
            ) : (
                <div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    {memes.map((m) => (
                        <MemeCard key={m.id} meme={m} userId={user?.id ?? null} />
                    ))}
                </div>
            )}
        </main>
    );
}