"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function VoteButtons({
                                        memeId,
                                        myVote,
                                        loggedIn,
                                    }: {
    memeId: string;
    myVote: number;
    loggedIn: boolean;
}) {
    const router = useRouter();
    const [message, setMessage] = useState("");
    const [needLogin, setNeedLogin] = useState(false);

    async function vote(value: 1 | -1) {
        if (!loggedIn) {
            setNeedLogin(true);
            return;
        }
        const supabase = createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
            setNeedLogin(true);
            return;
        }

        const { error } = await supabase
            .from("votes")
            .upsert(
                { user_id: user.id, meme_id: memeId, value },
                { onConflict: "user_id,meme_id" }
            );

        if (error) {
            setMessage(error.message);
            return;
        }
        setMessage("");
        router.refresh();
    }

    const base =
        "rounded-full border-2 border-black px-3 py-1 text-xl transition hover:-translate-y-0.5";

    return (
        <div className="relative">
            <button
                onClick={() => vote(1)}
                title="Funny"
                className={`${base} ${myVote === 1 ? "bg-[var(--yellow)]" : "bg-white"}`}
            >
                👍
            </button>{" "}
            <button
                onClick={() => vote(-1)}
                title="Not funny"
                className={`${base} ${myVote === -1 ? "bg-[var(--pink)]" : "bg-white"}`}
            >
                👎
            </button>

            {needLogin && (
                <div className="absolute bottom-full right-0 z-10 mb-2 w-48 rounded-xl border-2 border-black bg-white p-3 text-center text-sm font-bold shadow-[3px_3px_0_0_#000]">
                    Sign in to vote!
                    <Link
                        href="/login"
                        className="mt-2 block rounded-full border-2 border-black bg-[var(--yellow)] px-3 py-1"
                    >
                        Sign in
                    </Link>
                    <button
                        onClick={() => setNeedLogin(false)}
                        className="mt-1 text-xs font-normal underline"
                    >
                        Not now
                    </button>
                </div>
            )}

            {message && <p className="text-xs text-red-600">{message}</p>}
        </div>
    );
}