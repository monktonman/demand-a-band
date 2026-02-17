import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";
import { getUsersForGenre } from "@/lib/demand-queries";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const genre = searchParams.get("genre");

  if (!genre) {
    return NextResponse.json(
      { error: "genre parameter is required" },
      { status: 400 }
    );
  }

  try {
    const result = await getUsersForGenre(genre);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[Admin Genre Users] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch genre user data" },
      { status: 500 }
    );
  }
}
