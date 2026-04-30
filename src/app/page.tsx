import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { NoteEditor } from "@/app/_components/note-editor";
import { auth } from "@/server/better-auth";
import { getSession } from "@/server/better-auth/server";
import { api, HydrateClient } from "@/trpc/server";

export default async function Home() {
  const session = await getSession();

  if (session) {
    void api.note.list.prefetch();
  }

  return (
    <HydrateClient>
      <main className="min-h-screen bg-slate-100 text-slate-950">
        <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 px-5 py-8 sm:px-8">
          <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-normal">
                Finmaxxing Notes
              </h1>
              {session?.user ? (
                <p className="mt-2 text-sm text-slate-600">
                  Signed in as {session.user.email}
                </p>
              ) : null}
            </div>

            {!session ? (
              <form>
                <button
                  className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
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
                  className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
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
          </header>

          {session?.user ? (
            <NoteEditor />
          ) : (
            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold">Sign in to continue</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                Your notes are saved to your account and only shown when you are
                signed in.
              </p>
            </section>
          )}
        </div>
      </main>
    </HydrateClient>
  );
}
