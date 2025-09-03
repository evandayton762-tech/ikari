import {useEffect, useState} from 'react';
import {ClientOnly} from '@shopify/hydrogen'; // ✅ NEW: ensures Three.js loads only on client

export const meta = () => [{title: 'Ikari'}];

export default function Index() {
  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#000',
      }}
    >
      {/* PNG frame overlay */}
      <img
        src="/webframe2.png"
        alt=""
        style={{
          filter: 'invert(100%)',
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 50,
        }}
      />

      {/* Giant title */}
      <h1
        style={{
          position: 'absolute',
          top: '27%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '25vw',
          lineHeight: 1.5,
          fontFamily: 'Arial Black, sans-serif',
          fontWeight: 900,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: '#fff',
          margin: 0,
          zIndex: 5,
          pointerEvents: 'none',
        }}
      >
        IKARI
      </h1>

      {/* Top-left horizontal row */}
      <div
        style={{
          position: 'absolute',
          top: '3.5rem',
          left: '4rem',
          display: 'flex',
          flexDirection: 'row',
          columnGap: '.5rem',
          color: '#999',
          fontSize: '.7rem',
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          zIndex: 50,
        }}
      >
        <div style={{color: '#666'}}>Arizona</div>
        <div style={{color: '#666'}}>50° 27′0.0036″ N</div>
        <div style={{color: '#666'}}>30° 31′23.9988″ E</div>
      </div>

      {/* Top-right horizontal row */}
      <div
        style={{
          position: 'absolute',
          top: '3.5rem',
          right: '6rem',
          display: 'flex',
          flexDirection: 'row',
          columnGap: '1rem',
          color: '#999',
          fontSize: '.7rem',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          textAlign: 'right',
          zIndex: 50,
        }}
      >
        <div style={{color: '#666'}}>Creating</div>
        <div style={{color: '#fff'}}>Memorable</div>
        <div style={{color: '#fff'}}>Abstract</div>
        <div style={{color: '#fff'}}>Art</div>
      </div>

      {/* Bottom-left text */}
      <div
        style={{
          position: 'absolute',
          bottom: '4rem',
          left: '4rem',
          zIndex: 20,
        }}
      >
        <div
          style={{
            color: '#fff',
            textTransform: 'uppercase',
            fontSize: '0.875rem',
            letterSpacing: '0.1em',
            lineHeight: 1.4,
          }}
        >
          <div>Creative</div>
          <div>UI/UX</div>
          <div>Design&nbsp;Studio</div>
        </div>
      </div>

      {/* Contact button */}
      <button
        style={{
          position: 'absolute',
          bottom: '4rem',
          right: '4rem',
          width: '7rem',
          height: '7rem',
          borderRadius: '50%',
          border: '1px solid #666',
          backgroundColor: 'transparent',
          color: '#fff',
          textTransform: 'uppercase',
          fontSize: '0.875rem',
          letterSpacing: '0.1em',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          zIndex: 20,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#fff';
          e.currentTarget.style.color = '#000';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = '#fff';
        }}
        onClick={() => {
          if (typeof window !== 'undefined') {
            window.location.href = '/contact';
          }
        }}
      >
        Contact
      </button>

      {/* Three.js scene — loads only on client */}
      <ClientOnly fallback={null}>
        {() => (
          <>
            <div
              id="three-container"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                zIndex: 5,
              }}
            />
            <ThreeSceneLoader />
          </>
        )}
      </ClientOnly>
    </div>
  );
}

/* --- ThreeSceneLoader (unchanged) ------------------------------- */
function ThreeSceneLoader() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const init = async () => {
      const {default: ThreeHero} = await import('../components/ThreeHero.client');
      const {createRoot} = await import('react-dom/client');
      const container = document.getElementById('three-container');
      if (container && !loaded) {
        createRoot(container).render(<ThreeHero />);
        setLoaded(true);
      }
    };
    init();
  }, [loaded]);

  return null;
}
