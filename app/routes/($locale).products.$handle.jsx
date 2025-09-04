import React, {Suspense, lazy, useEffect, useMemo, useState} from 'react';
import {useLoaderData, useNavigate, Link} from '@remix-run/react';
import {
  getSelectedProductOptions,
  Analytics,
  useSelectedOptionInUrlParam,
} from '@shopify/hydrogen';
import {ProductPrice} from '~/components/ProductPrice';
import {AddToCartButton} from '~/components/AddToCartButton';
import {useAside} from '~/components/Aside';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
const ProductScene = lazy(() => import('~/components/ProductScene.client'));

export const meta = ({data}) => {
  return [
    {title: `Hydrogen | ${data?.product.title ?? ''}`},
    {
      rel: 'canonical',
      href: `/products/${data?.product.handle}`,
    },
  ];
};

export async function loader(args) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);
  return {...deferredData, ...criticalData};
}

async function loadCriticalData({context, params, request}) {
  const {handle} = params;
  const {storefront} = context;

  if (!handle) {
    throw new Error('Expected product handle to be defined');
  }

  const [{product}] = await Promise.all([
    storefront.query(PRODUCT_QUERY, {
      variables: {handle, selectedOptions: getSelectedProductOptions(request)},
    }),
  ]);

  if (!product?.id) {
    throw new Response(null, {status: 404});
  }

  redirectIfHandleIsLocalized(request, {handle, data: product});

  // Fetch recommendations (best-effort)
  let recommended = [];
  try {
    const rec = await storefront.query(RECOMMENDED_QUERY, {
      variables: {productId: product.id},
    });
    recommended = rec?.productRecommendations ?? [];
  } catch (e) {
    console.error('Recommendations query failed', e);
  }

  // Fallback: if no recommendations and product has no collection siblings,
  // fetch a generic set of products to populate the carousel.
  let fallbackProducts = [];
  const firstCollection = product?.collections?.nodes?.[0];
  const collectionSiblings = firstCollection?.products?.nodes?.filter((p) => p.id !== product.id) || [];
  if (!recommended.length && !collectionSiblings.length) {
    try {
      const fb = await storefront.query(ALSO_LIKE_FALLBACK_QUERY);
      fallbackProducts = fb?.products?.nodes || [];
    } catch (e) {
      console.error('Also-like fallback query failed', e);
    }
  }

  return {
    product,
    recommended,
    fallbackProducts,
  };
}

function loadDeferredData() {
  return {};
}

export default function Product() {
  const {product, recommended = [], fallbackProducts = []} = useLoaderData();

  const selectedVariant = product.selectedOrFirstAvailableVariant;

  useSelectedOptionInUrlParam(selectedVariant.selectedOptions);

  const {title, descriptionHtml} = product;

  const imageUrl = selectedVariant?.image?.url || product?.featuredImage?.url;
  const navigate = useNavigate();
  const {open} = useAside();
  const [qty, setQty] = useState(1);
  const stepBtn = {
    background: 'transparent',
    color: '#fff',
    border: 'none',
    padding: '0.5rem 0.75rem',
    cursor: 'pointer',
    userSelect: 'none',
  };

  // Extract a 'Size' option (if present) for dropdown UX; otherwise single option or none
  const sizeOption = useMemo(() => {
    return product.options.find((o) => o.name.toLowerCase() === 'size');
  }, [product.options]);

  function onSizeChange(e) {
    const value = e.target.value;
    const option = sizeOption;
    if (!option) return;
    const target = option.optionValues.find((v) => v.name === value);
    if (target && target.exists) {
      if (target.isDifferentProduct) {
        // Navigate to another combined-listing product
        navigate(`/products/${target.handle}?${target.variantUriQuery}`, {
          replace: true,
          preventScrollReset: true,
        });
      } else if (!target.selected) {
        navigate(`?${target.variantUriQuery}`, {replace: true, preventScrollReset: true});
      }
    }
  }

  const media = selectedVariant?.image || product?.featuredImage || {};
  const imgW = media?.width || 0;
  const imgH = media?.height || 0;
  const isPortrait = imgH && imgW ? imgH >= imgW : false;
  const aspect = isPortrait ? '3 / 4' : '16 / 10';

  return (
    <div className="product-page"
      style={{
        minHeight: '100vh',
        background: '#000',
        color: '#fff',
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr',
        gap: '2rem',
        padding: '5.5rem 3rem 3rem',
        alignItems: 'start',
        position: 'relative',
        zIndex: 2,
      }}
    >
      {/* Back control */}
      <button
        onClick={() => (window.history.length > 1 ? window.history.back() : navigate('/shop'))}
        style={{
          position: 'fixed', top: '1rem', left: '1rem', zIndex: 250,
          background: 'rgba(255,255,255,0.08)', color:'#fff', border:'1px solid rgba(255,255,255,0.2)',
          padding: '.5rem .75rem', borderRadius: 8, cursor:'pointer'
        }}
      >← Back</button>
      {/* Left: 3D panel */}
      <div style={{border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '1rem', background: '#0d0d0d', position:'relative', overflow:'hidden', zIndex:1}}>
        <div style={{width: '100%', aspectRatio: aspect, maxHeight: isPortrait ? '66vh' : '78vh'}}>
          <Suspense fallback={<div style={{padding: '2rem', color: '#888'}}>Loading…</div>}>
            {imageUrl ? (
              <ProductScene textureUrl={imageUrl} />
            ) : (
              <div style={{padding: '2rem', color: '#888'}}>No image</div>
            )}
          </Suspense>
        </div>
      </div>

      {/* Right: details */}
      <div style={{padding: '0 0.5rem', position: 'relative', zIndex: 3, pointerEvents:'auto'}}>
        <h1 style={{
          margin: 0,
          fontFamily: 'monospace',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          fontSize: '2rem',
        }}>{title}</h1>
        <div style={{opacity: 0.7, marginTop: '.25rem'}}>{product.vendor}</div>

        <div style={{marginTop: '1.25rem', fontSize: '1.25rem'}}>
          <ProductPrice
            price={selectedVariant?.price}
            compareAtPrice={selectedVariant?.compareAtPrice}
          />
        </div>

        {/* Controls: quantity + size + add to cart + like */}
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '10px',
          background: 'rgba(255,255,255,0.02)',
        }}>
          {/* Quantity */}
          <div style={{display: 'flex', alignItems: 'center', gap: '.75rem'}}>
            <div style={{opacity: 0.7, fontSize: '.85rem', width: 72}}>Quantity</div>
            <div style={{display:'inline-flex', alignItems:'center', border:'1px solid rgba(255,255,255,0.2)', borderRadius: 8}}>
              <button type="button" onClick={() => setQty((q) => Math.max(1, q-1))} style={stepBtn}>−</button>
              <div style={{minWidth: 36, textAlign:'center'}}>{qty}</div>
              <button type="button" onClick={() => setQty((q) => q+1)} style={stepBtn}>+</button>
            </div>
          </div>

          {/* Size dropdown (optional) */}
          {sizeOption ? (
            <div style={{display:'flex', alignItems:'center', gap: '.75rem', marginTop: '0.75rem'}}>
              <div style={{opacity: 0.7, fontSize: '.85rem', width: 72}}>Size</div>
              <select onChange={onSizeChange} value={sizeOption.optionValues.find(v=>v.selected)?.name || (sizeOption.optionValues[0]?.name || '')}
                style={{background:'transparent', color:'#fff', border:'1px solid rgba(255,255,255,0.2)', padding:'0.5rem 0.75rem', borderRadius:8}}>
                {sizeOption.optionValues.map((v) => (
                  <option key={v.name} value={v.name} disabled={!v.exists} style={{color:'#000'}}>
                    {v.name}{!v.available ? ' (unavailable)' : ''}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {/* CTA row */}
          <div style={{display:'flex', gap: '0.75rem', marginTop: '0.9rem', alignItems:'center'}}>
            <AddToCartButton
              disabled={!selectedVariant || !selectedVariant.availableForSale}
              onClick={() => open('cart')}
              lines={selectedVariant ? [{merchandiseId: selectedVariant.id, quantity: qty}] : []}
              selectedVariant={selectedVariant} 
              style={{
                background:'#ff4d00',
                color:'#000',
                border:'1px solid #ff864d',
                padding:'0.9rem 1.25rem',
                borderRadius: '10px',
                fontWeight: 700,
                letterSpacing: '.08em',
                textTransform: 'uppercase',
                cursor:'pointer', position:'relative', zIndex:50,
              }}
            >
              {selectedVariant?.availableForSale ? 'Add to Cart' : 'Sold Out'}
              selectedVariant={selectedVariant}
            </AddToCartButton>
            <LikeButton productId={product.id} />
          </div>
        </div>

        {/* Accordions */}
        <Accordion label="Description" defaultOpen>
          <div dangerouslySetInnerHTML={{__html: descriptionHtml}} />
        </Accordion>
        <Accordion label="Materials">
          <Metafield html={product?.metafield?.value} fallbacks={[product?.metafield_materials?.value]} />
        </Accordion>
        <Accordion label="Care & Hanging">
          <Metafield html={product?.metafield_care?.value} />
        </Accordion>
        <Accordion label="Delivery & Returns">
          <Metafield html={product?.metafield_delivery_returns?.value} />
        </Accordion>
      </div>

      <Analytics.ProductView
        data={{
          products: [
            {
              id: product.id,
              title: product.title,
              price: selectedVariant?.price.amount || '0',
              vendor: product.vendor,
              variantId: selectedVariant?.id || '',
              variantTitle: selectedVariant?.title || '',
              quantity: 1,
            },
          ],
        }}
      />
      {/* You may also like */}
      <div style={{gridColumn: '1 / -1', marginTop: '2rem'}}>
        <YouMayAlsoLike product={product} recommended={recommended} fallback={fallbackProducts} />
      </div>
    </div>
  );
}

function Metafield({html, fallbacks = []}) {
  const value = html || fallbacks.find(Boolean) || '';
  if (!value) return <div style={{opacity:0.6}}>No details yet.</div>;
  return <div dangerouslySetInnerHTML={{__html: value}} />;
}

function Accordion({label, children, defaultOpen=false}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{marginTop: '1rem', borderTop:'1px solid rgba(255,255,255,0.1)'}}>
      <button onClick={() => setOpen(o=>!o)} style={{
        width:'100%', textAlign:'left', padding:'0.75rem 0', background:'transparent', color:'#fff', border:'none', cursor:'pointer',
        display:'flex', alignItems:'center', justifyContent:'space-between'
      }}>
        <span style={{textTransform:'uppercase', letterSpacing:'.14em', fontSize:'.8rem', opacity:0.8}}>{label}</span>
        <span style={{opacity:0.6}}>{open ? '–' : '+'}</span>
      </button>
      <div style={{maxHeight: open ? '800px' : 0, overflow:'hidden', transition:'max-height .3s ease'}}>
        <div style={{padding:'0 0 0.75rem 0', opacity:0.9}}>{children}</div>
      </div>
    </div>
  );
}

function LikeButton({productId}) {
  const key = `like:${productId}`;
  const [liked, setLiked] = useState(false);
  useEffect(() => {
    setLiked(localStorage.getItem(key) === '1');
  }, [key]);
  return (
    <button
      type="button"
      aria-pressed={liked}
      onClick={() => {
        const next = !liked; setLiked(next); localStorage.setItem(key, next ? '1' : '0');
      }}
      style={{
        border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, padding:'0.5rem 0.75rem', background:'transparent', color:'#fff'
      }}
    >{liked ? '♥ Liked' : '♡ Like'}</button>
  );
}

function YouMayAlsoLike({product, recommended, fallback = []}) {
  // Build a pool: recommendations -> collection siblings -> fallback
  const rec = Array.isArray(recommended) ? recommended : [];
  const coll = (product?.collections?.nodes?.[0]?.products?.nodes || []).filter((p) => p.id !== product.id);
  const pool = [...rec, ...coll, ...fallback];
  // Dedupe by id
  const seen = new Set();
  const unique = pool.filter((p) => (p && !seen.has(p.id) && seen.add(p.id)));
  if (!unique.length) return null;

  // Pick exactly 8 items, randomized; if fewer exist, cycle to fill 8
  const EIGHT = 8;
  const shuffled = [...unique].sort(() => Math.random() - 0.5);
  let items = shuffled.slice(0, Math.min(EIGHT, shuffled.length));
  while (items.length < EIGHT && unique.length) {
    items.push(unique[items.length % unique.length]);
  }

  const listRef = React.useRef(null);
  const CARD_W = 260; // px
  const GAP_REM = 2.25; // more breathing room between paintings
  const GAP_PX = 36; // ~2.25rem @16px base
  const MAX_VISIBLE = 4;
  const STEP = (CARD_W + GAP_PX) * 2; // scroll 2 cards per click
  const scrollBy = (dir) => {
    const el = listRef.current; if (!el) return;
    const first = el.firstElementChild;
    const gap = parseFloat(getComputedStyle(el).columnGap || '0') || GAP_PX;
    const w = first ? first.getBoundingClientRect().width : CARD_W;
    const step = (w + gap) * 2; // two cards per click
    el.scrollBy({left: dir * step, behavior: 'smooth'});
  };

  const formatPrice = (price) => {
    if (!price?.amount) return '';
    const amt = Number(price.amount);
    const code = price.currencyCode || '';
    return `${amt.toFixed(2)} ${code}`;
  };

  return (
    <div style={{padding: '1.25rem 0', borderTop: '1px solid rgba(255,255,255,0.08)'}}>
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: '.75rem'}}>
        <div style={{textTransform:'uppercase', letterSpacing:'.14em', fontSize:'.85rem', opacity:0.85}}>You may also like</div>
        {/* inline arrows removed; overlay arrows added below */}
      </div>
      <div style={{
        position:'relative',
        maxWidth: `calc(${CARD_W}px * ${MAX_VISIBLE} + ${GAP_REM}rem * ${MAX_VISIBLE - 1})`,
        margin: '0 auto',
        padding: '0 3.25rem', // keep arrows a fixed offset from the carousel
        boxSizing: 'content-box',
      }}>
        <div
          ref={listRef}
          style={{
            display:'grid',
            gridAutoFlow:'column',
            gridAutoColumns: `${CARD_W}px`,
            gap: `${GAP_REM}rem`,
            overflowX:'auto',
            scrollSnapType:'x mandatory',
            paddingBottom:'.5rem',
          }}
        >
          {items.map((p) => (
            <a key={p.id} href={`/products/${p.handle}`} style={{
              display:'block', border:'1px solid rgba(255,255,255,0.18)', borderRadius:12, padding:'0 1rem 0.9rem', background:'rgba(255,255,255,0.03)', textDecoration:'none', color:'#fff', scrollSnapAlign:'start', overflow:'hidden'
            }}>
              {p.featuredImage?.url && (
                <div style={{margin:'0 -1rem .6rem', borderTopLeftRadius:12, borderTopRightRadius:12, overflow:'hidden'}}>
                  <img src={p.featuredImage.url} alt={p.title} style={{display:'block', width:'100%', height:240, objectFit:'cover', background:'transparent'}} />
                </div>
              )}
              <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:'0.75rem'}}>
                <span style={{fontSize:'.95rem', opacity:.95, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', flex:'1 1 auto', minWidth:0}}>{p.title}</span>
                <span style={{fontSize:'.9rem', opacity:.85}}>{formatPrice(p?.priceRange?.minVariantPrice)}</span>
              </div>
            </a>
          ))}
        </div>
        {/* Overlay arrows */}
        <button type="button" aria-label="Scroll left" onClick={() => scrollBy(-1)} style={{...overlayArrow, left: '0.5rem'}}>←</button>
        <button type="button" aria-label="Scroll right" onClick={() => scrollBy(1)} style={{...overlayArrow, right: '0.5rem'}}>→</button>
      </div>
    </div>
  );
}

const arrowBtn = {
  background: 'rgba(255,255,255,0.1)',
  border: '1px solid rgba(255,255,255,0.25)',
  color: '#fff',
  borderRadius: 8,
  padding: '.35rem .6rem',
  cursor: 'pointer',
};

const overlayArrow = {
  ...arrowBtn,
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  zIndex: 2,
};

const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    availableForSale
    compareAtPrice {
      amount
      currencyCode
    }
    id
    image {
      __typename
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    product {
      title
      handle
    }
    selectedOptions {
      name
      value
    }
    sku
    title
    unitPrice {
      amount
      currencyCode
    }
  }
`;

const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
    title
    vendor
    handle
    descriptionHtml
    description
    encodedVariantExistence
    encodedVariantAvailability
    options {
      name
      optionValues {
        name
        firstSelectableVariant {
          ...ProductVariant
        }
        swatch {
          color
          image {
            previewImage {
              url
            }
          }
        }
      }
    }
    selectedOrFirstAvailableVariant(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
      ...ProductVariant
    }
    adjacentVariants (selectedOptions: $selectedOptions) {
      ...ProductVariant
    }
    seo {
      description
      title
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
`;

const PRODUCT_QUERY = `#graphql
  query Product(
    $country: CountryCode
    $handle: String!
    $language: LanguageCode
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...Product
      collections(first: 1) {
        nodes {
          id
          handle
          title
          products(first: 12) {
            nodes {
              id
              title
              handle
              featuredImage { url altText width height }
              priceRange { minVariantPrice { amount currencyCode } }
            }
          }
        }
      }
      metafield: metafield(namespace: "custom", key: "details") { value }
      metafield_materials: metafield(namespace: "custom", key: "materials") { value }
      metafield_care: metafield(namespace: "custom", key: "care") { value }
      metafield_delivery_returns: metafield(namespace: "custom", key: "delivery_returns") { value }
    }
  }
  ${PRODUCT_FRAGMENT}
`;

const RECOMMENDED_QUERY = `#graphql
  query Recommended($productId: ID!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    productRecommendations(productId: $productId) {
      id
      title
      handle
      featuredImage { url altText width height }
      priceRange { minVariantPrice { amount currencyCode } }
    }
  }
`;

const ALSO_LIKE_FALLBACK_QUERY = `#graphql
  query FallbackProducts($country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    products(first: 12, sortKey: CREATED_AT, reverse: true) {
      nodes {
        id
        title
        handle
        featuredImage { url altText width height }
        priceRange { minVariantPrice { amount currencyCode } }
      }
    }
  }
`;
