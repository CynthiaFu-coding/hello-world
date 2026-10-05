"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function VoteButtons({
                                        memeId,
                                        myVote,
                                    }: {
    memeId: string;
    myVote: number;
}) {
    const router = useRouter();
    const [message, setMessage] = useState("");

    async function vote(value: 1 | -1) {
        const supabase = createClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            setMessage("Please sign in to vote.");
            return;
        }

        // 同一个人对同一个 meme 只有一票：重复投会更新
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

    return (
        <div>
            <button onClick={() => vote(1)} disabled={myVote === 1}>
                👍 Upvote
            </button>{" "}
            <button onClick={() => vote(-1)} disabled={myVote === -1}>
                👎 Downvote
            </button>
            {message && <p>{message}</p>}
        </div>
    );
}