"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const IDEAS = [
    "A cat taking a calculus exam",
    "Me at 3 a.m. before a deadline",
    "A dog running a team meeting",
    "Monday morning energy",
];

export default function CreateForm() {
    const router = useRouter();
    const [mode, setMode] = useState<"ai" | "upload">("ai");
    const [idea, setIdea] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [prompt, setPrompt] = useState("Make it funny");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    async function submit(e: React.SyntheticEvent<HTMLFormElement>) {
        e.preventDefault();
        setMessage("");

        const formData = new FormData();
        formData.append("mode", mode);
        if (mode === "ai") {
            if (!idea.trim()) {
                setMessage("Type an idea first!");
                return;
            }
            formData.append("prompt", idea);
        } else {
            if (!file) {
                setMessage("Choose an image first!");
                return;
            }
            formData.append("image", file);
            formData.append("prompt", prompt);
        }

        setLoading(true);
        const res = await fetch("/api/generate", { method: "POST", body: formData });
        const result = await res.json().catch(() => ({}));
        setLoading(false);

        if (!res.ok) {
            setMessage(result.error ?? "Something went wrong.");
            return;
        }
        router.push("/memes");
        router.refresh();
    }

    const tab = (active: boolean) =>
        `flex-1 rounded-full border-4 border-black px-4 py-2 font-black transition ${
            active ? "bg-[var(--yellow)] shadow-[4px_4px_0_0_#000]" : "bg-white"
        }`;

    return (
        <form onSubmit={submit} className="mt-8">
            <div className="flex gap-3">
                <button type="button" className={tab(mode === "ai")} onClick={() => setMode("ai")}>
                    ✨ AI makes it all
                </button>
                <button type="button" className={tab(mode === "upload")} onClick={() => setMode("upload")}>
                    📸 Use my photo
                </button>
            </div>

            <div className="mt-6 rounded-2xl border-4 border-black bg-white p-6 shadow-[6px_6px_0_0_#000]">
                {mode === "ai" ? (
                    <>
                        <label className="font-black">Your silly idea</label>
                        <textarea
                            value={idea}
                            onChange={(e) => setIdea(e.target.value)}
                            rows={3}
                            placeholder="e.g. A cat taking a calculus exam"
                            className="mt-2 w-full rounded-xl border-2 border-black p-3"
                        />
                        <div className="mt-3 flex flex-wrap gap-2">
                            {IDEAS.map((t) => (
                                <button
                                    type="button"
                                    key={t}
                                    onClick={() => setIdea(t)}
                                    className="rounded-full border-2 border-black bg-[var(--paper)] px-3 py-1 text-sm font-bold hover:bg-[var(--pink)]"
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </>
                ) : (
                    <>
                        <label className="font-black">Your photo (JPG, PNG, or HEIC)</label>
                        <input
                            type="file"
                            accept="image/*,.heic,.heif"
                            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                            className="mt-2 block w-full"
                        />
                        <label className="mt-4 block font-black">Tell the AI the vibe</label>
                        <input
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="mt-2 w-full rounded-xl border-2 border-black p-3"
                        />
                    </>
                )}
            </div>

            <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full rounded-full border-4 border-black bg-[var(--pink)] px-6 py-3 text-xl font-black shadow-[5px_5px_0_0_#000] transition hover:translate-x-1 hover:translate-y-1 hover:shadow-none disabled:opacity-60"
            >
                {loading ? "Cooking your meme... 🍳" : "Make my meme!"}
            </button>
            {loading && (
                <p className="mt-3 text-center font-bold">
                    This can take 10 to 20 seconds. Hang tight!
                </p>
            )}
            {message && (
                <p className="mt-3 rounded-xl border-2 border-black bg-white p-3 font-bold text-red-600">
                    {message}
                </p>
            )}
        </form>
    );
}