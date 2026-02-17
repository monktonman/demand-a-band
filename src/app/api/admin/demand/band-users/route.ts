import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";
import { getUsersForBand } from "@/lib/demand-queries";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const bandId = searchParams.get("bandId");

  if (!bandId) {
    return NextResponse.json(
      { error: "bandId parameter is required" },
      { status: 400 }
    );
  }

  try {
    const result = await getUsersForBand(bandId);

    if (!result.band) {
      return NextResponse.json({ error: "Band not found" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Admin Band Users] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch band user data" },
      { status: 500 }
    );
  }
}
