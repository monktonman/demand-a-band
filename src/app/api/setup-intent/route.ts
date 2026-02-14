import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSetupIntent, getPaymentMethods } from "@/lib/stripe-helpers";

// POST: Create a SetupIntent to save a payment method
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await createSetupIntent(session.user.id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("SetupIntent error:", error);
    return NextResponse.json(
      { error: "Failed to create setup intent" },
      { status: 500 }
    );
  }
}

// GET: Get user's saved payment methods
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const paymentMethods = await getPaymentMethods(session.user.id);
    return NextResponse.json({ paymentMethods });
  } catch (error) {
    console.error("Get payment methods error:", error);
    return NextResponse.json(
      { error: "Failed to get payment methods" },
      { status: 500 }
    );
  }
}
