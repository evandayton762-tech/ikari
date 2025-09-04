import {json} from '@shopify/remix-oxygen';
import {listShops, hasPrintify} from '~/lib/printify.server';

export async function loader({context}) {
  const {env} = context;
  if (!hasPrintify(env)) return json({ok: false, error: 'PRINTIFY_API_KEY not set'}, {status: 400});
  try {
    const data = await listShops(env);
    return json({ok: true, data});
  } catch (e) {
    return json({ok: false, error: String(e)}, {status: 500});
  }
}

