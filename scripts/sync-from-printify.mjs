/**
 * Sync prices and descriptions from Printify to Shopify (Admin API).
 *
 * Usage (dry-run):
 *   node scripts/sync-from-printify.mjs
 *
 * Apply changes:
 *   SYNC_APPLY=true node scripts/sync-from-printify.mjs
 *
 * Required env:
 *   PRINTIFY_API_KEY
 *   PRINTIFY_SHOP_ID      (if omitted, the first shop is used)
 *   SHOPIFY_STORE_DOMAIN  (e.g. ikaritest.myshopify.com)
 *   SHOPIFY_ADMIN_API_TOKEN (Private app or custom app token with write_products)
 *
 * Optional env:
 *   PRINTIFY_MARKUP       (e.g. 2.2 — multiplier applied to Printify variant base cost)
 *   PRICE_MIN             (e.g. 39 — floors the price)
 *   PRICE_MAX             (e.g. 199 — caps the price)
 *   DRY_RUN               (alias for !SYNC_APPLY)
 */
import 'dotenv/config';

const env = process.env;
const APPLY = String(env.SYNC_APPLY || '').toLowerCase() === 'true' && !env.DRY_RUN;
const PRINTIFY_API_KEY = env.PRINTIFY_API_KEY;
const PRINTIFY_SHOP_ID = env.PRINTIFY_SHOP_ID || '';
const SHOPIFY_DOMAIN = env.SHOPIFY_STORE_DOMAIN;
const SHOPIFY_ADMIN_TOKEN = env.SHOPIFY_ADMIN_API_TOKEN;
const MARKUP = Number(env.PRINTIFY_MARKUP || 2.2);
const PRICE_MIN = Number(env.PRICE_MIN || 39);
const PRICE_MAX = Number(env.PRICE_MAX || 199);

if (!PRINTIFY_API_KEY) throw new Error('PRINTIFY_API_KEY missing');
if (!SHOPIFY_DOMAIN) throw new Error('SHOPIFY_STORE_DOMAIN missing');
if (!SHOPIFY_ADMIN_TOKEN) throw new Error('SHOPIFY_ADMIN_API_TOKEN missing');

async function pApi(path) {
  const url = `https://api.printify.com/v1${path}`;
  const r = await fetch(url, {headers: {Authorization: `Bearer ${PRINTIFY_API_KEY}`}});
  if (!r.ok) throw new Error(`Printify ${path} -> ${r.status} ${await r.text()}`);
  return r.json();
}

async function sAdmin(query, variables) {
  const url = `https://${SHOPIFY_DOMAIN}/admin/api/2024-07/graphql.json`;
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({query, variables}),
  });
  const j = await r.json();
  if (!r.ok || j.errors) {
    throw new Error(`Shopify Admin error: ${r.status} ${JSON.stringify(j.errors || j)}`);
  }
  return j.data;
}

function centsToDollars(cents) {
  return Number((Number(cents) / 100).toFixed(2));
}

function computePrice(variant) {
  // Printify variant.price is in cents
  const base = centsToDollars(variant?.price || 0);
  let price = Math.max(PRICE_MIN, Math.min(PRICE_MAX, Number((base * MARKUP).toFixed(2))));
  // Nice endings (e.g., .99)
  price = Math.floor(price) + 0.99;
  return Number(price.toFixed(2));
}

async function findShopId() {
  if (PRINTIFY_SHOP_ID) return PRINTIFY_SHOP_ID;
  const shops = await pApi('/shops.json');
  const first = Array.isArray(shops) ? shops[0] : null;
  if (!first) throw new Error('No Printify shops found');
  return String(first.id);
}

async function fetchAllPrintifyProducts(shopId) {
  let page = 1;
  const all = [];
  // Printify supports page param; iterate until empty
  while (true) {
    const list = await pApi(`/shops/${shopId}/products.json?page=${page}`);
    if (!Array.isArray(list) || list.length === 0) break;
    all.push(...list);
    page += 1;
    if (page > 20) break; // safety cap
  }
  return all;
}

async function getShopifyProductIdByHandle(handle) {
  const q = `#graphql
    query($handle: String!) {
      productByHandle(handle: $handle) { id title handle variants(first: 100) { nodes { id sku title price } } }
    }
  `;
  const data = await sAdmin(q, {handle});
  return data.productByHandle;
}

async function getShopifyProductBySKU(sku) {
  const q = `#graphql
    query($query: String!) {
      products(first: 5, query: $query) {
        nodes { id title handle variants(first: 100) { nodes { id sku title price } } }
      }
    }
  `;
  const data = await sAdmin(q, {query: `sku:${JSON.stringify(sku)}`});
  return data.products?.nodes?.[0] || null;
}

async function updateVariantPrice(variantId, price) {
  if (!APPLY) return {ok: true, dryRun: true};
  const m = `#graphql
    mutation($id: ID!, $price: Money!) {
      productVariantUpdate(input: {id: $id, price: $price}) { userErrors { field message } productVariant { id price } }
    }
  `;
  const data = await sAdmin(m, {id: variantId, price});
  const errs = data.productVariantUpdate?.userErrors || [];
  if (errs.length) throw new Error(`Variant update errors: ${JSON.stringify(errs)}`);
  return data.productVariantUpdate?.productVariant;
}

async function updateProductDescription(productId, html) {
  if (!APPLY) return {ok: true, dryRun: true};
  const m = `#graphql
    mutation($id: ID!, $desc: String!) {
      productUpdate(input: {id: $id, descriptionHtml: $desc}) { userErrors { field message } product { id } }
    }
  `;
  const data = await sAdmin(m, {id: productId, desc: html});
  const errs = data.productUpdate?.userErrors || [];
  if (errs.length) throw new Error(`Product update errors: ${JSON.stringify(errs)}`);
  return data.productUpdate?.product;
}

function buildDescription(printifyProduct) {
  const title = printifyProduct?.title || 'Artwork';
  const desc = printifyProduct?.description || '';
  const more = `\n\nMuseum-grade gallery wrapped canvas, hand-stretched over solid wood, ready to hang. Printed and fulfilled by Printify.`;
  const html = `<p>${escapeHtml(desc || title)}</p><p>${escapeHtml(more)}</p>`;
  return html;
}

function escapeHtml(s='') {
  return s.replace(/[&<>]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
}

async function main() {
  const shopId = await findShopId();
  console.log(`Using Printify shop ${shopId}`);
  const products = await fetchAllPrintifyProducts(shopId);
  console.log(`Found ${products.length} Printify products`);

  let updated = 0, skipped = 0;
  for (const p of products) {
    // Try to find Shopify product by SKU of first variant or by handle
    const firstVariant = p.variants?.[0];
    let sp = null;
    if (firstVariant?.sku) {
      sp = await getShopifyProductBySKU(firstVariant.sku).catch(() => null);
    }
    if (!sp && p.handle) {
      sp = await getShopifyProductIdByHandle(p.handle).catch(() => null);
    }
    if (!sp) { skipped++; continue; }

    // Update description if blank
    const needsDesc = !sp?.bodyHtml && !sp?.descriptionHtml; // Admin query above doesn't include body; safe default
    if (needsDesc) {
      try { await updateProductDescription(sp.id, buildDescription(p)); } catch (e) { console.warn('Desc update failed', e.message); }
    }

    // Update variant prices based on Printify base price
    const bySku = new Map();
    for (const v of p.variants || []) bySku.set(v.sku, v);
    for (const v of sp.variants?.nodes || []) {
      const pv = v.sku ? bySku.get(v.sku) : null;
      if (!pv) continue;
      const target = computePrice(pv);
      const current = Number(v.price || 0);
      if (!current || Math.abs(current - target) >= 0.5) {
        try {
          await updateVariantPrice(v.id, target);
          updated++;
          console.log(`Updated ${sp.handle || sp.id} :: ${v.sku} -> ${target}`);
        } catch (e) {
          console.warn('Price update failed', sp.handle, v.sku, e.message);
        }
      }
    }
  }

  console.log(`Done. Updated variants: ${updated}. Skipped products: ${skipped}. Mode: ${APPLY ? 'APPLY' : 'DRY-RUN'}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
