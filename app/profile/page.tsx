import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import ProfileForm from "./profile-form";
import Link from "next/link";

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

    return (
        <main>
            <Link href="/">Home</Link>{" "}
            <Link href="/memes">Memes</Link>
            <h1>Profile</h1>
            <p>Email: {user.email}</p>

            {(!profile?.first_name || !profile?.last_name) && (
                <p>Please add your first and last name.</p>
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
