import {redirect} from '@shopify/remix-oxygen';

/**
 * Automatically creates a new cart based on the URL and redirects straight to checkout.
 *
 * URL structure: /cart/<variant_id>:<quantity>[,<variant_id>:<quantity>][?discount=<discount_code>]
 *
 * Create a URL using the variant ID and quantity. You can use the ID of a product variant, and add
 * more than one product variant to a cart using a comma as a separator. You can also add a discount
 * code using a URL query string. When using more than one discount code, separate them with commas
 * in the query string.
 *
 * Example path creating a cart with two product variants, different quantities, and a discount code in the querystring:
 * /cart/41007289663544:1,41007289696312:2?discount=HYDROBOARD
 */
export async function loader({params, context, request}) {
  const {cart} = context;

  // Split the lines into variant ids with quantities
  const lines = params.lines?.split(',').map((line) => {
    const [variantId, quantity] = line.split(':');
    return {
      merchandiseId: `gid://shopify/ProductVariant/${variantId}`,
      quantity: Number(quantity ?? 1),
    };
  });

  if (!lines) return redirect('/cart');

  const url = new URL(request.url);
  const discountCodes = url.searchParams
    .get('discount')
    ?.split(',')
    ?.filter(Boolean);

  // create a cart
  const result = await cart.create({
    lines,
    discountCodes,
  });

  const cartResult = result.cart;

  if (result.errors?.length || !cartResult) {
    throw new Error(
      result.errors?.map((e) => e.message).join(', ') || 'Could not create cart',
    );
  }

  // Update cart id in cookie
  const headers = cart.setCartId(cartResult.id);

  // On success go to checkout url.
  // Redirect to the cart page so the user can review items
  return redirect('/cart', {headers});
}
