import {json} from '@shopify/remix-oxygen';

export async function loader({context}) {
  const {cart} = context;
  try {
    const result = await cart.get();
    const headers = new Headers();
    if (result?.id) {
      try {
        const setHeaders = cart.setCartId(result.id);
        const setCookie = setHeaders.get('Set-Cookie');
        if (setCookie) headers.append('Set-Cookie', setCookie);
      } catch {}
    }
    return json({ok: true, cart: result ?? null}, {headers});
  } catch (e) {
    return json({ok: false, error: String(e)}, {status: 500});
  }
}

