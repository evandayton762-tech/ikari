// app/components/ThreeScene.client.jsx
import React, {useEffect, useState} from 'react';
import {Canvas} from '@react-three/fiber';
import {OrbitControls, PerspectiveCamera} from '@react-three/drei';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';

function ClientOnly({children}) {
  return import.meta.env.SSR ? null : children;
}

function GokuModel() {
  const [model, setModel] = useState(null);
  useEffect(() => {
    new GLTFLoader().load(
      '/models/goku.glb',
      (gltf) => setModel(gltf.scene),
      undefined,
      console.error
    );
  }, []);
  if (!model) return null;
  return <primitive object={model} scale={[3,3,3]} position={[0,-2,0]} />;
}

export default function ThreeScene() {
  return (
    <ClientOnly>
      <Canvas>
        <PerspectiveCamera makeDefault position={[0,1.5,5]}/>
        <ambientLight intensity={0.3}/>
        <directionalLight position={[10,10,5]} intensity={0.7}/>
        <directionalLight position={[-10,-10,-5]} intensity={0.3}/>
        <GokuModel/>
        <OrbitControls 
          enableZoom={false} 
          autoRotate 
          autoRotateSpeed={0.5} 
          enablePan={false}
        />
      </Canvas>
    </ClientOnly>
  );
}
