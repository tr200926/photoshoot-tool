import { Router, Request, Response } from 'express';
import { asyncHandler, AppError } from '@middleware/errorHandler';
import { authMiddleware as authenticate } from '@middleware/auth';
import {
  PLANS,
  PlanKey,
  createCheckoutSession,
  createBillingPortalSession,
  handleWebhook,
} from '@services/stripeService';

const router = Router();

// GET /api/billing/plans — public, no auth needed
router.get('/plans', (_req: Request, res: Response) => {
  const plans = Object.entries(PLANS).map(([key, plan]) => ({
    key,
    name: plan.name,
    price: plan.price,
    monthlyCredits: plan.monthlyCredits,
    features: plan.features,
    popular: key === 'pro',
  }));

  res.json({ success: true, plans });
});

// POST /api/billing/checkout — create Stripe checkout session
router.post(
  '/checkout',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { plan, successUrl, cancelUrl } = req.body;

    if (!plan || !PLANS[plan as PlanKey]) {
      throw new AppError(
        `Invalid plan. Choose: ${Object.keys(PLANS).join(', ')}`,
        400,
        'VALIDATION_ERROR',
      );
    }
    if (!successUrl || !cancelUrl) {
      throw new AppError('successUrl and cancelUrl are required', 400, 'VALIDATION_ERROR');
    }
    if ((PLANS[plan as PlanKey] as { price: number }).price === 0) {
      throw new AppError('Free plan does not require checkout', 400, 'VALIDATION_ERROR');
    }

    const url = await createCheckoutSession(
      req.workspaceId!,
      plan as PlanKey,
      successUrl,
      cancelUrl,
    );

    res.json({ success: true, url });
  }),
);

// POST /api/billing/portal — Stripe billing portal
router.post(
  '/portal',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { returnUrl } = req.body;
    if (!returnUrl) throw new AppError('returnUrl is required', 400, 'VALIDATION_ERROR');

    const url = await createBillingPortalSession(req.workspaceId!, returnUrl);
    res.json({ success: true, url });
  }),
);

// POST /api/billing/webhook — Stripe webhooks (no auth, raw body)
router.post('/webhook', asyncHandler(async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  if (!sig) throw new AppError('Missing stripe-signature header', 400, 'VALIDATION_ERROR');

  // req.body is raw Buffer when using express.raw() middleware
  await handleWebhook(req.body as Buffer, sig);
  res.json({ received: true });
}));

export default router;
