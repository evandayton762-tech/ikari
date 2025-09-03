import {CartForm} from '@shopify/hydrogen';
// No navigation side-effects here; CartRevalidator handles revalidation.

/**
 * @param {{
 *   analytics?: unknown;
 *   children: React.ReactNode;
 *   disabled?: boolean;
 *   lines: Array<OptimisticCartLineInput>;
 *   onClick?: () => void;
 *   className?: string;
 *   style?: React.CSSProperties;
 *   redirectTo?: string;
 * }}
 */
export function AddToCartButton({
  analytics,
  children,
  disabled,
  lines,
  onClick,
  className,
  style,
  redirectTo,
}) {
  return (
    <CartForm route="/cart" inputs={{lines}} action={CartForm.ACTIONS.LinesAdd}>
      {(fetcher) => (
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
            onClick={onClick}
            disabled={disabled ?? fetcher.state !== 'idle'}
            className={className}
            style={style}
          >
            {fetcher.state !== 'idle' ? 'Adding…' : children}
          </button>
          {/* Dev-only error surface to help diagnose why nothing happens */}
          {fetcher.state === 'idle' && fetcher.data?.errors?.length ? (
            <div style={{color:'#f66', fontSize:12, marginTop:6}}>
              {Array.isArray(fetcher.data.errors)
                ? fetcher.data.errors.join(', ')
                : String(fetcher.data.errors)}
            </div>
          ) : null}
        </>
      )}
    </CartForm>
  );
}

/** @typedef {import('@remix-run/react').FetcherWithComponents} FetcherWithComponents */
/** @typedef {import('@shopify/hydrogen').OptimisticCartLineInput} OptimisticCartLineInput */
