import React, {Suspense} from 'react';
import {Canvas} from '@react-three/fiber';
import ParticleEffect from '~/components/ParticleEffect';

export default function GlobalParticles() {
  const prefersReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 1,
      }}
    >
      {!prefersReduced && (
      <Canvas
        gl={{alpha: true, antialias: true}}
        dpr={[1, 1.5]}
        camera={{position: [0, 0, 6], fov: 45}}
        style={{width: '100%', height: '100%'}}
      >
        <ambientLight intensity={0.6} />
        <Suspense fallback={null}>
          <ParticleEffect count={900} radius={6} />
        </Suspense>
      </Canvas>
      )}
    </div>
  );
}
