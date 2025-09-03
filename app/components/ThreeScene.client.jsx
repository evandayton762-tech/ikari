// app/components/ThreeScene.client.jsx
/* eslint-disable react/no-unknown-property */
/* eslint-disable react/no-unused-vars */
/* eslint-disable no-console */
import React, {useEffect, useState} from 'react';
import {Canvas} from '@react-three/fiber';
import {OrbitControls, PerspectiveCamera} from '@react-three/drei';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';

// Guard to skip this entire component during SSR
function ClientOnlyRenderer({children}) {
  if (import.meta.env.SSR) {
    return null;
  }
  return children;
}

function GokuModel() {
  const [model, setModel] = useState(null);

  useEffect(() => {
    new GLTFLoader().load(
      '/models/goku.glb',            // 🔥 correct public path
      (gltf) => setModel(gltf.scene),
      undefined,
      (err) => console.error(err)
    );
  }, []);

  if (!model) return null;
  return <primitive object={model} scale={[3, 3, 3]} position={[0, -2, 0]} />;
}

export default function ThreeScene() {
  return (
    <ClientOnlyRenderer>
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 1.5, 5]} />
        <ambientLight intensity={0.3} />
        <directionalLight position={[10, 10, 5]} intensity={0.7} />
        <directionalLight position={[-10, -10, -5]} intensity={0.3} />
        <GokuModel />
        <OrbitControls
          enableZoom={false}
          autoRotate
          autoRotateSpeed={0.5}
          enablePan={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.5}
        />
      </Canvas>
    </ClientOnlyRenderer>
  );
}
