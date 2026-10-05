import Link from "next/link";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import SignOutButton from "./sign-out-button";

type Task = {
    id: number;
    title: string;
};

export default async function Home() {
    // 作业 2：读取 tasks（保持不变）
    const publicSupabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );

    const { data: tasks, error } = await publicSupabase
        .from("tasks")
        .select("id, title")
        .order("id");

    // 作业 3：读取当前登录用户
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    return (
        <main>
            <nav>
                {user ? (
                    <>
                        <span>Signed in as {user.email}</span>{" "}
                        <Link href="/dashboard">Dashboard</Link>{" "}
                        <Link href="/profile">Profile</Link>{" "}
                        <Link href="/memes">Memes</Link>{" "}
                        <SignOutButton />
                    </>
                ) : (
                    <Link href="/login">Sign in</Link>
                )}
            </nav>

            <h1>Project Tasks</h1>
            {error ? (
                <p>Unable to load tasks.</p>
            ) : (
                <ul>
                    {tasks?.map((task: Task) => (
                        <li key={task.id}>{task.title}</li>
                    ))}
                </ul>
            )}
        </main>
    );
}