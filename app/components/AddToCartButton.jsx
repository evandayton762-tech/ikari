import React from 'react';
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
  return (
    <DirectAddButton
      className={className}
      style={style}
      disabled={disabled}
      lines={lines}
      imageSrc={imageSrc}
      onClick={onClick}
    >
      {children}
    </DirectAddButton>
  );
}

function DirectAddButton({children, className, style, disabled, onClick, lines, imageSrc}) {
  const {open} = useAside();
  const [loading, setLoading] = React.useState(false);

  return (
    <button
      type="button"
      onClick={async (e) => {
        try { if (typeof onClick === 'function') onClick(e); } catch {}
        try { flyToCart(e.currentTarget, imageSrc); } catch {}
        if (disabled || loading) return;
        setLoading(true);
        try {
          const href = buildCartLinesHref(lines, true);
          if (!href) return;
          const res = await fetch(`${href}?silent=1`, {method: 'GET', credentials: 'include'});
          const j = await res.json().catch(() => null);
          let latest = j?.cart || null;
          // Fetch full cart (with lines) to ensure aside renders items
          try {
            const r2 = await fetch('/api/cart', {credentials: 'include'});
            const j2 = await r2.json().catch(() => null);
            if (j2?.cart) latest = j2.cart;
          } catch {}
          if (latest) {
            if (typeof window !== 'undefined') {
              window.__lastCart = latest;
              window.dispatchEvent(new CustomEvent('cart:updated', {detail: latest}));
            }
            open('cart');
          } else {
            // fallback hard navigate
            window.location.href = href;
          }
        } finally {
          setLoading(false);
        }
      }}
      disabled={disabled ?? loading}
      className={className}
      style={style}
    >
      {loading ? 'Adding…' : children}
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

function buildCartLinesHref(lines, includeQty=false) {
  try {
    if (!Array.isArray(lines) || lines.length === 0) return null;
    const parts = lines.map((l) => {
      const id = l?.merchandiseId || l?.variantId || '';
      const numeric = String(id).split('/').pop();
      const qty = Math.max(1, Number(l?.quantity || 1));
      if (!numeric || isNaN(Number(numeric))) return null;
      return includeQty ? `${numeric}:${qty}` : numeric;
    });
    if (parts.some((p) => !p)) return null;
    return `/cart/${parts.join(',')}`;
  } catch {
    return null;
  }
}

/**
 * Type definitions for Hydrogen and Remix types used above.
 * These imports are only for type‑checking and have no runtime effect.
 */
/** @typedef {import('@remix-run/react').FetcherWithComponents} FetcherWithComponents */
/** @typedef {import('@shopify/hydrogen').OptimisticCartLineInput} OptimisticCartLineInput */
