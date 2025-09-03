// app/components/ThreeHero.client.jsx
import React, { Suspense, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, useAnimations, OrbitControls } from '@react-three/drei';

// Import your GLB via Vite’s `?url` so it gets served from /models and fingerprinted.
import gokuUrl from '/models/goku.glb?url';

function GokuModel() {
  const ref = useRef();
  // Load the model from the fingerprinted URL
  const { scene, animations } = useGLTF(gokuUrl);
  const { actions } = useAnimations(animations, ref);

  useEffect(() => {
    const [first] = Object.keys(actions);
    actions[first]?.reset().play();
  }, [actions]);

  useEffect(() => {
    if (ref.current) {
      ref.current.position.y = -5.2;
      ref.current.rotation.x = -1.15;
      ref.current.rotation.y = -0.15;
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
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 10, 7]} intensity={1} />

      <Suspense fallback={null}>
        <GokuModel />
      </Suspense>

      <OrbitControls
        enableZoom={false}
        autoRotate
        autoRotateSpeed={0.5}
        enablePan={false}
      />
    </Canvas>
  );
}
