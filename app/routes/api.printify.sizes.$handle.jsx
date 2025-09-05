import {json} from '@shopify/remix-oxygen';
import {hasPrintify, listProducts} from '~/lib/printify.server';

export async function loader({params, request, context}) {
  const {env} = context;
  if (!hasPrintify(env)) return json({ok: false, error: 'PRINTIFY_API_KEY not set'}, {status: 400});
  const {handle} = params;
  const url = new URL(request.url);
  const shopId = url.searchParams.get('shop') || env.PRINTIFY_SHOP_ID;
  if (!shopId) return json({ok: false, error: 'Missing shop id'}, {status: 400});

  try {
    // Pull first few pages to find a matching product by handle or title
    const sizes = new Set();
    for (let page = 1; page <= 3; page++) {
      const list = await listProducts(env, shopId, {page});
      if (!Array.isArray(list) || !list.length) break;
      for (const p of list) {
        const match = (p.handle && p.handle === handle) || (p.title && slugify(p.title) === handle);
        if (!match) continue;
        for (const v of p.variants || []) {
          const s = extractSizeFromVariant(v);
          if (s) sizes.add(s);
        }
        return json({ok: true, sizes: Array.from(sizes)});
      }
    }
    return json({ok: true, sizes: []});
  } catch (e) {
    return json({ok: false, error: String(e)}, {status: 500});
  }
}

function slugify(s = '') {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function extractSizeFromVariant(variant) {
  try {
    // Common Printify schema: variant.options is an array like [{name:'Size', value:'18x24'}]
    const opts = variant.options || variant.Options || [];
    const sizeOpt = opts.find((o) => String(o.name || o.option || '').toLowerCase().includes('size'));
    if (sizeOpt && sizeOpt.value) return normalizeSize(sizeOpt.value);
    // Fallback: parse from title like "Canvas / 18x24 / 1.25"
    const t = String(variant.title || '');
    const m = t.match(/(\d+\s*[xX]\s*\d+\s*(in|inch|inches)?)|((\d+)(?:\.|,)?\d*\s*[xX]\s*(\d+)(?:\.|,)?\d*)/);
    if (m) return normalizeSize(m[0]);
  } catch {}
  return null;
}

function normalizeSize(s) {
  // Normalize to "WxH in"
  const clean = String(s).replace(/\s+/g, '').replace(/in(ch(es)?)?$/i, '');
  const parts = clean.split(/[xX]/);
  if (parts.length !== 2) return null;
  const w = parts[0];
  const h = parts[1];
  if (!w || !h) return null;
  return `${Number(w)}x${Number(h)} in`;
}

