import React, {useEffect} from 'react';
import {useFetcher, Link} from '@remix-run/react';
import {useAside} from '~/components/Aside';
import ProductScene from '~/components/ProductScene.client';
import {AddToCartButton} from '~/components/AddToCartButton';

/**
 * Quick view overlay for products. Displays product details
 * and allows the user to add a single variant to their cart.
 * This component uses Remix fetcher to lazily load the product data
 * when opened and leverages `useAside` to open the cart aside
 * after adding to cart.
 */
export default function ProductQuickView({handle, gid, open, onClose}) {
  const fetcher = useFetcher();
  const {open: openAside} = useAside();

  // When the overlay is opened, fetch product details if we haven't already.
  useEffect(() => {
    if (open && handle && fetcher.state === 'idle' && !fetcher.data) {
      const encoded = encodeURIComponent(handle);
      const gidParam = gid ? `?gid=${encodeURIComponent(gid)}` : '';
      fetcher.load(`/api/product/${encoded}${gidParam}`);
    }
  }, [open, handle]);

  // If the overlay is closed, render nothing.
  if (!open) return null;

  const product = fetcher.data?.product;
  const variant = product?.selectedOrFirstAvailableVariant;

  // Basic styles used by the quick view. These mirror the upstream file.
  const overlayStyle = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 400,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem',
  };
  const panelStyle = {
    width: 'min(1200px, 95vw)', height: 'min(720px, 90vh)', background: '#0d0d0d',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
    overflow: 'hidden', display: 'grid', gridTemplateColumns: '1fr 1.3fr',
  };
  const leftStyle = {padding: '2rem', color: '#fff', overflow: 'auto'};
  const rightStyle = {
    background: '#121212',
    borderLeft: '1px solid rgba(255,255,255,0.06)',
  };
  const titleStyle = {
    margin: 0,
    fontFamily: 'monospace',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
  };
  const subTitleStyle = {
    opacity: 0.7,
    marginTop: '.25rem',
    fontFamily: 'monospace',
    letterSpacing: '0.08em',
  };
  const closeStyle = {
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.2)',
    color: '#fff',
    borderRadius: '8px',
    width: '36px',
    height: '36px',
    cursor: 'pointer',
  };
  const priceRowStyle = {
    display: 'flex',
    gap: '1rem',
    alignItems: 'baseline',
    marginTop: '1rem',
    fontSize: '1.1rem',
    letterSpacing: '0.08em',
  };
  const statGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '0.75rem',
    marginTop: '1rem',
  };
  const statItemStyle = {
    padding: '0.75rem 0.9rem',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px',
    background: 'rgba(255,255,255,0.03)',
  };
  const statLabelStyle = {
    fontSize: '.7rem',
    opacity: 0.6,
    textTransform: 'uppercase',
    letterSpacing: '0.14em',
  };
  const statValueStyle = {
    fontSize: '1rem',
    marginTop: '.25rem',
    fontFamily: 'monospace',
  };
  const descStyle = {
    marginTop: '1.25rem',
    opacity: 0.85,
    lineHeight: 1.6,
    fontSize: '.9rem',
  };
  const detailsBtnStyle = {
    border: '1px solid rgba(255,255,255,0.25)',
    color: '#fff',
    textDecoration: 'none',
    padding: '.75rem 1rem',
    borderRadius: '8px',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    fontSize: '.8rem',
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={panelStyle} onClick={(e) => e.stopPropagation()}>
        {/* Left: details */}
        <div style={leftStyle}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <div>
              <h2 style={titleStyle}>{product?.title || 'Loading…'}</h2>
              <div style={subTitleStyle}>{product?.vendor || ''}</div>
            </div>
            <button onClick={onClose} style={closeStyle}>
              ×
            </button>
          </div>
          {variant && (
            <div style={priceRowStyle}>
              <span>
                {variant.price &&
                  `$${Number(variant.price.amount).toFixed(2)} ${variant.price.currencyCode}`}
              </span>
              {variant.compareAtPrice && (
                <span style={{opacity: 0.6, textDecoration: 'line-through'}}>
                  {`$${Number(variant.compareAtPrice.amount).toFixed(2)} ${variant.compareAtPrice.currencyCode}`}
                </span>
              )}
            </div>
          )}
          <div style={statGridStyle}>
            <Stat label="Width" value={`${product?.featuredImage?.width ?? '—'} px`} />
            <Stat label="Height" value={`${product?.featuredImage?.height ?? '—'} px`} />
            <Stat label="In Stock" value={variant?.availableForSale ? 'Yes' : 'No'} />
            <Stat label="ID" value={product?.id?.split('/')?.pop()?.slice(-6) ?? '—'} />
          </div>
          <div style={descStyle} dangerouslySetInnerHTML={{__html: product?.descriptionHtml || ''}} />
          {variant && (
            <div style={{display: 'flex', gap: '1rem', marginTop: '1rem'}}>
              <AddToCartButton
                lines={[{merchandiseId: variant.id, quantity: 1}]}
                selectedVariant={variant}
                disabled={!variant?.availableForSale}
                onClick={() => openAside('cart')}
              >
                {variant?.availableForSale ? 'Add to Cart' : 'Sold Out'}
              </AddToCartButton>
              {product?.handle && (
                <Link to={`/products/${product.handle}`} style={detailsBtnStyle}>
                  View Details
                </Link>
              )}
            </div>
          )}
        </div>
        {/* Right: 3D preview */}
        <div style={rightStyle}>
          {product?.featuredImage?.url && (
            <div style={{width: '100%', height: '100%'}}>
              <ProductScene textureUrl={product.featuredImage.url} />
            </div>
          )}
          {!product && fetcher.state === 'loading' && (
            <div style={{color: '#ccc', padding: '2rem'}}>Loading…</div>
          )}
          {fetcher.data?.error && (
            <div style={{color: '#f66', padding: '2rem'}}>Error: {String(fetcher.data.error)}</div>
          )}
          {fetcher.status === 404 && <div style={{color: '#f66', padding: '2rem'}}>Not found</div>}
        </div>
      </div>
    </div>
  );

  function Stat({label, value}) {
    return (
      <div style={statItemStyle}>
        <div style={statLabelStyle}>{label}</div>
        <div style={statValueStyle}>{value}</div>
      </div>
    );
  }
}

/**
 * @typedef {{
 *   handle: string;
 *   gid?: string;
 *   open: boolean;
 *   onClose: () => void;
 * }} ProductQuickViewProps
 */