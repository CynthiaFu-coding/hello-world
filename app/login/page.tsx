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
        <main>
            <h1>Sign In</h1>
    <button onClick={signInWithGoogle}>
        Continue with Google
    </button>
    </main>
        );
}
