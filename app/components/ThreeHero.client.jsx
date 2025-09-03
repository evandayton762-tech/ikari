// app/components/ThreeHero.client.jsx
import React, { Suspense, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import ParticleEffect from './ParticleEffect';
import GokuTrail from '~/components/GokuTrail';

function GokuModel() {
  const ref = useRef();
  // ✅ load from the public/models folder
  const { scene, animations } = useGLTF('/models/goku.glb');
  const { actions } = useAnimations(animations, ref);

  // Play the first animation clip on load
  useEffect(() => {
    const [ firstKey ] = Object.keys(actions);
    if (actions[firstKey]) {
      actions[firstKey].reset().play();
    }
  }, [actions]);

  // Lower the model so camera focuses on torso/head
  useEffect(() => {
    if (ref.current) {
      ref.current.position.y = -5.2;
      ref.current.rotation.x  = -1.15; // in radians (~-15°)
      ref.current.rotation.y  = -0.15;
    }
  }, []);

  return <primitive ref={ref} object={scene} />;
}

export default function ThreeHero() {
  return (
    <Canvas
      camera={{ position: [0, 1.5, 1], fov: 10, near: 0.1, far: 100 }}
      style={{ width: '100%', height: '100%' }}
    >
      {/* particle background */}
      <ParticleEffect count={999} radius={4.5} />

      {/* lights */}
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 10, 7]} intensity={1} />

      {/* suspense for GLTF */}
      <Suspense fallback={null}>
        <GokuModel />
        <GokuTrail />
      </Suspense>
    </Canvas>
  );
}
