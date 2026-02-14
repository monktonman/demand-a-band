import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();
    const betaCode = process.env.BETA_ACCESS_CODE;

    // If no beta code is configured, beta gate is disabled
    if (!betaCode) {
      return NextResponse.json({ error: "Beta gate not configured" }, { status: 500 });
    }

    if (code?.toUpperCase() === betaCode.toUpperCase()) {
      const response = NextResponse.json({ success: true });

      // Set a cookie that lasts 30 days
      response.cookies.set("beta_access", "granted", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      });

      return response;
    }

    return NextResponse.json({ error: "Invalid access code" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
