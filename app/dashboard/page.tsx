import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function DashboardPage() {
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

    return (
        <main>
            <h1>Dashboard</h1>
            <p>
                Welcome, {profile.first_name}! This page is only visible to
                logged-in users.
            </p>
        </main>
    );
}