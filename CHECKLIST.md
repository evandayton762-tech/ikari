# Ikari Store – Go‑Live Checklist (Cart/Checkout)

This project is a Shopify Hydrogen (Remix) storefront. The cart and checkout flows have been hardened and verified locally. Use this checklist before pushing live.

## Environment
- SESSION_SECRET: set and non-empty.
- PUBLIC_STORE_DOMAIN: your store domain (e.g. `example.myshopify.com`).
- Storefront API tokens: run `npx shopify hydrogen link` to inject envs locally, or set required tokens on your hosting provider (Oxygen/Vercel/etc.).
- Optional: `DEBUG_CART=1` to surface cart action errors in server logs during QA.

## Local Verification
- `npm install` (Node >= 18)
- `npm run dev` (or `shopify hydrogen dev`)
- Visit a product page → “Add to cart”:
  - Cart count increases immediately (optimistic update).
  - Cart aside lists the line item.
- Open “Cart” page:
  - Line items render with quantity controls and remove.
  - Subtotal/Total display.
  - “Proceed to Checkout” link is present and navigates to Shopify checkout.
- Update quantity/remove line → totals update.
- Apply discount/gift card in cart page → no errors, UI updates.

## Production Readiness
- Build: `npm run build` succeeds.
- Preview: `npm run preview` (or platform preview) renders cart and checkout.
- Cookies:
  - Cart cookie (`cart`) is set and persists across reloads and navigation.
  - Session cookie is appended (server.js appends without clobbering cart cookie).
- Monitoring:
  - Review logs for any `[cart.action]` errors; resolve before launch.

## Notes on Recent Fixes
- GraphQL: merged duplicate `lines.nodes` selections in `CART_QUERY_FRAGMENT` to a single block including `...CartLine` and `...CartLineComponent`.
- Cart action hardening: try/catch added, clearer 400 responses on invalid inputs/API errors, optional `DEBUG_CART` logging.

## Deploy
- Commit changes and push to your remote.
- Ensure production environment variables mirror local.
- In Oxygen, attach environment and publish. In other hosts, set envs and deploy.

Happy launch!
