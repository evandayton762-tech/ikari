import React from 'react';
import {CartForm} from '@shopify/hydrogen';
import {useAside} from '~/components/Aside';
// Minimal, robust add-to-cart. If possible, use the direct /cart/$lines route
// to avoid any client/runtime issues.


export function AddToCartButton({
  analytics,
  children,
  disabled,
  lines,
  onClick,
  className,
  style,
  redirectTo,
  imageSrc,
}) {
  // Always use CartForm so we can stay on page and open the aside.
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.LinesAdd}
      inputs={{lines}}
    >
      {(fetcher) => (
        <SubmitButton
          fetcher={fetcher}
          className={className}
          style={style}
          disabled={disabled}
          onClick={(e) => {
            try { if (typeof onClick === 'function') onClick(e); } catch {}
            try { flyToCart(e.currentTarget, imageSrc); } catch {}
          }}
        >
          {children}
        </SubmitButton>
      )}
    </CartForm>
  );
}

function SubmitButton({fetcher, children, className, style, disabled, onClick}) {
  const {open} = useAside();
  const openedRef = React.useRef(false);

  // Open aside when the add completes successfully
  React.useEffect(() => {
    if (!fetcher) return;
    const done = fetcher.state === 'idle' && fetcher.data && fetcher.data.cart;
    if (done && !openedRef.current) {
      openedRef.current = true;
      try {
        // Persist latest cart for any listeners (CartMain override)
        if (typeof window !== 'undefined') {
          window.__lastCart = fetcher.data.cart;
          window.dispatchEvent(new CustomEvent('cart:updated', {detail: fetcher.data.cart}));
        }
      } catch {}
      open('cart');
      // reset flag after a tick so subsequent adds can re-open
      setTimeout(() => {
        openedRef.current = false;
      }, 100);
    }
  }, [fetcher?.state, fetcher?.data]);

  const isSubmitting = fetcher?.state !== 'idle';

  return (
    <button
      type="submit"
      onClick={onClick}
      disabled={disabled ?? isSubmitting}
      className={className}
      style={style}
    >
      {isSubmitting ? 'Adding…' : children}
    </button>
  );
}

function flyToCart(sourceEl, imageSrc) {
  if (!sourceEl) return;
  const target = document.querySelector('.cart-fly-target');
  if (!target) return;
  const start = sourceEl.getBoundingClientRect();
  const end = target.getBoundingClientRect();

  const img = document.createElement('img');
  img.src = imageSrc || (sourceEl.querySelector('img')?.src || '');
  img.className = 'fly-img';
  img.style.position = 'fixed';
  img.style.left = `${start.left + start.width / 2 - 20}px`;
  img.style.top = `${start.top + start.height / 2 - 20}px`;
  img.style.width = '40px';
  img.style.height = '40px';
  img.style.objectFit = 'cover';
  img.style.borderRadius = '8px';
  img.style.zIndex = 9999;
  img.style.transition = 'transform .6s cubic-bezier(.2,.8,.2,1), opacity .6s';
  document.body.appendChild(img);

  const dx = end.left + end.width / 2 - (start.left + start.width / 2);
  const dy = end.top + end.height / 2 - (start.top + start.height / 2);
  requestAnimationFrame(() => {
    img.style.transform = `translate(${dx}px, ${dy}px) scale(.3)`;
    img.style.opacity = '0.2';
  });
  setTimeout(() => {
    img.remove();
  }, 700);
}

/**
 * Type definitions for Hydrogen and Remix types used above.
 * These imports are only for type‑checking and have no runtime effect.
 */
/** @typedef {import('@remix-run/react').FetcherWithComponents} FetcherWithComponents */
/** @typedef {import('@shopify/hydrogen').OptimisticCartLineInput} OptimisticCartLineInput */
