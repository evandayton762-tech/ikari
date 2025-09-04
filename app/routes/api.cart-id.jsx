import {json} from '@shopify/remix-oxygen';

export async function loader({request, context}) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return json({ok: false, error: 'Missing id'}, {status: 400});
  const headers = context.cart.setCartId(id);
  return new Response(null, {status: 204, headers});
}

export async function action({request, context}) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let id = null;
    if (contentType.includes('application/json')) {
      const body = await request.json().catch(() => ({}));
      id = body?.id || null;
    } else {
      const form = await request.formData();
      id = form.get('id');
    }
    if (!id) return json({ok: false, error: 'Missing id'}, {status: 400});
    const headers = context.cart.setCartId(id);
    return json({ok: true}, {status: 200, headers});
  } catch (e) {
    return json({ok: false, error: String(e)}, {status: 500});
  }
}

