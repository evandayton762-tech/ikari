// app/components/Catalog.jsx
import {Suspense, useRef, useEffect, useState} from 'react';
import {Canvas} from '@react-three/fiber';
import {useGLTF, useAnimations} from '@react-three/drei';
import ParticleEffect from './ParticleEffect';

function CategoryModel({modelUrl}) {
  const ref = useRef();
  const {scene, animations} = useGLTF(modelUrl);
  const {actions} = useAnimations(animations, ref);

  useEffect(() => {
    const [firstKey] = Object.keys(actions);
    if (actions[firstKey]) {
      actions[firstKey].reset().play();
    }
  }, [actions]);

  useEffect(() => {
    if (ref.current) {
      ref.current.position.y = -2;
      ref.current.rotation.y = 0.3;
    }
  }, []);

  return <primitive ref={ref} object={scene} />;
}

export default function Catalog() {
  const [selectedCategory, setSelectedCategory] = useState('dragon-ball');
  
  const categories = [
    {id: 'dragon-ball', name: 'Dragon Ball', model: '/models/goku.glb'},
    {id: 'abstract', name: 'Abstract', model: '/models/dragon-ball.glb'},
    {id: 'nature', name: 'Nature', model: '/models/dragon-ball.glb'},
    {id: 'urban', name: 'Urban', model: '/models/dragon-ball.glb'},
  ];

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#000',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Category Navigation */}
      <div style={{
        position: 'absolute',
        top: '2rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 20,
        display: 'flex',
        gap: '2rem'
      }}>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            style={{
              background: selectedCategory === cat.id ? '#fff' : 'transparent',
              color: selectedCategory === cat.id ? '#000' : '#fff',
              border: '1px solid #666',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer',
              textTransform: 'uppercase',
              fontSize: '0.875rem',
              letterSpacing: '0.1em'
            }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Three.js Scene */}
      <Canvas
        camera={{position: [0, 1.5, 3], fov: 15, near: 0.1, far: 100}}
        style={{width: '100%', height: '100%', touchAction: 'none'}}
      >
        <ParticleEffect count={400} radius={6} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 7]} intensity={1} />
        <Suspense fallback={null}>
          <CategoryModel 
            modelUrl={categories.find(c => c.id === selectedCategory)?.model || '/models/goku.glb'} 
          />
        </Suspense>
      </Canvas>

      {/* Category Title */}
      <h1 style={{
        position: 'absolute',
        bottom: '4rem',
        left: '4rem',
        color: '#fff',
        fontSize: '4rem',
        fontFamily: 'Arial Black, sans-serif',
        fontWeight: 900,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        margin: 0,
        zIndex: 10
      }}>
        {categories.find(c => c.id === selectedCategory)?.name}
      </h1>

      {/* Browse Products Button */}
      <button style={{
        position: 'absolute',
        bottom: '4rem',
        right: '4rem',
        background: 'transparent',
        color: '#fff',
        border: '1px solid #666',
        padding: '1rem 2rem',
        borderRadius: '4px',
        cursor: 'pointer',
        textTransform: 'uppercase',
        fontSize: '0.875rem',
        letterSpacing: '0.1em',
        zIndex: 10
      }}>
        Browse Products
      </button>
    </div>
  );
}
