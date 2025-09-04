// app/routes/_index.jsx
import React, {useEffect, useState, lazy, Suspense} from 'react';
const webframeUrl = '/webframe2.png';

// ClientOnly guard
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
            letterSpacing: '0.1em',
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
          if (typeof window !== 'undefined') window.location.href = '/contact';
        }}
      >
        Contact
      </button>

      {/* three scene (client-only, embedded) */}
      <ClientOnly>
        <div id="three-container" style={{position:'absolute', inset:0, width:'100%', height:'100%', zIndex:5}}>
          <Suspense fallback={null}>
            <ThreeHero />
          </Suspense>
        </div>
      </ClientOnly>
    </div>
  );
}

const ThreeHero = lazy(() => import('~/components/ThreeHero.client'));
