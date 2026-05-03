import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SignInIcon, SignOutIcon } from "@phosphor-icons/react/ssr";

import { Button } from "@/components/ui/button";
import { auth } from "@/server/better-auth";
import { cn } from "@/lib/utils";

type AuthActionProps = {
  callbackURL?: string;
  className?: string;
  signedIn: boolean;
};

export function AuthAction({
  callbackURL = "/dashboard",
  className,
  signedIn,
}: AuthActionProps) {
  if (signedIn) {
    return (
      <form>
        <Button
          className={cn("justify-center", className)}
          formAction={async () => {
            "use server";
            await auth.api.signOut({
              headers: await headers(),
            });
            redirect("/");
          }}
          variant="outline"
        >
          <SignOutIcon className="size-4" />
          Sign out
        </Button>
      </form>
    );
  }

  return (
    <form>
      <Button
        className={cn("justify-center", className)}
        formAction={async () => {
          "use server";
          const res = await auth.api.signInSocial({
            body: {
              callbackURL,
              provider: "google",
            },
          });
          if (!res.url) {
            throw new Error("No URL returned from signInSocial");
          }
          redirect(res.url);
        }}
      >
        <SignInIcon className="size-4" />
        Sign in
      </Button>
    </form>
  );
}
