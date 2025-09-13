import {json} from '@shopify/remix-oxygen';
import {hasPrintify, listProducts} from '~/lib/printify.server';

export async function loader({params, request, context}) {
  const {env, storefront} = context;

  const {handle} = params;
  if (!handle) return json({ok:false, error:'Missing handle'}, {status:400});

  // Fetch the Shopify product to get a stable title for matching across providers
  const productRes = await storefront.query(`#graphql\n  query P($handle: String!) { product(handle: $handle) { id title handle } }\n`, {variables: {handle}});
  const product = productRes?.product;
  if (!product) return json({ok:false, error:'Product not found'}, {status:404});

  const url = new URL(request.url);
  const shopId = url.searchParams.get('shop') || env.PRINTIFY_SHOP_ID;
  const canUsePrintify = hasPrintify(env) && Boolean(shopId);

  const titleSlug = slugify(product.title);
  const related = [];
  const seen = new Set();
  if (canUsePrintify) {
    try {
      for (let page = 1; page <= 5; page++) {
        const list = await listProducts(env, shopId, {page});
        if (!Array.isArray(list) || !list.length) break;
        for (const p of list) {
          const pSlug = slugify(p?.title || '');
          if (pSlug !== titleSlug) continue;
          const key = p.id || `${pSlug}:${p?.blueprint_id || ''}:${p?.print_provider_id || ''}`;
          if (seen.has(key)) continue; seen.add(key);
          const label = inferTypeLabel(p);
          related.push({
            id: p.id,
            title: p.title,
            blueprintId: p.blueprint_id || null,
            providerId: p.print_provider_id || null,
            label,
          });
        }
      }
    } catch (e) {
      // Swallow Printify errors and fall back to defaults
    }
  }

  // Attempt to resolve Shopify product handles for each inferred type label
  const results = [];
  for (const item of related.length ? related : DEFAULT_TYPES.map((t) => ({label: t}))) {
    const label = item.label || 'Print';
    const handleGuess = await findShopifyHandleForType(storefront, product.title, label);
    results.push({
      label,
      shopifyHandle: handleGuess || null,
    });
  }

  // Ensure we include the current product type first if we can infer it
  const currentLabel = inferTypeFromTitle(product.title) || 'Canvas';
  results.sort((a, b) => (a.label === currentLabel ? -1 : b.label === currentLabel ? 1 : a.label.localeCompare(b.label)));

  // De-duplicate labels
  const uniq = [];
  const seenLabels = new Set();
  for (const r of results) {
    if (seenLabels.has(r.label)) continue;
    seenLabels.add(r.label);
    uniq.push(r);
  }

  return json({ok:true, types: uniq, title: product.title});
}

const DEFAULT_TYPES = ['Canvas', 'Framed Canvas', 'Poster'];

function slugify(s = '') {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function inferTypeLabel(p) {
  const txt = `${p?.title || ''} ${p?.description || ''} ${(p?.tags || []).join(' ')}`.toLowerCase();
  if (/(framed|frame)/.test(txt)) return 'Framed Canvas';
  if (/(poster|print on paper|premium matte|glossy)/.test(txt)) return 'Poster';
  if (/(canvas|wrap)/.test(txt)) return 'Canvas';
  return 'Print';
}

function inferTypeFromTitle(title = '') {
  const t = String(title).toLowerCase();
  if (t.includes('framed')) return 'Framed Canvas';
  if (t.includes('poster')) return 'Poster';
  if (t.includes('canvas')) return 'Canvas';
  return null;
}

async function findShopifyHandleForType(storefront, title, label) {
  const kw = label.toLowerCase().includes('framed') ? 'framed' : label.toLowerCase().includes('poster') ? 'poster' : 'canvas';
  const qTitle = title.replace(/"/g, '');
  // Try a few search patterns; stop at first match
  const queries = [
    `title:*${qTitle}* AND (tag:${kw} OR product_type:${kw} OR title:*${kw}*)`,
    `(tag:${kw} OR product_type:${kw}) AND title:*${qTitle}*`,
  ];
  for (const query of queries) {
    try {
      const data = await storefront.query(`#graphql\n        query Find($q: String!) {\n          products(first: 1, query: $q) { nodes { handle title } }\n        }\n      `, {variables: {q: query}});
      const node = data?.products?.nodes?.[0];
      if (node?.handle) return node.handle;
    } catch {}
  }
  return null;
}
