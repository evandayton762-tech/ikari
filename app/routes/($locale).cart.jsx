import React from 'react';
import {useLoaderData, Link, useNavigate} from '@remix-run/react';
import {CartForm, Money} from '@shopify/hydrogen';
import {data} from '@shopify/remix-oxygen';
import {CartLineItem} from '~/components/CartLineItem';
import {redirect} from '@shopify/remix-oxygen';

export const meta = () => {
  return [{title: `Hydrogen | Cart`}];
};

export const headers = ({actionHeaders, loaderHeaders}) => {
  const headers = new Headers();
  // Preserve any Set-Cookie from loader (cart/session) and action (cart mutations)
  if (loaderHeaders) {
    const setCookie = loaderHeaders.get('Set-Cookie');
    if (setCookie) headers.append('Set-Cookie', setCookie);
    const cache = loaderHeaders.get('Cache-Control');
    if (cache) headers.set('Cache-Control', cache);
  }
  if (actionHeaders) {
    const setCookie = actionHeaders.get('Set-Cookie');
    if (setCookie) headers.append('Set-Cookie', setCookie);
  }
  return headers;
};

export async function action({request, context}) {
  const {cart, env} = context;
  const debug = Boolean(env?.DEBUG_CART);

  const formData = await request.formData();
  let status = 200;
  let result;

  try {
    const {action, inputs} = CartForm.getFormInput(formData);
    

    if (!action) {
      throw new Error('No action provided');
    }

    switch (action) {
      case CartForm.ACTIONS.LinesAdd: {
        // Try to add to an existing cart; if none exists, create one with lines
        result = await cart.addLines(inputs.lines).catch(() => null);
        if (!result?.cart?.id) {
          result = await cart.create({lines: inputs.lines});
        }
        break;
      }
      case CartForm.ACTIONS.LinesUpdate: {
        result = await cart.updateLines(inputs.lines);
        break;
      }
      case CartForm.ACTIONS.LinesRemove: {
        result = await cart.removeLines(inputs.lineIds);
        break;
      }
      case CartForm.ACTIONS.DiscountCodesUpdate: {
        const formDiscountCode = inputs.discountCode;
        const discountCodes = formDiscountCode ? [formDiscountCode] : [];
        discountCodes.push(...(inputs.discountCodes ?? []));
        result = await cart.updateDiscountCodes(discountCodes);
        break;
      }
      case CartForm.ACTIONS.GiftCardCodesUpdate: {
        const formGiftCardCode = inputs.giftCardCode;
        const giftCardCodes = formGiftCardCode ? [formGiftCardCode] : [];
        giftCardCodes.push(...(inputs.giftCardCodes ?? []));
        result = await cart.updateGiftCardCodes(giftCardCodes);
        break;
      }
      case CartForm.ACTIONS.BuyerIdentityUpdate: {
        result = await cart.updateBuyerIdentity({
          ...inputs.buyerIdentity,
        });
        break;
      }
      default:
        throw new Error(`${action} cart action is not defined`);
    }
  } catch (error) {
    console.error(error);
    return data(
      {
        cart: null,
        errors: [error.message],
        warnings: [],
        analytics: {
          cartId: null,
        },
      },
      {status: 400},
    );
  }

  const cartId = result?.cart?.id;
  const headers = cartId ? cart.setCartId(result.cart.id) : new Headers();

  // NOTE: Prefer the mutation payload's cart to avoid read-after-write delay.
  // Avoid immediately querying cart.get() which can briefly return a stale cart.

  // If the Storefront API responded with errors, mark as bad request for fetcher state handling
  const {errors = [], warnings = []} = result ?? {};
  const cartResult = result?.cart || null;
  if (errors?.length) status = 400;

  const redirectTo = formData.get('redirectTo') ?? null;
  if (typeof redirectTo === 'string') {
    status = 303;
    headers.set('Location', redirectTo);
  }

  return data(
    {
      cart: cartResult,
      errors,
      warnings,
      analytics: {
        cartId,
      },
    },
    {status, headers},
  );
}

export async function loader({context, request}) {
  // Redirect all direct visits to /cart to the homepage with cart aside open
  const url = new URL(request.url);
  const shouldRedirect = url.searchParams.get('allow') !== '1';
  if (shouldRedirect) {
    url.pathname = '/';
    url.searchParams.set('cart', 'open');
    return redirect(url.toString());
  }

  const {cart} = context;
  const headers = new Headers();
  try {
    const result = await cart.get();
    if (result?.id) {
      try {
        const setHeaders = context.cart.setCartId(result.id);
        const setCookie = setHeaders.get('Set-Cookie');
        if (setCookie) headers.append('Set-Cookie', setCookie);
      } catch {}
    }
    return data(result ?? null, {headers});
  } catch (e) {
    console.error('Cart loader error:', e);
    return data(null, {headers});
  }
}

export default function Cart() {
  const loaderCart = useLoaderData();
  const [clientCart, setClientCart] = React.useState(null);
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.__lastCart) setClientCart(window.__lastCart);
    const onUpdate = (e) => setClientCart(e.detail || null);
    window.addEventListener('cart:updated', onUpdate);
    return () => window.removeEventListener('cart:updated', onUpdate);
  }, []);

  const cart = clientCart || loaderCart;
  const lines = cart?.lines?.nodes ?? [];
  const hasItems = !!cart?.totalQuantity;
  const existingCodes = cart?.discountCodes?.filter((c) => c.applicable).map((c) => c.code) ?? [];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#000',
        color: '#fff',
        padding: '5rem 2rem 4rem',
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
        backgroundSize: '30px 30px',
      }}
    >
      <div style={{maxWidth: 1200, margin: '0 auto'}}>
        <Link to="/shop" style={{textDecoration: 'none', color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace', letterSpacing: '.1em'}}>← BACK</Link>
        <h1 style={{margin: '0.75rem 0 0.25rem', letterSpacing: '.12em', fontSize: '2rem'}}>YOUR CART</h1>
        <div style={{opacity: 0.5, fontFamily: 'monospace', letterSpacing: '.15em', fontSize: '.75rem'}}>
          IKARI — “OBJECTS FOR LIVING”
        </div>

        <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginTop: '2rem'}}>
          {/* Left: lines + coupon */}
          <div style={{background: '#0b0b0b', borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 20px 50px rgba(0,0,0,0.4)'}}>
            {!hasItems ? (
              <div style={{padding: '2rem', color:'rgba(255,255,255,0.85)'}}>
                <p>Looks like you haven’t added anything yet, let’s get you started!</p>
                <br />
                <Link to="/shop" style={{color:'#ff4d00', textDecoration:'none'}}>Continue shopping →</Link>
              </div>
            ) : (
              <div>
                <ul style={{listStyle: 'none', margin: 0, padding: 0}}>
                  {lines.map((line, i) => (
                    <li key={line.id} style={{position:'relative', padding: '1.25rem 1.5rem', borderBottom: i < lines.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none'}}>
                      <div style={{position:'absolute', left: 12, top: 12, fontFamily:'monospace', fontSize:'.7rem', letterSpacing:'.14em', opacity:.4}}>
                        {String(i+1).padStart(2,'0')}
                      </div>
                      <CartLineItem line={line} layout="page" />
                    </li>
                  ))}
                </ul>

                {/* Coupon row */}
                <div style={{padding: '1.25rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.08)'}}>
                  <div style={{fontFamily:'monospace', textTransform:'uppercase', letterSpacing:'.16em', fontSize:'.75rem', opacity:.6, marginBottom:'.5rem'}}>
                    “COUPON CODE”
                  </div>
                  <CartForm
                    route="/cart"
                    action={CartForm.ACTIONS.DiscountCodesUpdate}
                    inputs={{discountCodes: existingCodes}}
                  >
                    <div style={{display:'flex', gap:'.75rem', alignItems:'center'}}>
                      <input
                        name="discountCode"
                        placeholder="ENTER CODE"
                        style={{
                          flex: 1,
                          padding: '0.7rem 0.85rem',
                          borderRadius: 10,
                          border: '1px solid rgba(255,255,255,0.16)',
                          background:'#0f0f0f',
                          color:'#fff'
                        }}
                      />
                      <button type="submit" style={{
                        padding: '0.7rem 1rem',
                        borderRadius: 10,
                        border: '1px solid #ff864d',
                        background: '#ff4d00',
                        color: '#000',
                        letterSpacing: '.12em',
                        textTransform: 'uppercase'
                      }}>Apply</button>
                    </div>
                  </CartForm>
                </div>
                <div style={{padding: '0 1.25rem 1.25rem'}}>
                  <Link to="/shop" style={{color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontFamily:'monospace', letterSpacing:'.14em'}}>⟵ CONTINUE SHOPPING</Link>
                </div>
              </div>
            )}
          </div>

          {/* Right: totals + checkout */}
          <div style={{background: '#0b0b0b', borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)', padding: '1.25rem', boxShadow:'0 20px 50px rgba(0,0,0,0.4)'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
              <h3 style={{margin: 0, letterSpacing: '.16em'}}>CART TOTALS</h3>
              <div style={{fontFamily:'monospace', opacity:.5, letterSpacing:'.12em'}}>“IKARI”</div>
            </div>
            <div style={{borderTop: '1px solid rgba(255,255,255,0.08)', margin: '0.75rem 0 1rem'}} />
            {hasItems ? (
              <div>
                <Row label="Subtotal">
                  <Money data={cart?.cost?.subtotalAmount} />
                </Row>
                <Row label="Shipping (est.)">Calculated at checkout</Row>
                <Row label="Taxes (est.)">Calculated at checkout</Row>
                <div style={{borderTop:'1px solid rgba(255,255,255,0.08)', margin:'0.75rem 0 0.75rem'}} />
                <Row label={<strong>Total</strong>}>
                  <strong><Money data={cart?.cost?.totalAmount} /></strong>
                </Row>
                <a
                  href={cart?.checkoutUrl || '#'}
                  style={{
                    display:'block',
                    marginTop:'1rem',
                    width:'100%',
                    textAlign:'center',
                    padding:'0.9rem 1rem',
                    background:'#ff4d00',
                    color:'#000',
                    textDecoration:'none',
                    borderRadius:12,
                    border:'1px solid #ff864d',
                    letterSpacing:'.14em',
                    textTransform:'uppercase'
                  }}
                >
                  Proceed to Checkout →
                </a>
              </div>
            ) : (
              <p>Your cart is empty.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({label, children}) {
  return (
    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding: '.35rem 0'}}>
      <div style={{opacity:.75}}>{label}</div>
      <div style={{opacity:1}}>{children}</div>
    </div>
  );
}
