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
        <form onSubmit={saveProfile}>
            {avatarUrl && (
                <div>
                    <p>Profile photo</p>
                    <img
                        src={avatarUrl}
                        alt="Profile"
                        width="120"
                        height="120"
                    />
                </div>
            )}

            <label>
                Upload profile photo
                <input
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                        setAvatarFile(event.target.files?.[0] ?? null)
                    }
                />
            </label>

            <br />

            <label>
                First name
                <input
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                />
            </label>

            <br />

            <label>
                Last name
                <input
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                />
            </label>

            <br />

            <button type="submit">Save profile</button>

            {message && <p>{message}</p>}
        </form>
    );
}