#!/usr/bin/env node
// Sync Shopify variant prices based on size and material type.
// - Uses a simple square-inch rate per material (Canvas/Poster/Framed)
// - Assumes variants have a Size option like "18x24"
// - Dry-run by default; pass --execute to apply changes
//
// Required env:
//   SHOPIFY_STORE_DOMAIN=ikaritest.myshopify.com
//   SHOPIFY_ADMIN_TOKEN=shpat_***
// Optional env (defaults shown):
//   PRICE_RATE_CANVAS=0.45       USD per sq in
//   PRICE_RATE_POSTER=0.18       USD per sq in
//   PRICE_RATE_FRAMED=0.55       USD per sq in
//   PRICE_MIN=19.99
//   PRICE_MAX=999.99
//   PRICE_ROUND_ENDING=0.99      sets .99 endings
//   FILTER_QUERY=tag:painting    GraphQL products query filter

import 'dotenv/config';

const DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || process.env.PUBLIC_STORE_DOMAIN;
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN || process.env.SHOPIFY_ADMIN_API_TOKEN;
const EXECUTE = process.argv.includes('--execute');

const RATE = {
  canvas: Number(process.env.PRICE_RATE_CANVAS || 0.45),
  poster: Number(process.env.PRICE_RATE_POSTER || 0.18),
  framed: Number(process.env.PRICE_RATE_FRAMED || 0.55),
};
const PRICE_MIN = Number(process.env.PRICE_MIN || 19.99);
const PRICE_MAX = Number(process.env.PRICE_MAX || 999.99);
const ENDING = Number(process.env.PRICE_ROUND_ENDING || 0.99);
const FILTER_QUERY = process.env.FILTER_QUERY || 'tag:painting OR product_type:painting';

if (!DOMAIN || !TOKEN) {
  console.error('Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN');
  process.exit(1);
}

async function admin(query, variables={}) {
  const res = await fetch(`https://${DOMAIN}/admin/api/2024-07/graphql.json`, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({query, variables}),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Admin ${res.status}: ${t}`);
  }
  const j = await res.json();
  if (j.errors) throw new Error(JSON.stringify(j.errors));
  return j.data;
}

function slug(s='') { return String(s).toLowerCase(); }
function inferMaterial(product) {
  const t = slug(`${product.title} ${product.productType} ${(product.tags||[]).join(' ')}`);
  if (t.includes('framed')) return 'framed';
  if (t.includes('poster') || t.includes('print')) return 'poster';
  return 'canvas';
}
function parseSize(s='') {
  const m = String(s).trim().match(/(\d+(?:\.\d+)?)\s*[xX]\s*(\d+(?:\.\d+)?)/);
  if (!m) return null;
  return { w: Number(m[1]), h: Number(m[2]) };
}
function calcPrice(material, sizeStr) {
  const sz = parseSize(sizeStr);
  if (!sz) return null;
  const rate = RATE[material] || RATE.canvas;
  let p = Math.max(1, sz.w * sz.h) * rate;
  p = Math.max(PRICE_MIN, Math.min(PRICE_MAX, p));
  // round to .99
  p = Math.floor(p) + ENDING;
  return Number(p.toFixed(2));
}

async function* iterateProducts(query) {
  let cursor = null;
  while (true) {
    const data = await admin(`query Products($cursor: String, $query: String) {\n      products(first: 50, after: $cursor, query: $query) {\n        pageInfo { hasNextPage }\n        edges { cursor node { id handle title productType tags options { name values } variants(first: 100) { edges { node { id title price selectedOptions { name value } } } } } }\n      }\n    }`, { cursor, query });
    const conn = data.products;
    for (const e of conn.edges) yield e.node;
    if (!conn.pageInfo.hasNextPage) break;
    cursor = conn.edges[conn.edges.length - 1].cursor;
  }
}

async function updateVariantPrice(variantId, price) {
  const data = await admin(`mutation VU($id: ID!, $price: Money) {\n    productVariantUpdate(input: {id: $id, price: $price}) {\n      productVariant { id price }\n      userErrors { field message }\n    }\n  }`, { id: variantId, price });
  const errs = data.productVariantUpdate?.userErrors || [];
  if (errs.length) throw new Error(errs.map((e)=>e.message).join(', '));
  return data.productVariantUpdate?.productVariant;
}

async function main() {
  const changes = [];
  let touched = 0;
  for await (const p of iterateProducts(FILTER_QUERY)) {
    const mat = inferMaterial(p);
    const sizeOpt = (p.options || []).find((o) => slug(o.name) === 'size');
    if (!sizeOpt) continue; // skip products without size variants
    for (const ve of p.variants?.edges || []) {
      const v = ve.node;
      const sizeVal = (v.selectedOptions || []).find((o) => slug(o.name) === 'size')?.value || v.title;
      const next = calcPrice(mat, sizeVal);
      if (!next) continue;
      const current = Number(v.price);
      if (Math.abs(current - next) >= 0.01) {
        changes.push({ variantId: v.id, from: current, to: next, handle: p.handle, size: sizeVal, material: mat });
      }
    }
  }

  console.log(`Planned changes: ${changes.length}`);
  for (const c of changes) {
    console.log(`${c.handle} [${c.material}] size ${c.size}: ${c.from} → ${c.to}`);
  }

  if (!EXECUTE) {
    console.log('\nDry-run complete. Pass --execute to apply.');
    return;
  }

  for (const c of changes) {
    try {
      await updateVariantPrice(c.variantId, c.to);
      touched++;
      console.log(`Updated ${c.handle} ${c.size} to ${c.to}`);
    } catch (e) {
      console.error(`Failed to update ${c.handle} ${c.size}:`, e.message);
    }
  }
  console.log(`\nDone. Updated ${touched} variants.`);
}

main().catch((e)=>{ console.error(e); process.exit(1); });

