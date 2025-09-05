import React from 'react';
import {useFetchers} from '@remix-run/react';

// Watch cart fetchers and push latest cart payload into a global override.
// UI components (CartMain) listen for 'cart:updated' to sync preview quickly.
export default function CartRevalidator() {
  const fetchers = useFetchers();

  // On mount, hydrate client cart from server cookie
  React.useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/cart', {credentials: 'include'});
        const j = await r.json();
        if (j?.cart) {
          window.__lastCart = j.cart;
          window.dispatchEvent(new CustomEvent('cart:updated', {detail: j.cart}));
        }
      } catch {}
    })();
  }, []);

  React.useEffect(() => {
    for (const f of fetchers) {
      const isCartAction = typeof f?.formAction === 'string' && /\/cart(\?.*)?$/.test(f.formAction);
      if (!isCartAction) continue;
      const done = f.state === 'idle' && f.data && f.data.cart;
      if (done && typeof window !== 'undefined') {
        try {
          window.__lastCart = f.data.cart;
          window.dispatchEvent(new CustomEvent('cart:updated', {detail: f.data.cart}));
          // Ensure server cookie is synced even if the browser ignored Set-Cookie
          const id = f.data.cart?.id;
          if (id && window.__lastCartIdSynced !== id) {
            window.__lastCartIdSynced = id;
            // Fire-and-forget GET to persist id in cookie on the server
            fetch(`/api/cart-id?id=${encodeURIComponent(id)}`, {method: 'GET', keepalive: true}).catch(() => {});
          }
        } catch {}
      }
    }
  }, [fetchers]);

  return null;
}
