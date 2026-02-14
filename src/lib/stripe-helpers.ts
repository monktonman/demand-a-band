import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

// Create or get Stripe customer for a user
export async function getOrCreateStripeCustomer(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, stripeCustomerId: true },
  });

  if (!user) throw new Error("User not found");

  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email: user.email || undefined,
    name: user.name || undefined,
    metadata: { userId: user.id },
  });

  // Save the customer ID
  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

// Create a SetupIntent to save a payment method
export async function createSetupIntent(userId: string) {
  const customerId = await getOrCreateStripeCustomer(userId);

  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ["card"],
    metadata: { userId },
  });

  return {
    clientSecret: setupIntent.client_secret,
    customerId,
  };
}

// Create a PaymentIntent to charge for a confirmed event
export async function createPaymentIntent(
  userId: string,
  amount: number,
  eventId: string,
  pledgeId: string,
  paymentMethodId?: string
) {
  const customerId = await getOrCreateStripeCustomer(userId);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency: "usd",
    customer: customerId,
    payment_method: paymentMethodId || undefined,
    confirm: !!paymentMethodId,
    off_session: !!paymentMethodId,
    metadata: {
      userId,
      eventId,
      pledgeId,
    },
  });

  return paymentIntent;
}

// Get customer's saved payment methods
export async function getPaymentMethods(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });

  if (!user?.stripeCustomerId) return [];

  const paymentMethods = await stripe.paymentMethods.list({
    customer: user.stripeCustomerId,
    type: "card",
  });

  return paymentMethods.data.map((pm) => ({
    id: pm.id,
    brand: pm.card?.brand || "unknown",
    last4: pm.card?.last4 || "****",
    expMonth: pm.card?.exp_month,
    expYear: pm.card?.exp_year,
  }));
}
