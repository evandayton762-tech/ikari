import {createHydrogenContext} from '@shopify/hydrogen';
import {AppSession} from '~/lib/session';
import {CART_QUERY_FRAGMENT} from '~/lib/fragments';
import {getLocaleFromRequest} from '~/lib/i18n';

/**
 * The context implementation is separate from server.ts
 * so that type can be extracted for AppLoadContext
 * @param {Request} request
 * @param {Env} env
 * @param {ExecutionContext} executionContext
 */
export async function createAppLoadContext(request, env, executionContext) {
  /**
   * Open a cache instance in the worker and a custom session instance.
   */
  if (!env?.SESSION_SECRET) {
    throw new Error('SESSION_SECRET environment variable is not set');
  }

  const waitUntil = executionContext.waitUntil.bind(executionContext);
  const [cache, session] = await Promise.all([
    caches.open('hydrogen'),
    AppSession.init(request, [env.SESSION_SECRET]),
  ]);

  const hydrogenContext = createHydrogenContext({
    env,
    request,
    cache,
    waitUntil,
    session,
    i18n: getLocaleFromRequest(request),
    cart: {
      queryFragment: CART_QUERY_FRAGMENT,
      // Ensure cart cookie works in local HTTP dev: disable secure flag
      cookie: {secure: false, sameSite: 'Lax', path: '/'},
    },
  });

  // Wrap cart id storage to also persist in our session for resilience in dev
  const originalCart = hydrogenContext.cart;
  const wrappedCart = {
    ...originalCart,
    getCartId: () => session.get('cartId') || originalCart.getCartId(),
    setCartId: (id) => {
      try {
        session.set('cartId', id);
      } catch {}
      return originalCart.setCartId(id);
    },
  };

  return {
    ...hydrogenContext,
    cart: wrappedCart,
    // declare additional Remix loader context
  };
}
