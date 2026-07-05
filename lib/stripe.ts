import Stripe from "stripe";

let _stripe: Stripe | null = null;

/** Server-only Stripe client. Created lazily so the app builds without a key. */
export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured in .env.local");
  _stripe = new Stripe(key);
  return _stripe;
}
