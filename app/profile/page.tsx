import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import ProfileForm from "./profile-form";

export default async function ProfilePage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, avatar_url")
        .eq("id", user.id)
        .single();

    const needsName = !profile?.first_name || !profile?.last_name;

    return (
        <main className="mx-auto max-w-lg px-4 py-10">
            <h1 className="text-4xl font-black">Your profile 🙂</h1>
            <p className="mt-1 font-semibold">{user.email}</p>

            {needsName && (
                <p className="mt-6 rounded-2xl border-4 border-black bg-[var(--pink)] p-4 font-black shadow-[4px_4px_0_0_#000]">
                    👋 Welcome! Add your first and last name to start making memes.
                </p>
            )}

            <ProfileForm
                userId={user.id}
                initialFirstName={profile?.first_name ?? ""}
                initialLastName={profile?.last_name ?? ""}
                initialAvatarUrl={profile?.avatar_url ?? ""}
            />
        </main>
    );
}