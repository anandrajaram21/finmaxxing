import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { exportFinanceBackup, importFinanceBackup } from "@/server/data-backup";
import { auth } from "@/server/better-auth";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const backup = await exportFinanceBackup(session.user.id);
  const exportedOn = backup.exportedAt.slice(0, 10);

  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Disposition": `attachment; filename="finmaxxing-backup-${exportedOn}.json"`,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload: unknown = await request.json();
    const result = await importFinanceBackup(session.user.id, payload);

    revalidatePath("/dashboard");
    revalidatePath("/goals");
    revalidatePath("/investments");
    revalidatePath("/transactions");
    revalidatePath("/allocations");
    revalidatePath("/assumptions");

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "The selected file is not a valid Finmaxxing backup.",
          issues: error.flatten(),
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "The backup could not be imported.",
      },
      { status: 400 },
    );
  }
}
