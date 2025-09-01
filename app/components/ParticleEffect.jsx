// app/components/ParticleEffect.jsx
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function ParticleEffect({ count = 600, radius = 5 }) {
  const groupRef = useRef();

  // Prepare 3 layers: half small, 30% medium, 20% large
  const layers = useMemo(() => {
    const layers = [];
    const specs = [
      { fraction: 0.5, size: 0.01 },
      { fraction: 0.3, size: 0.02 },
      { fraction: 0.2, size: 0.03 },
    ];
    specs.forEach(({ fraction, size }) => {
      const n = Math.floor(count * fraction);
      const pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        // random point in a sphere
        const u = Math.random();
        const v = Math.random();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);
        const r = radius * Math.cbrt(Math.random());
        pos[3*i]     = r * Math.sin(phi) * Math.cos(theta);
        pos[3*i + 1] = r * Math.sin(phi) * Math.sin(theta);
        pos[3*i + 2] = r * Math.cos(phi);
      }
      layers.push({ positions: pos, size, count: n });
    });
    return layers;
  }, [count, radius]);

  // gentle slow rotation
  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.005;
  });

  return (
    <group ref={groupRef}>
      {layers.map((layer, idx) => (
        <points key={idx}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              array={layer.positions}
              count={layer.count}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            size={layer.size}
            color={new THREE.Color(0xffffff)}
            transparent
            opacity={0.6}
            sizeAttenuation
          />
        </points>
      ))}
    </group>
  );
}
