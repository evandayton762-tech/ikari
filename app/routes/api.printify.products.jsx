import {json} from '@shopify/remix-oxygen';
import {listProducts, hasPrintify} from '~/lib/printify.server';

export async function loader({request, context}) {
  const {env} = context;
  if (!hasPrintify(env)) return json({ok: false, error: 'PRINTIFY_API_KEY not set'}, {status: 400});
  const url = new URL(request.url);
  const shopId = url.searchParams.get('shop');
  const page = Number(url.searchParams.get('page') || 1);
  if (!shopId) return json({ok:false, error: 'Missing shop param'}, {status: 400});
  try {
    const data = await listProducts(env, shopId, {page});
    return json({ok: true, data});
  } catch (e) {
    return json({ok: false, error: String(e)}, {status: 500});
  }
}

