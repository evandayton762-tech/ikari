// app/routes/_index.jsx
import React, { Suspense } from 'react';
import webframeUrl from '/webframe2.png?url';
import ThreeHero from '~/components/ThreeHero.client.jsx';

// Client-only guard so our Canvas only renders in the browser
function ClientOnly({ children }) {
  return import.meta.env.SSR ? null : children;
}

export const meta = () => [{ title: 'Ikari' }];

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
      {/* frame overlay */}
      <img
        src={webframeUrl}
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

      {/* IKARI title */}
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
          color: '#fff',
          margin: 0,
          zIndex: 5,
          pointerEvents: 'none',
        }}
      >
        IKARI
      </h1>

      {/* Three.js hero scene (client-only) */}
      <ClientOnly>
        <Suspense fallback={null}>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 1,
            }}
          >
            <ThreeHero />
          </div>
        </Suspense>
      </ClientOnly>

      {/* coords top-left */}
      <div
        style={{
          position: 'absolute',
          top: '3.5rem',
          left: '4rem',
          display: 'flex',
          columnGap: '.5rem',
          color: '#999',
          fontSize: '.7rem',
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          zIndex: 50,
        }}
      >
        <div style={{ color: '#666' }}>Arizona</div>
        <div style={{ color: '#666' }}>50° 27′0.0036″ N</div>
        <div style={{ color: '#666' }}>30° 31′23.9988″ E</div>
      </div>

      {/* menu top-right */}
      <div
        style={{
          position: 'absolute',
          top: '3.5rem',
          right: '6rem',
          display: 'flex',
          columnGap: '1rem',
          color: '#999',
          fontSize: '.7rem',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          textAlign: 'right',
          zIndex: 50,
        }}
      >
        <div style={{ color: '#666' }}>Creating</div>
        <div style={{ color: '#fff' }}>Memorable</div>
        <div style={{ color: '#fff' }}>Abstract</div>
        <div style={{ color: '#fff' }}>Art</div>
      </div>

      {/* bottom-left text */}
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
            letterSpacing: '.1em',
            lineHeight: 1.4,
          }}
        >
          <div>Creative</div>
          <div>UI/UX</div>
          <div>Design Studio</div>
        </div>
      </div>

      {/* contact button */}
      <button
        style={{
          position: 'absolute',
          bottom: '4rem',
          right: '4rem',
          padding: '0.75rem 1.25rem',
          borderRadius: 14,
          border: '1px solid rgba(255,255,255,0.08)',
          background: '#000',
          color: '#fff',
          letterSpacing: '.12em',
          textTransform: 'uppercase',
          fontFamily: 'Arial, sans-serif',
          cursor: 'pointer',
          zIndex: 20,
        }}
        onClick={() => (window.location.href = '/contact')}
      >
        Contact
      </button>
    </div>
  );
}
