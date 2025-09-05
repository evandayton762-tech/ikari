/**
 * Set product variant prices based on image orientation.
 *
 * Usage:
 *   # Dry run (no changes):
 *   node scripts/sync-orientation-pricing.mjs
 *
 *   # Apply changes:
 *   SYNC_APPLY=true node scripts/sync-orientation-pricing.mjs
 *
 * Required env:
 *   SHOPIFY_STORE_DOMAIN       e.g. myshop.myshopify.com
 *   SHOPIFY_ADMIN_API_TOKEN    Admin token with write_products
 *
 * Optional env (defaults in parens):
 *   ORIENTATION_PRICE_LANDSCAPE (99.99)
 *   ORIENTATION_PRICE_PORTRAIT  (89.99)
 *   ORIENTATION_PRICE_SQUARE    (94.99)
 */
import 'dotenv/config';

const APPLY = String(process.env.SYNC_APPLY || '').toLowerCase() === 'true';
const DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;

if (!DOMAIN) throw new Error('SHOPIFY_STORE_DOMAIN is required');
if (!TOKEN) throw new Error('SHOPIFY_ADMIN_API_TOKEN is required');

const P_LAND = parseFloat(process.env.ORIENTATION_PRICE_LANDSCAPE || '139.99');
const P_PORT = parseFloat(process.env.ORIENTATION_PRICE_PORTRAIT || '129.99');
const P_SQ   = parseFloat(process.env.ORIENTATION_PRICE_SQUARE   || '134.99');

async function admin(query, variables) {
  const res = await fetch(`https://${DOMAIN}/admin/api/2024-07/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': TOKEN,
    },
    body: JSON.stringify({query, variables}),
  });
  const json = await res.json();
  if (!res.ok || json.errors) {
    throw new Error(`Admin GraphQL error: ${res.status} ${JSON.stringify(json.errors || json)}`);
  }
  return json.data;
}

const LIST_Q = `#graphql
  query Products($cursor: String) {
    products(first: 100, after: $cursor) {
      nodes {
        id
        handle
        title
        images(first: 1) { nodes { width height } }
        variants(first: 100) { nodes { id price } }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

const UPDATE_Q = `#graphql
  mutation UpdateVariant($id: ID!, $price: Money!) {
    productVariantUpdate(input: {id: $id, price: $price}) {
      userErrors { field message }
      productVariant { id price }
    }
  }
`;

function orientation(img) {
  const w = img?.width || 0;
  const h = img?.height || 0;
  if (!w || !h) return 'unknown';
  if (Math.abs(w - h) <= 2) return 'square';
  return w > h ? 'landscape' : 'portrait';
}

function priceForOrientation(o) {
  if (o === 'landscape') return P_LAND;
  if (o === 'portrait') return P_PORT;
  if (o === 'square') return P_SQ;
  return null;
}

async function* allProducts() {
  let cursor = null;
  while (true) {
    const data = await admin(LIST_Q, {cursor});
    const conn = data.products;
    for (const n of conn.nodes) yield n;
    if (!conn.pageInfo.hasNextPage) break;
    cursor = conn.pageInfo.endCursor;
  }
}

async function main() {
  let touched = 0;
  let skipped = 0;
  for await (const p of allProducts()) {
    const img = p.images?.nodes?.[0] || null;
    const o = orientation(img);
    const target = priceForOrientation(o);
    if (target == null) {
      skipped++; continue;
    }
    for (const v of p.variants?.nodes || []) {
      const current = parseFloat(v.price || '0');
      if (!current || Math.abs(current - target) >= 0.5) {
        if (APPLY) {
          const upd = await admin(UPDATE_Q, {id: v.id, price: Number(target.toFixed(2))});
          const errs = upd.productVariantUpdate?.userErrors || [];
          if (errs.length) {
            console.warn('Update error', p.handle, v.id, errs);
          } else {
            console.log(`Set ${p.handle} ${v.id.split('/').pop()} -> ${target} (${o})`);
            touched++;
          }
        } else {
          console.log(`[dry] Would set ${p.handle} ${v.id.split('/').pop()} -> ${target} (${o})`);
        }
      }
    }
  }
  console.log(`Done. Updated variants: ${touched}. Skipped products: ${skipped}. Mode: ${APPLY ? 'APPLY' : 'DRY-RUN'}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
