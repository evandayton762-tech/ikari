import {redirect} from '@shopify/remix-oxygen';

/**
 * Applies a discount to a cart in one of two ways:
 *  - If a cart doesn't exist the discount is added to a new cart
 *  - If a cart exists it's updated with the discount, otherwise a cart is created with the discount already applied
 * @param {LoaderFunctionArgs}
 */
export async function loader({request, context, params}) {
  const {cart} = context;
  const code = params.code;

  if (!code) throw new Error('Missing discount code');

  if (!cart.get()) {
    // There's no existing cart, so create one with a discount code applied
    const result = await cart.create();
    const headers = cart.setCartId(result.cart.id);
    return redirect(`/?discount=${code}`, {headers});
  }

  // Update cart with discount code
  const result = await cart.updateDiscountCodes([code]);
  const headers = cart.setCartId(result.cart.id);

  // If there is no cart id and a new cart id is created in the progress, it will not be set in the cookie
  if (result.cart.checkoutUrl) {
    const url = new URL(result.cart.checkoutUrl);
    url.searchParams.set('discount', code);
    return redirect(url.toString(), {headers});
  }

  return redirect('/', {headers});
}

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */

