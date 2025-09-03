// app/root.jsx
import React from 'react';
import {Links, Meta, Outlet, Scripts, ScrollRestoration, Await, useLoaderData, useAsyncValue, useLocation, Link} from '@remix-run/react';
import {defer} from '@shopify/remix-oxygen';
import {Aside, useAside} from '~/components/Aside';
import Nav from '~/components/Nav';
const CartRevalidator = React.lazy(() => import('~/components/CartRevalidator.client'));
const GlobalParticles = React.lazy(() => import('~/components/GlobalParticles.client'));
import {CartMain} from '~/components/CartMain';
import {useOptimisticCart} from '@shopify/hydrogen';
import {SEARCH_ENDPOINT, SearchFormPredictive} from '~/components/SearchFormPredictive';
import {SearchResultsPredictive} from '~/components/SearchResultsPredictive';

import resetUrl from '~/styles/reset.css?url';
import appUrl from '~/styles/app.css?url';
import favicon from '~/assets/favicon.svg';

export const links = () => [
  {rel: 'preconnect', href: 'https://cdn.shopify.com'},
  {rel: 'stylesheet', href: resetUrl},
  {rel: 'stylesheet', href: appUrl},
  {rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css'},
  {rel: 'icon', type: 'image/svg+xml', href: favicon},
];

export async function loader({context}) {
  const {storefront, cart, env} = context;
  const header = storefront.query(
    `#graphql
      fragment Shop on Shop { id name description primaryDomain { url } brand { logo { image { url } } } }
      fragment MenuItem on MenuItem { id resourceId tags title type url }
      fragment ChildMenuItem on MenuItem { ...MenuItem }
      fragment ParentMenuItem on MenuItem { ...MenuItem items { ...ChildMenuItem } }
      fragment Menu on Menu { id items { ...ParentMenuItem } }
      query Header($headerMenuHandle: String!) { shop { ...Shop } menu(handle: $headerMenuHandle) { ...Menu } }
    `,
    {variables: {headerMenuHandle: 'main-menu'}},
  );
  const footer = storefront.query(
    `#graphql
      fragment MenuItem on MenuItem { id resourceId tags title type url }
      fragment ChildMenuItem on MenuItem { ...MenuItem }
      fragment ParentMenuItem on MenuItem { ...MenuItem items { ...ChildMenuItem } }
      fragment Menu on Menu { id items { ...ParentMenuItem } }
      query Footer($footerMenuHandle: String!) { menu(handle: $footerMenuHandle) { ...Menu } }
    `,
    {variables: {footerMenuHandle: 'footer'}},
  );
  const cartPromise = cart.get();
  const isLoggedIn = Promise.resolve(false);
  return defer({header, footer, cart: cartPromise, isLoggedIn, publicStoreDomain: env.PUBLIC_STORE_DOMAIN});
}

function CartAside({cart}) {
  return (
    <Aside type="cart" heading="CART">
      <React.Suspense fallback={<p>Loading cart ...</p>}>
        <Await resolve={cart}>
          {(data) => <CartMain cart={data} layout="aside" />}
        </Await>
      </React.Suspense>
    </Aside>
  );
}

function CartButton({cart}) {
  // Small floating button; count updates optimistically
  return (
    <div style={{position: 'fixed', top: '1rem', right: '1rem', zIndex: 300}}>
      <React.Suspense fallback={<CartButtonInner count={null} /> }>
        <Await resolve={cart}>
          <CartCountResolved />
        </Await>
      </React.Suspense>
    </div>
  );
}

function CartButtonInner({count}) {
  const {open} = useAside();
  return (
    <button
      onClick={() => open('cart')}
      style={{
        background: 'rgba(0,0,0,0.7)',
        color: '#fff',
        border: '1px solid rgba(255,255,255,0.3)',
        padding: '0.5rem 0.75rem',
        fontFamily: 'monospace',
        fontSize: '0.75rem',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        cursor: 'pointer',
      }}
    >
      Cart {count ?? ''}
    </button>
  );
}

function CartCountResolved() {
  const originalCart = useAsyncValue();
  const optimistic = useOptimisticCart(originalCart);
  return <CartButtonInner count={optimistic?.totalQuantity ?? 0} />;
}

export default function App() {
  const data = useLoaderData();
  const location = useLocation();
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
        <style dangerouslySetInnerHTML={{__html: `
          body { margin: 0; padding: 0; background: #000; color: #fff; font-family: system-ui, -apple-system, sans-serif; }
          * { box-sizing: border-box; }
        `}} />
      </head>
      <body>
        <Aside.Provider>
          <AppShell data={data} location={location} />
        </Aside.Provider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

function AppShell({data, location}) {
  const asideState = useAside();
  return (
    <>
      {/* Global top-center navigation on all pages */}
      <React.Suspense fallback={null}>
        {location?.pathname !== '/' && <GlobalParticles />}
      </React.Suspense>
      <Nav
        color={location?.pathname === '/' ? '#000' : '#fff'}
        invertLogo={location?.pathname !== '/'}
      />
      {/* Hide fixed buttons when an aside is open to avoid overlaying the X close */}
      {asideState?.type === 'closed' && <SearchButton />}
      <React.Suspense fallback={null}>
        <CartRevalidator />
      </React.Suspense>
      <SearchAside />
      {asideState?.type === 'closed' && <CartButton cart={data.cart} />}
      {location?.pathname?.endsWith('/cart') ? null : (
        <CartAside cart={data.cart} />
      )}
      <Outlet />
    </>
  );
}

function SearchButton() {
  const {open} = useAside();
  return (
    <button
      aria-label="Search"
      onClick={() => open('search')}
      style={{
        position: 'fixed',
        top: '1rem',
        right: '6.5rem',
        zIndex: 300,
        background: 'rgba(0,0,0,0.7)',
        color: '#fff',
        border: '1px solid rgba(255,255,255,0.3)',
        padding: '0.45rem 0.55rem',
        borderRadius: 6,
        cursor: 'pointer',
        transition: 'all .2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = '#ff4d00';
        e.currentTarget.style.color = '#000';
        e.currentTarget.style.border = '1px solid #ff864d';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(0,0,0,0.7)';
        e.currentTarget.style.color = '#fff';
        e.currentTarget.style.border = '1px solid rgba(255,255,255,0.3)';
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
    </button>
  );
}

function SearchAside() {
  const queriesDatalistId = React.useId();
  return (
    <Aside type="search" heading="SEARCH">
      <div className="predictive-search" style={{color:'#111'}}>
        <br />
        <SearchFormPredictive>
          {({fetchResults, goToSearch, inputRef}) => (
            <>
              <div style={{position:'relative', width:'100%'}}>
                <input
                  name="q"
                  onChange={fetchResults}
                  onFocus={fetchResults}
                  placeholder="Search for anything"
                  ref={inputRef}
                  type="search"
                  list={queriesDatalistId}
                  style={{
                    width:'100%',
                    padding:'0.75rem 2.4rem 0.75rem 0.9rem',
                    border:'1px solid #ddd',
                    borderRadius:10,
                    boxShadow:'0 6px 18px rgba(0,0,0,0.06)',
                    outline:'none',
                    background:'#fff',
                    color:'#111',
                  }}
                />
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={{position:'absolute', right:'.75rem', top:'50%', transform:'translateY(-50%)'}}>
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </div>
              <div style={{marginTop:'.6rem'}}>
                <button onClick={goToSearch} style={{
                  padding:'0.6rem 0.9rem',
                  borderRadius:8,
                  border:'1px solid #ff864d',
                  background:'#ff4d00',
                  color:'#000',
                  letterSpacing:'.08em',
                  textTransform:'uppercase',
                  cursor:'pointer'
                }}>Search</button>
              </div>
            </>
          )}
        </SearchFormPredictive>

        <SearchResultsPredictive>
          {({items, total, term, state, closeSearch}) => {
            const {articles, collections, pages, products, queries} = items;
            if (state === 'loading' && term.current) return <div>Loading…</div>;
            if (!total) return <div style={{opacity:.7, marginTop:'1rem'}}>Try another term.</div>;
            return (
              <>
                <SearchResultsPredictive.Queries queries={queries} queriesDatalistId={queriesDatalistId} />
                <SearchResultsPredictive.Products products={products} closeSearch={closeSearch} term={term} />
                <SearchResultsPredictive.Collections collections={collections} closeSearch={closeSearch} term={term} />
                <SearchResultsPredictive.Pages pages={pages} closeSearch={closeSearch} term={term} />
                <SearchResultsPredictive.Articles articles={articles} closeSearch={closeSearch} term={term} />
                {term.current && total ? (
                  <Link onClick={closeSearch} to={`${SEARCH_ENDPOINT}?q=${term.current}`}>View all results for <q>{term.current}</q> →</Link>
                ) : null}
              </>
            );
          }}
        </SearchResultsPredictive>
      </div>
    </Aside>
  );
}
