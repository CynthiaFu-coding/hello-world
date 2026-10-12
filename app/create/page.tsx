import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import CreateForm from "./create-form";

export default async function CreatePage() {
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
        <main className="mx-auto max-w-2xl px-4 py-10">
            <h1 className="text-4xl font-black">Make a meme ✨</h1>
            <p className="mt-1 font-semibold">
                Pick how you want to start. AI does the funny part.
            </p>
            <CreateForm />
        </main>
    );
}