"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";


type ProfileFormProps = {
    userId: string;
    initialFirstName: string;
    initialLastName: string;
    initialAvatarUrl?: string;
};

export default function ProfileForm({
                                        userId,
                                        initialFirstName,
                                        initialLastName,
                                        initialAvatarUrl = "",
                                    }: ProfileFormProps) {
    const router = useRouter();
    const [firstName, setFirstName] = useState(initialFirstName);
    const [lastName, setLastName] = useState(initialLastName);
    const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [message, setMessage] = useState("");

    async function saveProfile(event: React.SyntheticEvent<HTMLFormElement>) {
        event.preventDefault();
        setMessage("Saving...");

        const supabase = createClient();
        let newAvatarUrl = avatarUrl;

        if (avatarFile) {
            const extension = avatarFile.name.split(".").pop() || "jpg";
            const filePath = `${userId}/${Date.now()}.${extension}`;

            const { error: uploadError } = await supabase.storage
                .from("avatars")
                .upload(filePath, avatarFile);

            if (uploadError) {
                setMessage(`Could not upload photo: ${uploadError.message}`);
                return;
            }

            const { data } = supabase.storage
                .from("avatars")
                .getPublicUrl(filePath);

            newAvatarUrl = data.publicUrl;
            setAvatarUrl(newAvatarUrl);
        }

        const { error } = await supabase
            .from("profiles")
            .update({
                first_name: firstName,
                last_name: lastName,
                avatar_url: newAvatarUrl || null,
            })
            .eq("id", userId);

        if (error) {
            setMessage(`Could not save: ${error.message}`);
            return;
        }

        setMessage("Profile saved.");
        router.refresh();
    }

    return (
        <form
            onSubmit={saveProfile}
            className="mt-8 rounded-3xl border-4 border-black bg-white p-6 shadow-[8px_8px_0_0_#000]"
        >
            <div className="flex items-center gap-5">
                {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={avatarUrl}
                        alt="Profile"
                        className="h-24 w-24 rounded-full border-4 border-black object-cover"
                    />
                ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-black bg-[var(--yellow)] text-4xl">
                        😎
                    </div>
                )}
                <label className="cursor-pointer rounded-full border-2 border-black bg-[var(--paper)] px-4 py-2 font-bold hover:bg-[var(--yellow)]">
                    {avatarFile ? avatarFile.name : "Choose a photo"}
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) =>
                            setAvatarFile(event.target.files?.[0] ?? null)
                        }
                    />
                </label>
            </div>

            <label className="mt-6 block font-black">
                First name
                <input
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    className="mt-1 w-full rounded-xl border-2 border-black p-3 font-normal"
                />
            </label>

            <label className="mt-4 block font-black">
                Last name
                <input
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    className="mt-1 w-full rounded-xl border-2 border-black p-3 font-normal"
                />
            </label>

            <button
                type="submit"
                className="mt-6 w-full rounded-full border-4 border-black bg-[var(--yellow)] px-6 py-3 text-lg font-black shadow-[5px_5px_0_0_#000] transition hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
            >
                Save profile
            </button>

            {message && <p className="mt-3 font-bold">{message}</p>}
        </form>
    );
}