import VoteButtons from "./memes/vote-buttons";

export type MemeData = {
    id: string;
    image_url: string;
    prompt: string;
    caption: string;
    votes: { user_id: string; value: number }[];
};

export default function MemeCard({
                                     meme,
                                     userId,
                                 }: {
    meme: MemeData;
    userId: string | null;
}) {
    const score = meme.votes.reduce((sum, v) => sum + v.value, 0);
    const myVote = userId
        ? (meme.votes.find((v) => v.user_id === userId)?.value ?? 0)
        : 0;

    return (
        <article className="flex flex-col overflow-hidden rounded-2xl border-4 border-black bg-white shadow-[6px_6px_0_0_#000]">
            <div className="aspect-square w-full overflow-hidden border-b-4 border-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={meme.image_url}
                    alt={meme.caption}
                    className="h-full w-full origin-top-left scale-[1.04] object-cover"
                />
            </div>
            <div className="flex flex-1 flex-col p-4">
                <p className="text-lg font-black leading-snug">{meme.caption}</p>
                <p className="mt-1 text-sm text-gray-500">Idea: {meme.prompt}</p>
                <div className="mt-auto flex items-center justify-between pt-4">
                    <span className="rounded-full border-2 border-black bg-[var(--yellow)] px-3 py-1 font-black">
                        {score > 0 ? `+${score}` : score}
                    </span>
                    <VoteButtons
                        memeId={meme.id}
                        myVote={myVote}
                        loggedIn={userId !== null}
                    />
                </div>
            </div>
        </article>
    );
}