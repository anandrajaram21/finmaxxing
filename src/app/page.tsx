import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/server/better-auth";
import { getSession } from "@/server/better-auth/server";

export default async function Home() {
  const session = await getSession();

  return (
    <main className="flex min-h-screen flex-col bg-neutral-950 text-white">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-8 px-6 py-16">
        <div>
          <h1 className="text-4xl font-semibold">Finmaxxing</h1>
          <p className="mt-3 max-w-2xl text-neutral-300">
            Portfolio and goal tracking database is ready. Use the authenticated
            session to attach goals, investments, allocations, and transactions
            to the current user.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {session && (
            <p className="text-neutral-300">
              Logged in as {session.user?.name}
            </p>
          )}
          {!session ? (
            <form>
              <button
                className="w-fit rounded-md bg-white px-5 py-2 text-sm font-medium text-neutral-950 transition hover:bg-neutral-200"
                formAction={async () => {
                  "use server";
                  const res = await auth.api.signInSocial({
                    body: {
                      provider: "google",
                      callbackURL: "/",
                    },
                  });
                  if (!res.url) {
                    throw new Error("No URL returned from signInSocial");
                  }
                  redirect(res.url);
                }}
              >
                Sign in with Google
              </button>
            </form>
          ) : (
            <form>
              <button
                className="w-fit rounded-md bg-white px-5 py-2 text-sm font-medium text-neutral-950 transition hover:bg-neutral-200"
                formAction={async () => {
                  "use server";
                  await auth.api.signOut({
                    headers: await headers(),
                  });
                  redirect("/");
                }}
              >
                Sign out
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
