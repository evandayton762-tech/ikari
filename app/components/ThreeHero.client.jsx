// app/components/ThreeHero.client.jsx
import React, { Suspense, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import ParticleEffect from './ParticleEffect';
import GokuTrail from '~/components/GokuTrail';
import '~/assets/preserve-glbs'; // <- so Vite/Oxygen doesn't tree-shake it


import gokuUrl from '~/assets/models/goku.glb?url';

function GokuModel() {
  const ref = useRef();
  const { scene, animations } = useGLTF(gokuUrl);
  const { actions } = useAnimations(animations, ref);

  useEffect(() => {
    const [ firstKey ] = Object.keys(actions);
    if (actions[firstKey]) {
      actions[firstKey].reset().play();
    }
  }, [actions]);

  useEffect(() => {
    if (ref.current) {
      ref.current.position.y = -5.2;
      ref.current.rotation.x  = -1.15;
      ref.current.rotation.y  = -.15;
    }
  }, []);

  return <primitive ref={ref} object={scene} />;
}

export default function ThreeHero() {
  if (typeof window === 'undefined') return null;

  return (
    <Canvas
      camera={{ position: [0, 1.5, 1], fov: 10, near: 0.1, far: 100 }}
      style={{ width: '100%', height: '100%' }}
    >
      <ParticleEffect count={999} radius={4.5} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 10, 7]} intensity={1} />
      <Suspense fallback={null}>
        <GokuModel />
        <GokuTrail />
      </Suspense>
    </Canvas>
  );
}
