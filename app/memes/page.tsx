import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import UploadForm from "./upload-form";
import VoteButtons from "./vote-buttons";

type Vote = { user_id: string; value: number };
type Meme = {
    id: string;
    image_url: string;
    prompt: string;
    caption: string;
    votes: Vote[];
};

export default async function MemesPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }
    const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", user.id)
        .single();

    if (!profile?.first_name || !profile?.last_name) {
        redirect("/profile");
    }
    const { data } = await supabase
        .from("memes")
        .select("id, image_url, prompt, caption, votes(user_id, value)")
        .order("created_at", { ascending: false });

    const memes = (data ?? []) as Meme[];

    return (
        <main>
            <Link href="/">Home</Link>
            <h1>Meme Rater</h1>

            <UploadForm />

            <hr />

            {memes.length === 0 && <p>No memes yet. Generate the first one!</p>}

            {memes.map((meme) => {
                const score = meme.votes.reduce((sum, v) => sum + v.value, 0);
                const myVote =
                    meme.votes.find((v) => v.user_id === user.id)?.value ?? 0;

                return (
                    <div key={meme.id} style={{ marginBottom: 32 }}>
                        <img src={meme.image_url} alt={meme.caption} width={300} />
                        <p>
                            <strong>{meme.caption}</strong>
                        </p>
                        <p>Prompt: {meme.prompt}</p>
                        <p>Score: {score}</p>
                        <VoteButtons memeId={meme.id} myVote={myVote} />
                    </div>
                );
            })}
        </main>
    );
}