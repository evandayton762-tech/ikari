#!/usr/bin/env node
// Plan-first migration tool: Shopify -> Printify for "painting" products
// Modes: dry-run (default) prints mapping; --execute performs API calls
// Env required to execute:
//  SHOPIFY_STORE_DOMAIN=ikaritest.myshopify.com
//  SHOPIFY_ADMIN_TOKEN=shpat_*** (Admin API access)
//  PRINTIFY_API_KEY=***
//  PRINTIFY_SHOP_ID=*** (optional; will auto-pick if single)
//  PRINTIFY_BLUEPRINT_ID=*** (e.g., Canvas/Poster blueprint)
//  PRINTIFY_PROVIDER_ID=*** (preferred provider for the blueprint)

import fs from 'fs';
import path from 'path';

const args = new Set(process.argv.slice(2));
const EXECUTE = args.has('--execute');
const LIST_BLUEPRINTS = args.has('--list-blueprints');
const LIST_PROVIDERS = args.has('--list-providers');
const LIST_SHOPS = args.has('--list-shops');

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || process.env.PUBLIC_STORE_DOMAIN;
const SHOPIFY_ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const PRINTIFY_API_KEY = process.env.PRINTIFY_API_KEY;
const PRINTIFY_SHOP_ID = process.env.PRINTIFY_SHOP_ID || '';
const PRINTIFY_BLUEPRINT_ID = process.env.PRINTIFY_BLUEPRINT_ID || '';
const PRINTIFY_PROVIDER_ID = process.env.PRINTIFY_PROVIDER_ID || '';

function assertEnv(keys) {
  const missing = keys.filter((k) => !process.env[k]);
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
}

function logh(title) {
  console.log(`\n=== ${title} ===`);
}

async function shopifyGraphQL(query, variables = {}) {
  assertEnv(['SHOPIFY_STORE_DOMAIN', 'SHOPIFY_ADMIN_TOKEN']);
  const url = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2024-07/graphql.json`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Shopify GraphQL ${res.status}: ${txt}`);
  }
  const json = await res.json();
  if (json.errors) {
    throw new Error(`Shopify GraphQL errors: ${JSON.stringify(json.errors)}`);
  }
  return json.data;
}

async function printify(pathname, opts = {}) {
  assertEnv(['PRINTIFY_API_KEY']);
  const base = 'https://api.printify.com/v1';
  const res = await fetch(base + pathname, {
    ...opts,
    headers: {
      'Authorization': `Bearer ${PRINTIFY_API_KEY}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Printify ${pathname} ${res.status}: ${txt}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

async function listPrintifyShops() {
  return await printify('/shops.json');
}

async function listBlueprints() {
  return await printify('/catalog/blueprints.json');
}

async function listProviders(blueprintId) {
  return await printify(`/catalog/blueprints/${blueprintId}/print_providers.json`);
}

async function providerVariants(blueprintId, providerId) {
  return await printify(`/catalog/blueprints/${blueprintId}/print_providers/${providerId}/variants.json`);
}

function normalizeSizeLabel(s) {
  if (!s) return null;
  // Extract numbers like 12x16, 12" x 16" etc → "12x16"
  const m = s.replace(/[^0-9x]/gi, '').toLowerCase();
  const parts = m.split('x').filter(Boolean);
  if (parts.length >= 2) return `${parseInt(parts[0], 10)}x${parseInt(parts[1], 10)}`;
  return null;
}

function mapVariantsBySize(shopifyProducts, printifyVariantSpecs) {
  // Build a dictionary from normalized size → Printify variant id
  const dict = new Map();
  for (const v of printifyVariantSpecs) {
    const label = normalizeSizeLabel(v.title || v.name || v.size);
    if (label) dict.set(label, v.id);
  }
  const results = [];
  for (const p of shopifyProducts) {
    const mapped = [];
    for (const v of p.variants) {
      const sizeOpt = v.selectedOptions?.find((o) => /size/i.test(o.name))?.value || v.title;
      const key = normalizeSizeLabel(sizeOpt);
      const matchId = key ? dict.get(key) : undefined;
      mapped.push({ shopifyVariantId: v.id, shopifySize: sizeOpt, printifyVariantId: matchId || null });
    }
    results.push({ product: p, mapped });
  }
  return results;
}

async function fetchPaintingProducts() {
  assertEnv(['SHOPIFY_STORE_DOMAIN', 'SHOPIFY_ADMIN_TOKEN']);
  const out = [];
  let cursor = null;
  const query = `#graphql
    query List($cursor: String) {
      products(first: 50, after: $cursor, query: "product_type:painting OR tag:painting OR title:*painting*") {
        pageInfo { hasNextPage }
        edges {
          cursor
          node {
            id
            handle
            title
            productType
            tags
            description
            images(first: 5) { edges { node { url } } }
            options { name values }
            variants(first: 100) {
              edges { node { id title sku selectedOptions { name value } } }
            }
          }
        }
      }
    }
  `;
  while (true) {
    const data = await shopifyGraphQL(query, { cursor });
    const conn = data.products;
    for (const e of conn.edges) {
      const n = e.node;
      out.push({
        id: n.id,
        handle: n.handle,
        title: n.title,
        productType: n.productType,
        tags: n.tags,
        description: n.description,
        images: n.images?.edges?.map((e) => e.node.url) || [],
        options: n.options,
        variants: n.variants?.edges?.map((e) => e.node) || [],
      });
    }
    if (!conn.pageInfo.hasNextPage) break;
    cursor = conn.edges[conn.edges.length - 1].cursor;
  }
  return out;
}

async function uploadArtworkFromUrl(shopId, imageUrl) {
  // Download and re-upload to Printify as multipart/form-data
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error(`Failed to fetch image: ${imageUrl}`);
  const ab = await res.arrayBuffer();
  const blob = new Blob([ab]);
  const form = new FormData();
  form.append('file', blob, 'artwork.jpg');
  const uploadRes = await fetch(`https://api.printify.com/v1/uploads/images.json`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${PRINTIFY_API_KEY}` },
    body: form,
  });
  if (!uploadRes.ok) {
    const t = await uploadRes.text();
    throw new Error(`Printify upload failed: ${t}`);
  }
  return await uploadRes.json(); // { id, ... }
}

async function createPrintifyProduct(shopId, blueprintId, providerId, title, description, mapping, imageId) {
  const variantIds = mapping.filter((m) => m.printifyVariantId).map((m) => m.printifyVariantId);
  const variants = mapping
    .filter((m) => m.printifyVariantId)
    .map((m) => ({ id: m.printifyVariantId, price: 0, is_enabled: true }));
  const body = {
    title,
    description,
    blueprint_id: Number(blueprintId),
    print_provider_id: Number(providerId),
    variants,
    print_areas: [
      {
        variant_ids: variantIds,
        placeholders: [
          {
            position: 'front',
            images: [
              {
                id: imageId,
                x: 0,
                y: 0,
                scale: 1,
                angle: 0,
              },
            ],
          },
        ],
      },
    ],
  };
  return await printify(`/shops/${shopId}/products.json`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

async function publishPrintifyProduct(shopId, productId, { publish = true } = {}) {
  const body = { title: true, description: true, images: true, variants: true, tags: true }; // sync fields
  return await printify(`/shops/${shopId}/products/${productId}/publish.json`, {
    method: 'POST',
    body: JSON.stringify({ ...body, publish }),
  });
}

async function main() {
  if (LIST_BLUEPRINTS) {
    assertEnv(['PRINTIFY_API_KEY']);
    logh('Printify Blueprints (Wall Art subset)');
    const bps = await listBlueprints();
    for (const bp of bps.filter((b) => /wall|canvas|poster|frame/i.test(b.name))) {
      console.log(`${bp.id}\t${bp.name}`);
    }
    return;
  }
  if (LIST_SHOPS) {
    assertEnv(['PRINTIFY_API_KEY']);
    logh('Printify Shops');
    const shops = await listPrintifyShops();
    shops.forEach((s) => console.log(`${s.id}\t${s.title}`));
    return;
  }
  if (LIST_PROVIDERS) {
    assertEnv(['PRINTIFY_API_KEY', 'PRINTIFY_BLUEPRINT_ID']);
    logh(`Printify Providers for blueprint ${PRINTIFY_BLUEPRINT_ID}`);
    const provs = await listProviders(PRINTIFY_BLUEPRINT_ID);
    provs.forEach((p) => console.log(`${p.id}\t${p.title}`));
    return;
  }

  if (!EXECUTE) {
    console.log('Running in dry-run. Use --execute to perform API creation.');
  }

  // Preconditions for dry-run: only Shopify creds needed
  assertEnv(['SHOPIFY_STORE_DOMAIN', 'SHOPIFY_ADMIN_TOKEN']);
  const products = await fetchPaintingProducts();
  logh(`Found candidate painting products: ${products.length}`);

  if (!products.length) return;

  if (!PRINTIFY_API_KEY) {
    console.log('\nNote: PRINTIFY_API_KEY missing. Provide it to resolve providers/variants.');
    return;
  }

  const shops = await listPrintifyShops();
  const shopId = PRINTIFY_SHOP_ID || (shops?.length === 1 ? shops[0].id : null);
  if (!shopId) {
    console.error('Please set PRINTIFY_SHOP_ID. Available shops:');
    console.error(shops.map((s) => `${s.id}\t${s.title}`).join('\n'));
    return;
  }

  if (!PRINTIFY_BLUEPRINT_ID || !PRINTIFY_PROVIDER_ID) {
    console.error('Set PRINTIFY_BLUEPRINT_ID and PRINTIFY_PROVIDER_ID. You can list options with:');
    console.error('  node scripts/printify-migrate.js --list-blueprints');
    console.error('  PRINTIFY_BLUEPRINT_ID=XXXX node scripts/printify-migrate.js --list-providers');
    return;
  }

  const pv = await providerVariants(Number(PRINTIFY_BLUEPRINT_ID), Number(PRINTIFY_PROVIDER_ID));
  // Flatten provider variant list (structure may vary by API version)
  const pvList = Array.isArray(pv) ? pv : pv?.variants || [];
  const mapped = mapVariantsBySize(products.map((p) => ({
    id: p.id,
    handle: p.handle,
    title: p.title,
    variants: p.variants,
  })), pvList);

  let totalMappable = 0;
  for (const m of mapped) {
    const ok = m.mapped.filter((x) => !!x.printifyVariantId).length;
    totalMappable += ok;
    console.log(`- ${m.product.title} (${m.product.handle}) → ${ok}/${m.mapped.length} variant size matches`);
  }
  logh(`Total variant matches: ${totalMappable}`);

  if (!EXECUTE) return; // stop in dry-run

  // Execute creation in Printify as Drafts
  for (const m of mapped) {
    const product = products.find((p) => p.handle === m.product.handle);
    const img = product.images?.[0];
    if (!img) {
      console.warn(`Skipping ${product.title}: no image`);
      continue;
    }
    try {
      const upload = await uploadArtworkFromUrl(shopId, img);
      const created = await createPrintifyProduct(
        shopId,
        Number(PRINTIFY_BLUEPRINT_ID),
        Number(PRINTIFY_PROVIDER_ID),
        product.title,
        product.description || '',
        m.mapped,
        upload.id
      );
      await publishPrintifyProduct(shopId, created.id, { publish: false });
      console.log(`Created Printify draft for ${product.handle} → ${created.id}`);
    } catch (err) {
      console.error(`Failed ${product.handle}:`, err.message);
    }
  }

  logh('Done. Review drafts in Printify, then decide link/swap strategy.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
