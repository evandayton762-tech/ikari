/**
 * Minimal server helpers to query Printify. These are optional and only
 * used for diagnostics or to enrich UI; checkout still goes through Shopify.
 *
 * Set PRINTIFY_API_KEY and (optionally) PRINTIFY_SHOP_ID in .env.
 */

export function hasPrintify(env) {
  return Boolean(env?.PRINTIFY_API_KEY);
}

function headers(env) {
  if (!env?.PRINTIFY_API_KEY) throw new Error('PRINTIFY_API_KEY is not set');
  return {
    Authorization: `Bearer ${env.PRINTIFY_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

async function api(path, {env, method = 'GET', body} = {}) {
  const res = await fetch(`https://api.printify.com/v1${path}`, {
    method,
    headers: headers(env),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Printify ${method} ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}

export async function listShops(env) {
  return api('/shops.json', {env});
}

export async function listProducts(env, shopId, {page = 1} = {}) {
  if (!shopId) throw new Error('shopId is required');
  return api(`/shops/${shopId}/products.json?page=${page}`, {env});
}

export async function getProduct(env, shopId, productId) {
  if (!shopId || !productId) throw new Error('shopId and productId are required');
  return api(`/shops/${shopId}/products/${productId}.json`, {env});
}

export const Printify = {hasPrintify, listShops, listProducts, getProduct};

