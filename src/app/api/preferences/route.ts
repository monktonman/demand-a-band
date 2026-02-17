import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmailWithLog } from "@/lib/resend";
import { welcomeEmail } from "@/lib/email-templates";

// GET: Fetch user's preferences
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [bandPreferences, cityPreferences, genrePreferences] = await Promise.all([
    prisma.userBandPreference.findMany({
      where: { userId: session.user.id },
      include: { band: true },
      orderBy: { priority: "asc" },
    }),
    prisma.userCityPreference.findMany({
      where: { userId: session.user.id },
    }),
    prisma.userGenrePreference.findMany({
      where: { userId: session.user.id },
    }),
  ]);

  return NextResponse.json({ bandPreferences, cityPreferences, genrePreferences });
}

// POST: Save all preferences at once (during onboarding)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { bandPreferences, cityPreferences, genrePreferences } = body;

    // Check if this is the initial onboarding (not a later preference update)
    const isFirstOnboarding = !session.user.onboarded;

    // Use a transaction to save everything atomically
    await prisma.$transaction(async (tx) => {
      // Clear existing preferences
      await tx.userBandPreference.deleteMany({
        where: { userId: session.user.id },
      });
      await tx.userCityPreference.deleteMany({
        where: { userId: session.user.id },
      });
      await tx.userGenrePreference.deleteMany({
        where: { userId: session.user.id },
      });

      // Save band preferences
      if (bandPreferences && bandPreferences.length > 0) {
        await tx.userBandPreference.createMany({
          data: bandPreferences.map(
            (
              pref: {
                bandId: string;
                maxTicketPrice: number;
                priority: number;
                isDreamShow: boolean;
              },
              index: number
            ) => ({
              userId: session.user.id,
              bandId: pref.bandId,
              maxTicketPrice: pref.maxTicketPrice || 50,
              priority: pref.priority || index + 1,
              isDreamShow: pref.isDreamShow || false,
            })
          ),
        });
      }

      // Save city preferences
      if (cityPreferences && cityPreferences.length > 0) {
        await tx.userCityPreference.createMany({
          data: cityPreferences.map(
            (pref: { city: string; state: string; maxRadius?: number }) => ({
              userId: session.user.id,
              city: pref.city,
              state: pref.state,
              maxRadius: pref.maxRadius || 50,
            })
          ),
        });
      }

      // Save genre preferences
      if (genrePreferences && genrePreferences.length > 0) {
        await tx.userGenrePreference.createMany({
          data: genrePreferences.map(
            (pref: { genre: string }) => ({
              userId: session.user.id,
              genre: pref.genre,
            })
          ),
        });
      }

      // Mark user as onboarded
      await tx.user.update({
        where: { id: session.user.id },
        data: { onboarded: true },
      });
    });

    // Send welcome email only on first onboarding, not preference updates
    if (isFirstOnboarding) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, email: true },
      });

      if (user?.email) {
        try {
          await sendEmailWithLog({
            to: user.email,
            ...welcomeEmail(user.name || "there"),
            templateType: "welcome",
            userId: session.user.id,
          });
        } catch (err) {
          console.error("Failed to send welcome email:", err);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving preferences:", error);
    return NextResponse.json(
      { error: "Failed to save preferences" },
      { status: 500 }
    );
  }
}
