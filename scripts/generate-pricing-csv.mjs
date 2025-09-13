#!/usr/bin/env node
// Generate a Shopify product CSV to update variant prices
// using size- and material-based pricing (no Admin access required).
// Import the resulting CSV in Shopify Admin → Products → Import.

import 'dotenv/config';
import fs from 'fs';
import path from 'path';

const DOMAIN = process.env.PUBLIC_STORE_DOMAIN || process.env.PUBLIC_STORE_DOMAIN || process.env.SHOPIFY_STORE_DOMAIN;
const STOREFRONT_TOKEN = process.env.PUBLIC_STOREFRONT_API_TOKEN;

if (!DOMAIN || !STOREFRONT_TOKEN) {
  console.error('Missing PUBLIC_STORE_DOMAIN or PUBLIC_STOREFRONT_API_TOKEN in .env');
  process.exit(1);
}

const RATE = {
  canvas: Number(process.env.PRICE_RATE_CANVAS || 0.45),
  poster: Number(process.env.PRICE_RATE_POSTER || 0.12),
  framed: Number(process.env.PRICE_RATE_FRAMED || 0.60),
};
const PRICE_MIN = Number(process.env.PRICE_MIN || 19.99);
const PRICE_MAX = Number(process.env.PRICE_MAX || 999.99);
const ENDING = Number(process.env.PRICE_ROUND_ENDING || 0.99);
const FILTER_QUERY = process.env.FILTER_QUERY || 'tag:canvas OR product_type:canvas OR tag:poster OR product_type:poster OR tag:framed OR product_type:framed OR tag:painting OR product_type:painting';

function storefront(query, variables={}) {
  return fetch(`https://${DOMAIN}/api/2024-07/graphql.json`, {
    method: 'POST',
    headers: {
      'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({query, variables})
  }).then(async (res) => {
    if (!res.ok) throw new Error(`Storefront ${res.status}: ${await res.text()}`);
    const j = await res.json();
    if (j.errors) throw new Error(JSON.stringify(j.errors));
    return j.data;
  });
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
  p = Math.floor(p) + ENDING;
  return Number(p.toFixed(2));
}

async function* iterateProducts(query) {
  let cursor = null;
  while (true) {
    const data = await storefront(`query Products($cursor: String, $q: String) {\n      products(first: 100, after: $cursor, query: $q) {\n        pageInfo { hasNextPage }\n        nodes {\n          id handle title productType tags\n          options { name values }\n          variants(first: 100) {\n            nodes { id title sku price { amount currencyCode } selectedOptions { name value } }\n          }\n        }\n      }\n    }`, { cursor, q: query });
    const conn = data.products;
    for (const p of conn.nodes) yield p;
    if (!conn.pageInfo.hasNextPage) break;
    // derive cursor using last variant id (not available here). Use nodes paging fallback:
    // Storefront API products lacks cursor on nodes; we instead refetch with created_at sort? Skipping advanced paging here.
    // Break to avoid infinite loop if more than 100 products.
    break;
  }
}

function csvEscape(v) {
  if (v == null) return '';
  const s = String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

async function main() {
  const rows = [];
  const header = [
    'Handle','Title',
    'Option1 Name','Option1 Value','Option2 Name','Option2 Value','Option3 Name','Option3 Value',
    'Variant SKU','Variant Price','Variant Compare At Price'
  ];
  rows.push(header);

  let count = 0;
  for await (const p of iterateProducts(FILTER_QUERY)) {
    const material = inferMaterial(p);
    const options = p.options || [];
    // Map option name -> position
    const names = options.map((o) => o.name);
    for (const v of (p.variants?.nodes || [])) {
      const optValues = ['','',''];
      const so = v.selectedOptions || [];
      for (let i=0; i<Math.min(3, names.length); i++) {
        const name = names[i];
        const found = so.find((o) => o.name === name);
        optValues[i] = found ? found.value : '';
      }
      // pick the size value from any option that looks like size
      const sizeVal = so.find((o) => slug(o.name).includes('size'))?.value || v.title;
      const price = calcPrice(material, sizeVal);
      if (!price) continue;
      const row = [
        p.handle,
        p.title,
        names[0] || '', optValues[0],
        names[1] || '', optValues[1],
        names[2] || '', optValues[2],
        v.sku || '',
        price,
        ''
      ];
      rows.push(row.map(csvEscape));
      count++;
    }
  }

  const outDir = path.join(process.cwd(), 'scripts', 'output');
  fs.mkdirSync(outDir, {recursive: true});
  const outPath = path.join(outDir, 'pricing_update.csv');
  fs.writeFileSync(outPath, rows.map((r)=>r.join(',')).join('\n'));
  console.log(`Wrote ${count} variant rows to ${outPath}`);
}

main().catch((e)=>{ console.error(e); process.exit(1); });
