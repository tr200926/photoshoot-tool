import Stripe from 'stripe';
import config from '@config/env';
import { getPrismaClient } from '@config/database';

const prisma = getPrismaClient();

const getStripe = (): Stripe => {
  if (!config.stripe.secretKey) {
    throw new Error('Stripe secret key not configured');
  }
  return new Stripe(config.stripe.secretKey);
};

export const PLANS = {
  free: {
    name: 'Free',
    monthlyCredits: 100,
    price: 0,
    priceId: null as string | null,
    features: ['100 credits/month', '1 workspace', 'Basic exports', 'Standard quality'],
  },
  starter: {
    name: 'Starter',
    monthlyCredits: 1000,
    price: 29,
    priceId: process.env.STRIPE_PRICE_STARTER || null,
    features: ['1,000 credits/month', '3 workspaces', 'All export formats', 'HD quality', 'Priority support'],
  },
  pro: {
    name: 'Pro',
    monthlyCredits: 5000,
    price: 79,
    priceId: process.env.STRIPE_PRICE_PRO || null,
    features: [
      '5,000 credits/month',
      'Unlimited workspaces',
      'All export formats',
      '4K quality',
      'White label',
      'API access',
      'Priority support',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    monthlyCredits: 25000,
    price: 299,
    priceId: process.env.STRIPE_PRICE_ENTERPRISE || null,
    features: [
      '25,000 credits/month',
      'Unlimited everything',
      'Custom AI models',
      'Dedicated support',
      'SLA guarantee',
      'Custom integrations',
    ],
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export const createCheckoutSession = async (
  workspaceId: string,
  planKey: PlanKey,
  successUrl: string,
  cancelUrl: string,
): Promise<string> => {
  const stripe = getStripe();
  const plan = PLANS[planKey];

  if (!plan.priceId) {
    throw new Error(`No Stripe price ID configured for plan: ${planKey}`);
  }

  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!workspace) throw new Error('Workspace not found');

  let customerId = (workspace as any).stripeCustomerId as string | undefined;

  if (!customerId) {
    // Get the workspace owner email
    const adminMember = await prisma.workspaceMember.findFirst({
      where: { workspaceId, role: 'admin' },
      include: { user: { select: { email: true, name: true } } },
    });

    const customer = await stripe.customers.create({
      ...(adminMember?.user?.email && { email: adminMember.user.email }),
      ...(adminMember?.user?.name && { name: adminMember.user.name }),
      metadata: { workspaceId },
    });
    customerId = customer.id;

    await prisma.workspace.update({
      where: { id: workspaceId },
      data: { stripeCustomerId: customerId } as any,
    });
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: plan.priceId, quantity: 1 }],
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    metadata: { workspaceId, plan: planKey },
    subscription_data: {
      metadata: { workspaceId, plan: planKey },
    },
  });

  return session.url!;
};

export const createBillingPortalSession = async (
  workspaceId: string,
  returnUrl: string,
): Promise<string> => {
  const stripe = getStripe();

  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  const customerId = (workspace as any)?.stripeCustomerId as string | undefined;

  if (!customerId) {
    throw new Error('No Stripe customer found for this workspace. Please subscribe first.');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session.url;
};

export const handleWebhook = async (payload: Buffer, signature: string): Promise<void> => {
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, config.stripe.webhookSecret);
  } catch {
    throw new Error('Invalid webhook signature');
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const { workspaceId, plan } = session.metadata || {};
      if (workspaceId && plan) {
        const planData = PLANS[plan as PlanKey];
        await prisma.workspace.update({
          where: { id: workspaceId },
          data: {
            plan,
            monthlyCredits: planData.monthlyCredits,
            stripeSubscriptionId: session.subscription as string,
          } as any,
        });
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const { workspaceId, plan } = subscription.metadata || {};
      if (workspaceId && plan) {
        const planData = PLANS[plan as PlanKey];
        await prisma.workspace.update({
          where: { id: workspaceId },
          data: {
            plan,
            monthlyCredits: planData.monthlyCredits,
          } as any,
        });
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const { workspaceId } = subscription.metadata || {};
      if (workspaceId) {
        await prisma.workspace.update({
          where: { id: workspaceId },
          data: {
            plan: 'free',
            monthlyCredits: PLANS.free.monthlyCredits,
          } as any,
        });
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;
      // Find workspace by customer ID - log the issue
      console.error(`Payment failed for customer ${customerId}`);
      break;
    }
  }
};
