"use client";

import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
    async function signInWithGoogle() {
        const supabase = createClient();

        await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
    }

    return (
        <main className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center">
            <div className="w-full rounded-3xl border-4 border-black bg-white p-8 shadow-[8px_8px_0_0_#000]">
                <div className="text-6xl">😂</div>
                <h1 className="mt-4 text-3xl font-black">Join MEMEify</h1>
                <p className="mt-2 font-semibold">
                    Sign in to make memes and vote on your favorites. You can
                    browse without an account.
                </p>
                <button
                    onClick={signInWithGoogle}
                    className="mt-6 w-full rounded-full border-4 border-black bg-[var(--yellow)] px-6 py-3 text-lg font-black shadow-[5px_5px_0_0_#000] transition hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
                >
                    Continue with Google
                </button>
            </div>
        </main>
    );
}