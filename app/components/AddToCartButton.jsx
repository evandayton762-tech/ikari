import {CartForm} from '@shopify/hydrogen';
// No navigation side‑effects here; CartRevalidator handles revalidation.


export function AddToCartButton({
  analytics,
  children,
  disabled,
  lines,
  onClick,
  className,
  selectedVariant,
  style,
  redirectTo,
}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.LinesAdd}
      inputs={{lines, selectedVariant}}
    >
      {(fetcher) => {
        // Debug logging (only on state changes)
        if (typeof window !== 'undefined' && fetcher.state !== 'idle') {
          console.log('[AddToCartButton] State:', {
            state: fetcher.state,
            data: fetcher.data,
            lines,
            timestamp: new Date().toISOString(),
          });
        }
        return (
          <>
            <input
              name="analytics"
              type="hidden"
              value={JSON.stringify(analytics)}
            />
            {redirectTo ? (
              <input name="redirectTo" type="hidden" value={redirectTo} />
            ) : null}
            <button
              type="submit"
              onClick={(e) => {
                console.log('[AddToCartButton] Click:', {lines, disabled});
                if (onClick) onClick(e);
              }}
              disabled={disabled ?? fetcher.state !== 'idle'}
              className={className}
              style={style}
            >
              {fetcher.state !== 'idle' ? 'Adding…' : children}
            </button>
            {/* Debug state display */}
            {process.env.NODE_ENV === 'development' && (
              <div style={{fontSize: 10, color: '#888', marginTop: 4}}>
                State: {fetcher.state} | Data: {fetcher.data ? 'yes' : 'no'}
              </div>
            )}
            {/* Dev‑only error surface to help diagnose why nothing happens */}
            {fetcher.state === 'idle' && fetcher.data?.errors?.length ? (
              <div style={{color: '#f66', fontSize: 12, marginTop: 6}}>
                Error: {Array.isArray(fetcher.data.errors)
                  ? fetcher.data.errors.join(', ')
                  : String(fetcher.data.errors)}
              </div>
            ) : null}
          </>
        );
      }}
    </CartForm>
  );
}

/**
 * Type definitions for Hydrogen and Remix types used above.
 * These imports are only for type‑checking and have no runtime effect.
 */
/** @typedef {import('@remix-run/react').FetcherWithComponents} FetcherWithComponents */
/** @typedef {import('@shopify/hydrogen').OptimisticCartLineInput} OptimisticCartLineInput */