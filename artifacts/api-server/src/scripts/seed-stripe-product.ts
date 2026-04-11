import { getUncachableStripeClient } from "../stripeClient";

async function main() {
  const stripe = await getUncachableStripeClient();

  const product = await stripe.products.create({
    name: "7-Night Sleep Reset",
    description: "A 7-night guided sleep improvement program using CBT-I techniques. Includes nightly checklists, guided audio, sleep diary, and progress tracking.",
    metadata: {
      app: "sleep-reset",
    },
  });

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: 4700,
    currency: "usd",
    metadata: {
      app: "sleep-reset",
    },
  });

  console.log("✅ Stripe product created:");
  console.log(`   Product ID: ${product.id}`);
  console.log(`   Price ID:   ${price.id}`);
  console.log("");
  console.log("Add this to your .env:");
  console.log(`   VITE_STRIPE_PRICE_ID=${price.id}`);
}

main().catch((err) => {
  console.error("Failed to seed Stripe product:", err.message);
  process.exit(1);
});
