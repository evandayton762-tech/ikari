import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

export default function GokuTrail() {
  const { camera, size } = useThree();
  const gokuRef = useRef();
  const cursorTarget = useRef(new THREE.Vector3());
  const cursorCurrent = useRef(new THREE.Vector3());

  const { scene } = useGLTF('/models/nimbus.glb');

  useEffect(() => {
    const move = e => {
      const x = (e.clientX / size.width) * 2 - 1;
      const y = -(e.clientY / size.height) * 2 + 1;
      cursorTarget.current.set(x, y, 0.5).unproject(camera);
    };
    window.addEventListener('pointermove', move);
    return () => window.removeEventListener('pointermove', move);
  }, [camera, size]);

  useFrame(() => {
    cursorCurrent.current.lerp(cursorTarget.current, 0.1);
    if (gokuRef.current) {
      gokuRef.current.position.copy(cursorCurrent.current);
      const dir = new THREE.Vector3().subVectors(cursorTarget.current, cursorCurrent.current);
      gokuRef.current.rotation.set(dir.y * 0.3, Math.atan2(dir.x, dir.z), -dir.x * 0.3);
    }
  });

  return (
    <primitive object={scene.clone()} ref={gokuRef} scale={0.005} />
  );
}
