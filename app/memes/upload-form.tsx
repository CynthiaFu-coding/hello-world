"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UploadForm() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [prompt, setPrompt] = useState("Make it funny");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    async function submit(event: React.SyntheticEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!file) {
            setMessage("Please choose an image.");
            return;
        }

        setLoading(true);
        setMessage("Generating caption...");

        const formData = new FormData();
        formData.append("image", file);
        formData.append("prompt", prompt);

        const response = await fetch("/api/generate", {
            method: "POST",
            body: formData,
        });
        const result = await response.json();

        setLoading(false);

        if (!response.ok) {
            setMessage(result.error ?? "Something went wrong.");
            return;
        }

        setMessage(`Done! Caption: ${result.caption}`);
        setFile(null);
        router.refresh();
    }

    return (
        <form onSubmit={submit}>
            <h2>Create a meme</h2>
            <label>
                Image{" "}
                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
            </label>
            <br />
            <label>
                Prompt{" "}
                <input
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    size={40}
                />
            </label>
            <br />
            <button type="submit" disabled={loading}>
                {loading ? "Working..." : "Generate caption"}
            </button>
            {message && <p>{message}</p>}
        </form>
    );
}