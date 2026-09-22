import { createClient } from "@supabase/supabase-js";

type Task = {
  id: number;
  title: string;
};

export default async function Home() {
  const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  const { data: tasks, error } = await supabase
      .from("tasks")
      .select("id, title")
      .order("id");

  if (error) {
    return <main>Unable to load tasks.</main>;
  }

  return (
      <main>
        <h1>Project Tasks</h1>
        <ul>
          {tasks?.map((task: Task) => (
              <li key={task.id}>{task.title}</li>
          ))}
        </ul>
      </main>
  );
}