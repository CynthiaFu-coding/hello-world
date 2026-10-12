import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import SignOutButton from "./sign-out-button";
import NavLink from "./nav-link";

export default async function NavBar() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    return (
        <header className="sticky top-0 z-10 border-b-4 border-black bg-[var(--paper)]">
            <nav className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-3">
                <Link href="/" className="mr-4 text-2xl font-black tracking-tight">
                    MEME<span className="text-[var(--pink)]">ify</span> 😂
                </Link>
                <NavLink href="/memes">Memes</NavLink>
                <NavLink href="/create">Create</NavLink>
                <NavLink href="/top">Top</NavLink>
                <div className="ml-auto flex items-center gap-2">
                    {user ? (
                        <>
                            <NavLink href="/profile">Profile</NavLink>
                            <SignOutButton />
                        </>
                    ) : (
                        <Link
                            href="/login"
                            className="rounded-full border-2 border-black bg-[var(--yellow)] px-4 py-1.5 font-bold shadow-[3px_3px_0_0_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition"
                        >
                            Sign in
                        </Link>
                    )}
                </div>
            </nav>
        </header>
    );
}