// app/routes/($locale).shop.jsx
import {defer} from '@shopify/remix-oxygen';
import {Suspense, useEffect, useState, useRef, lazy} from 'react';
import {Await, useLoaderData, useSearchParams, Link} from '@remix-run/react';

export const meta = () => {
  return [{title: 'Shop All - Ikari'}];
};

const PRODUCTS_PER_PAGE = 12;

export async function loader({context, request}) {
  const {storefront} = context;
  const url = new URL(request.url);
  const searchParams = new URLSearchParams(url.search);
  const page = parseInt(searchParams.get('page') || '1');
  
  const startCursor = searchParams.get('cursor');

  try {
    const products = await storefront.query(PRODUCTS_QUERY, {
      variables: {
        first: PRODUCTS_PER_PAGE,
        after: startCursor
      }
    });
    
    return defer({
      products,
      currentPage: page
    });
  } catch (error) {
    console.error('Shopify query error:', error);
    return defer({products: null, currentPage: 1});
  }
}

const LazyProductScene = lazy(() => import('../components/ProductScene.client'));

function ThreeProductCard({ product }) {
  const [isClient, setIsClient] = useState(false);
  const [dimensions, setDimensions] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const pressTimer = useRef(null);
  const pressStart = useRef({x:0,y:0});
  const moved = useRef(false);
  const longPress = useRef(false);
  const HOLD_MS = 220; // hold threshold to treat as inspect/drag, not navigate
  const MOVE_PX = 8;   // movement threshold

  useEffect(() => {
    setIsClient(true);
    
    if (product.featuredImage?.url) {
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        const maxSize = 500;
        
        if (aspectRatio > 1) {
          // Landscape
          setDimensions({ 
            width: maxSize, 
            height: maxSize / aspectRatio 
          });
        } else {
          // Portrait
          setDimensions({ 
            width: maxSize * aspectRatio, 
            height: maxSize 
          });
        }
        setImageLoaded(true);
      };
      img.src = product.featuredImage.url;
    }
  }, [product.featuredImage]);

  // When simplifying to navigate, allow default link behavior

  // No separate createRoot; render scene lazily directly below

  return (
    <div style={{
      position: 'relative',
      width: '400px',
      marginBottom: '6rem'
    }}>
      <Link 
        to={`/products/${product.handle}`}
        style={{
          position: 'relative',
          width: '400px',
          height: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textDecoration: 'none',
          overflow: 'hidden'
        }}
        // Prevent navigation when dragging/long-pressing to view 3D
        draggable={false}
        onMouseDown={(e)=>{
          moved.current = false; longPress.current = false;
          pressStart.current = {x:e.clientX,y:e.clientY};
          if (pressTimer.current) clearTimeout(pressTimer.current);
          pressTimer.current = setTimeout(()=>{ longPress.current = true; }, HOLD_MS);
        }}
        onMouseMove={(e)=>{
          const dx = Math.abs(e.clientX - pressStart.current.x);
          const dy = Math.abs(e.clientY - pressStart.current.y);
          if (dx > MOVE_PX || dy > MOVE_PX) moved.current = true;
        }}
        onMouseUp={()=>{ if (pressTimer.current) clearTimeout(pressTimer.current); }}
        onTouchStart={(e)=>{
          moved.current = false; longPress.current = false;
          const t = e.touches[0]; pressStart.current = {x:t.clientX,y:t.clientY};
          if (pressTimer.current) clearTimeout(pressTimer.current);
          pressTimer.current = setTimeout(()=>{ longPress.current = true; }, HOLD_MS);
        }}
        onTouchMove={(e)=>{
          const t = e.touches[0];
          const dx = Math.abs(t.clientX - pressStart.current.x);
          const dy = Math.abs(t.clientY - pressStart.current.y);
          if (dx > MOVE_PX || dy > MOVE_PX) moved.current = true;
        }}
        onTouchEnd={()=>{ if (pressTimer.current) clearTimeout(pressTimer.current); }}
        onClick={(e)=>{
          if (moved.current || longPress.current) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        {(!isClient || !imageLoaded) && product.featuredImage?.url && (
          <img 
            src={product.featuredImage.url} 
            alt={product.title}
            style={{
              maxWidth: '350px',
              maxHeight: '350px',
              width: 'auto',
              height: 'auto'
            }}
            draggable={false}
          />
        )}

        {isClient && imageLoaded && dimensions && (
          <div
            style={{ width: `${dimensions.width}px`, height: `${dimensions.height}px` }}
            onDragStart={(e) => e.preventDefault()}
          >
            <Suspense fallback={null}>
              <LazyProductScene textureUrl={product.featuredImage.url} width={dimensions.width} height={dimensions.height} />
            </Suspense>
          </div>
        )}

        <div style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          background: 'rgba(0,0,0,0.9)',
          border: '1px solid rgba(255,255,255,0.3)',
          padding: '0.4rem 0.8rem',
          fontSize: '0.6rem',
          fontFamily: 'monospace',
          color: '#fff',
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          zIndex: 10
        }}>
          ● IN STOCK
        </div>
      </Link>

      <div style={{
        position: 'absolute',
        bottom: '-4rem',
        left: 0,
        right: 0,
        background: 'linear-gradient(90deg, #000 0%, #111 50%, #000 100%)',
        border: '1px solid rgba(255,255,255,0.2)',
        padding: '1rem 1.5rem',
        fontFamily: 'monospace',
        fontSize: '0.75rem',
        color: '#fff',
        textTransform: 'uppercase',
        letterSpacing: '0.15em'
      }}>
        <div style={{ 
          marginBottom: '0.5rem', 
          fontSize: '0.7rem',
          color: 'rgba(255,255,255,0.7)'
        }}>
          {(product.title || product.handle.replace(/-/g, ' ')).toUpperCase()}
        </div>
        <div style={{ 
          color: '#fff', 
          fontWeight: 'bold',
          fontSize: '1rem',
          letterSpacing: '0.2em'
        }}>
          {product.priceRange.minVariantPrice.amount} {product.priceRange.minVariantPrice.currencyCode}
        </div>
      </div>

      {/* Scene is rendered inline above; no separate createRoot */}
    </div>
  );
}

function ShopAllContent({ products = [], pageInfo = {}, currentPage = 1 }) {
  const [searchParams] = useSearchParams();
  const [sortBy, setSortBy] = useState('recommended');
  const [cursors, setCursors] = useState({});

  useEffect(() => {
    if (pageInfo.endCursor) {
      setCursors(prev => ({
        ...prev,
        [currentPage]: pageInfo.endCursor
      }));
    }
  }, [currentPage, pageInfo.endCursor]);

  const handleSort = (type) => {
    setSortBy(type);
  };

  return (
    <div style={{
      width: '100vw',
      minHeight: '100vh',
      background: '#000',
      position: 'relative',
      overflow: 'auto',
      padding: '2rem 4rem'
    }}>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
        `,
        backgroundSize: '32px 32px',
        zIndex: 0
      }} />

      <div style={{
        marginBottom: '4rem',
        position: 'relative',
        zIndex: 1
      }}>
        <h1 style={{
          color: '#fff',
          fontSize: '6rem',
          fontFamily: 'monospace',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          margin: 0,
          marginBottom: '3rem'
        }}>
          /products
        </h1>

        <div style={{
          display: 'flex',
          gap: '2rem',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <button style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.3)',
            color: '#fff',
            padding: '1rem 2rem',
            fontFamily: 'monospace',
            textTransform: 'uppercase',
            fontSize: '0.875rem',
            cursor: 'pointer',
            letterSpacing: '0.1em'
          }}>
            Filter +
          </button>

          <select
            value={sortBy}
            onChange={(e) => handleSort(e.target.value)}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#fff',
              padding: '1rem 2rem',
              fontFamily: 'monospace',
              textTransform: 'uppercase',
              fontSize: '0.875rem',
              cursor: 'pointer',
              letterSpacing: '0.1em'
            }}
          >
            <option value="recommended">Recommended</option>
            <option value="newest">Newest</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>

          <div style={{
            marginLeft: 'auto',
            color: '#D8D8D8',
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em'
          }}>
            Page {currentPage} • {products.length} items
          </div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 400px)',
        gap: '2rem',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 1,
        paddingBottom: '8rem'
      }}>
        {products.map((product) => (
          <ThreeProductCard key={product.id} product={product} />
        ))}
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '2rem',
        marginTop: '4rem',
        marginBottom: '4rem',
        position: 'relative',
        zIndex: 1
      }}>
        {currentPage > 1 && (
          <Link
            to={currentPage === 2 ? '/shop' : `/shop?page=${currentPage - 1}${cursors[currentPage - 2] ? `&cursor=${cursors[currentPage - 2]}` : ''}`}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#fff',
              padding: '1rem 2rem',
              fontFamily: 'monospace',
              textTransform: 'uppercase',
              fontSize: '0.875rem',
              cursor: 'pointer',
              letterSpacing: '0.1em',
              textDecoration: 'none',
              display: 'inline-block'
            }}
          >
            ← Previous
          </Link>
        )}
        
        <div style={{
          color: '#fff',
          fontFamily: 'monospace',
          fontSize: '1rem',
          padding: '1rem 2rem',
          border: '1px solid rgba(255,255,255,0.5)',
          background: 'rgba(255,255,255,0.1)'
        }}>
          PAGE {currentPage}
        </div>

        {pageInfo.hasNextPage && (
          <Link
            to={`/shop?page=${currentPage + 1}${pageInfo.endCursor ? `&cursor=${pageInfo.endCursor}` : ''}`}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#fff',
              padding: '1rem 2rem',
              fontFamily: 'monospace',
              textTransform: 'uppercase',
              fontSize: '0.875rem',
              cursor: 'pointer',
              letterSpacing: '0.1em',
              textDecoration: 'none',
              display: 'inline-block'
            }}
          >
            Next →
          </Link>
        )}
      </div>

      <div style={{
        marginTop: '6rem',
        padding: '2rem 0',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        color: '#666',
        fontFamily: 'monospace',
        fontSize: '0.75rem',
        textTransform: 'uppercase',
        position: 'relative',
        zIndex: 1
      }}>
        <div>© {new Date().getFullYear()} IKARI</div>
        <div>{new Date().toLocaleTimeString()}</div>
      </div>
      {/* Quick view removed for now to avoid 404s; simple navigation instead */}
    </div>
  );
}

export default function Shop() {
  const {products, currentPage} = useLoaderData();
  
  return (
    <Suspense fallback={<div>Loading products...</div>}>
      <Await resolve={products}>
        {(data) => {
          return <ShopAllContent 
            products={data?.products?.nodes || []} 
            pageInfo={data?.products?.pageInfo || {}}
            currentPage={currentPage}
          />;
        }}
      </Await>
    </Suspense>
  );
}

const PRODUCTS_QUERY = `#graphql
  query Products($first: Int, $after: String) {
    products(first: $first, after: $after) {
      nodes {
        id
        title
        handle
        publishedAt
        featuredImage {
          id
          url
          altText
          width
          height
        }
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
          maxVariantPrice {
            amount
            currencyCode
          }
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;

// Quick view component removed in simplified flow
