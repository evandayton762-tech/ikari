// app/routes/($locale).catalog.jsx
import {defer} from '@shopify/remix-oxygen';
import {Suspense, useEffect, useState, useRef} from 'react';
import {Await, useLoaderData, Link} from '@remix-run/react';
import Nav from '~/components/Nav';

export const meta = () => {
  return [{title: 'Catalog - Ikari'}];
};

export async function loader({context}) {
  const {storefront} = context;
  
  try {
    // Get collections for categories
    const collections = await storefront.query(COLLECTIONS_QUERY);
    
    return defer({
      collections: collections?.collections?.nodes || []
    });
  } catch (error) {
    console.error('Shopify collections query error:', error);
    return defer({collections: []});
  }
}

// Category configurations with GLB models (resolved client-side)
// Include per-model scale multipliers to normalize apparent size
const CATEGORY_CONFIGS = [
  // Shrink most models substantially; HxH and Solo Leveling are kept similar
  { id: 'star-wars',     name: 'Star Wars',        handle: 'star-wars',        glbKey: 'starwars.glb',      scale: 0.55, color: '#ff6b6b', description: 'Galactic Art Collection' },
  { id: 'aot',           name: 'Attack on Titan',  handle: 'attack-on-titan',  glbKey: 'aot.glb',           scale: 0.6,  color: '#f96262', description: 'Titan Saga' },
  { id: 'hunterxhunter', name: 'Hunter × Hunter',  handle: 'hunter-x-hunter',  glbKey: 'hunterxhunter.glb', scale: 0.85, color: '#9be7ff', description: 'Hunter Series' },
  { id: 'naruto',        name: 'Naruto',           handle: 'naruto',           glbKey: 'naruto.glb',        scale: 0.7,  color: '#feca57', description: 'Ninja Chronicles' },
  { id: 'solo-leveling', name: 'Solo Leveling',    handle: 'solo-leveling',    glbKey: 'sololeveling.glb',  scale: 0.9,  color: '#a07bff', description: 'Awakened Arts' },
  { id: 'gothic-cross',  name: 'Bible / Cross',    handle: 'bible',            glbKey: 'gothiccross.glb',   scale: 0.75, color: '#96ceb4', description: 'Sacred Motifs' },
  { id: 'soccer',        name: 'Sports',           handle: 'sports',           glbKey: 'soccer.glb',        scale: 0.7,  color: '#45b7d1', description: 'Sports & Motion' },
  { id: 'jet',           name: 'Aerial',           handle: 'aerial',           glbKey: 'jet.glb',           scale: 0.6,  color: '#4ecdc4', description: 'Aerial Vehicles' },
];

function ThreeCatalogObject({ config, isActive, onClick }) {
  const containerRef = useRef();
  const [isClient, setIsClient] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !containerRef.current) return;

    const loadThreeJS = async () => {
      try {
        const { Canvas, useFrame } = await import('@react-three/fiber');
        const { useGLTF, Environment } = await import('@react-three/drei');
        const { createRoot } = await import('react-dom/client');
        const React = await import('react');

        const resolveGlb = (key) => new URL(`../assets/${key}`, import.meta.url).href;

        function GlbModel({ url, mul = 1 }) {
          const { scene } = useGLTF(url);
          React.useEffect(() => {
            if (!scene) return;
            import('three').then(({Box3, Vector3}) => {
              const box = new Box3().setFromObject(scene);
              const center = box.getCenter(new Vector3());
              scene.position.sub(center);
              const size = box.getSize(new Vector3());
              const max = Math.max(size.x, size.y, size.z) || 1;
              const target = 2.2;
              const s = (target / max) * mul;
              scene.scale.setScalar(s);
            });
          }, [scene]);
          return React.createElement('primitive', { object: scene, dispose: null });
        }

        function ObjectMesh({ config, isActive }) {
          const meshRef = React.useRef();
          
          useFrame((state) => {
            if (meshRef.current) {
              // Horizontal spin only (around Y axis). Keep upright on X.
              meshRef.current.rotation.y += 0.01;
              meshRef.current.rotation.x += (0 - meshRef.current.rotation.x) * 0.1;

              // Floating animation (bounce)
              meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;

              // Scale based on active state
              const targetScale = isActive ? 1.2 : 1;
              meshRef.current.scale.lerp({ x: targetScale, y: targetScale, z: targetScale }, 0.1);
            }
          });

          const getGeometry = () => {
            switch (config.object) {
              case 'sphere':
                return React.createElement('sphereGeometry', { args: [1, 32, 32] });
              case 'torus':
                return React.createElement('torusGeometry', { args: [1, 0.3, 16, 100] });
              case 'box':
                return React.createElement('boxGeometry', { args: [1.5, 1.5, 1.5] });
              case 'octahedron':
                return React.createElement('octahedronGeometry', { args: [1.2] });
              case 'dodecahedron':
                return React.createElement('dodecahedronGeometry', { args: [1] });
              default:
                return React.createElement('sphereGeometry', { args: [1, 32, 32] });
            }
          };

          if (config.glbKey) {
            return React.createElement('group', { ref: meshRef, onClick }, [
              React.createElement(GlbModel, { key: 'glb', url: resolveGlb(config.glbKey), mul: (config.scale || 1) })
            ]);
          }

          return React.createElement('mesh', { ref: meshRef, onClick }, [
            getGeometry(),
            React.createElement('meshStandardMaterial', {
              key: 'material',
              color: config.color,
              metalness: 0.8,
              roughness: 0.2,
              transparent: true,
              opacity: isActive ? 1 : 0.8
            })
          ]);
        }

        function Scene() {
          return React.createElement(Canvas, {
            camera: { position: [0, 0, 5], fov: 50 },
            style: { 
              width: '100%', 
              height: '100%',
              cursor: 'pointer'
            }
          }, [
            React.createElement('ambientLight', { key: 'ambient', intensity: 1.2 }),
            React.createElement('hemisphereLight', { key: 'hemi', skyColor: 0xffffff, groundColor: 0x444444, intensity: 0.9 }),
            React.createElement('directionalLight', { 
              key: 'directional', 
              position: [10, 12, 8], 
              intensity: 1.4 
            }),
            React.createElement('directionalLight', { 
              key: 'directional2', 
              position: [-10, -12, -8], 
              intensity: 1.2 
            }),
            React.createElement('pointLight', { key: 'pt1', position: [0, 0, 6], intensity: 1.6 }),
            React.createElement(Environment, { key:'env', preset:'studio', background:false, intensity: 1.25 }),
            React.createElement(ObjectMesh, { 
              key: 'mesh', 
              config: config,
              isActive: isActive
            })
          ]);
        }

        if (containerRef.current) {
          if (containerRef.current.hasChildNodes()) {
            // re-render to update model on category change
            containerRef.current.innerHTML = '';
          }
          const root = createRoot(containerRef.current);
          root.render(React.createElement(Scene));
        }
      } catch (error) {
        console.error('Failed to load Three.js:', error);
      }
    };

    loadThreeJS();
  }, [isClient, config, isActive, onClick, isLoaded]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '300px',
        height: '300px',
        position: 'relative',
        transition: 'all 0.3s ease'
      }}
    />
  );
}

function CatalogContent({ collections }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Merge collections with predefined configs
  const categories = CATEGORY_CONFIGS.map(config => {
    const collection = collections.find(c => c.handle === config.handle);
    return {
      ...config,
      collection: collection,
      productCount: collection?.products?.nodes?.length || 0
    };
  });

  const handleNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % categories.length);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const handlePrev = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + categories.length) % categories.length);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const handleCategoryClick = () => {
    const currentCategory = categories[currentIndex];
    if (currentCategory.collection) {
      // Navigate to shop page filtered by collection
      window.location.href = `/collections/${currentCategory.handle}`;
    }
  };

  const currentCategory = categories[currentIndex];

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#000',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <Nav />
      
      {/* Grid background */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
        zIndex: 1
      }} />

      {/* Main content */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '4rem',
        zIndex: 10
      }}>
        {/* Left Arrow */}
        <button
          onClick={handlePrev}
          style={{
            width: '80px',
            height: '80px',
            border: '2px solid rgba(255,255,255,0.3)',
            background: 'rgba(0,0,0,0.8)',
            color: '#fff',
            fontSize: '2rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#fff';
            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
            e.currentTarget.style.background = 'rgba(0,0,0,0.8)';
          }}
        >
          ←
        </button>

        {/* Main 3D Object */}
        <div style={{
          position: 'relative',
          opacity: isTransitioning ? 0.5 : 1,
          transform: isTransitioning ? 'scale(0.9)' : 'scale(1)',
          transition: 'all 0.3s ease'
        }}>
          <ThreeCatalogObject
            config={currentCategory}
            isActive={true}
            onClick={handleCategoryClick}
          />
          
          {/* Category info overlay */}
          <div style={{
            position: 'absolute',
            bottom: '-140px',
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
            color: '#fff',
            width: '400px'
          }}>
            <h2 style={{
              fontSize: '2.5rem',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              margin: '0 0 1rem 0',
              color: currentCategory.color
            }}>
              {currentCategory.name}
            </h2>
            
            <p style={{
              fontSize: '1rem',
              fontFamily: 'monospace',
              color: 'rgba(255,255,255,0.7)',
              margin: '0 0 1rem 0',
              letterSpacing: '0.1em'
            }}>
              {currentCategory.description}
            </p>
            
            <div style={{
              fontSize: '0.875rem',
              fontFamily: 'monospace',
              color: 'rgba(255,255,255,0.5)',
              textTransform: 'uppercase',
              letterSpacing: '0.15em'
            }}>
              {currentCategory.productCount} Items Available
            </div>
          </div>
        </div>

        {/* Right Arrow */}
        <button
          onClick={handleNext}
          style={{
            width: '80px',
            height: '80px',
            border: '2px solid rgba(255,255,255,0.3)',
            background: 'rgba(0,0,0,0.8)',
            color: '#fff',
            fontSize: '2rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#fff';
            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
            e.currentTarget.style.background = 'rgba(0,0,0,0.8)';
          }}
        >
          →
        </button>
      </div>

      {/* Category indicators */}
      <div style={{
        position: 'absolute',
        bottom: '4rem',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '1rem',
        zIndex: 10
      }}>
        {categories.map((_, index) => (
          <div
            key={index}
            onClick={() => setCurrentIndex(index)}
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.3)',
              background: index === currentIndex ? '#fff' : 'transparent',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          />
        ))}
      </div>

      {/* Instructions */}
      <div style={{
        position: 'absolute',
        top: '5rem',
        right: '2rem',
        color: 'rgba(255,255,255,0.6)',
        fontFamily: 'monospace',
        fontSize: '0.875rem',
        textAlign: 'right',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        zIndex: 10
      }}>
        <div>Click Object to Explore</div>
        <div style={{ marginTop: '0.5rem' }}>Use Arrows to Navigate</div>
      </div>

      {/* Current category indicator */}
      <div style={{
        position: 'absolute',
        top: '2rem',
        left: '2rem',
        color: '#fff',
        fontFamily: 'monospace',
        fontSize: '1rem',
        textTransform: 'uppercase',
        letterSpacing: '0.15em',
        zIndex: 10
      }}>
        <div style={{ color: 'rgba(255,255,255,0.5)' }}>
          {String(currentIndex + 1).padStart(2, '0')} / {String(categories.length).padStart(2, '0')}
        </div>
        <div style={{ marginTop: '0.5rem', color: currentCategory.color }}>
          {currentCategory.name}
        </div>
      </div>
    </div>
  );
}

export default function Catalog() {
  const {collections} = useLoaderData();
  
  return (
    <Suspense fallback={
      <div style={{
        width: '100vw',
        height: '100vh',
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontFamily: 'monospace',
        fontSize: '1.5rem',
        textTransform: 'uppercase',
        letterSpacing: '0.2em'
      }}>
        Loading Catalog...
      </div>
    }>
      <Await resolve={collections}>
        {(data) => (
          <CatalogContent collections={data || []} />
        )}
      </Await>
    </Suspense>
  );
}

const COLLECTIONS_QUERY = `#graphql
  query Collections {
    collections(first: 10) {
      nodes {
        id
        title
        handle
        description
        products(first: 1) {
          nodes {
            id
            title
          }
        }
      }
    }
  }
`;
