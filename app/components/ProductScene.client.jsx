import React, {Suspense, useMemo, useRef, useState} from 'react';
import {Canvas, useFrame} from '@react-three/fiber';
import {useTexture} from '@react-three/drei';
import {SRGBColorSpace, ClampToEdgeWrapping, LinearFilter} from 'three';

function CanvasPanel({url, depth = 0.14}) {
  const texture = useTexture(url);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;

  // Keep aspect ratio by scaling plane based on image dims
  const scale = useMemo(() => {
    const img = texture.image;
    if (!img?.width || !img?.height) return [1, 1, 1];
    const ar = img.width / img.height;
    return ar >= 1 ? [ar, 1, 1] : [1, 1 / ar, 1];
  }, [texture.image]);

  // Interactive rotation with drag and inertial damping
  const group = useRef();
  const stateRef = useRef({vx: 0, vy: 0, dragging: false, px: 0, py: 0});
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const s = stateRef.current;
    if (!s.dragging) {
      // Apply damping when not dragging
      s.vx *= 0.92;
      s.vy *= 0.92;
      g.rotation.y += s.vx;
      g.rotation.x += s.vy;
      // Ease back to neutral slightly
      g.rotation.x *= 0.96;
      g.rotation.y *= 0.96;
    }
    // Clamp rotation so it doesn't flip
    g.rotation.x = Math.max(-0.5, Math.min(0.5, g.rotation.x));
    g.rotation.y = Math.max(-0.6, Math.min(0.6, g.rotation.y));
  });

  function onPointerDown(e) {
    e.stopPropagation();
    const s = stateRef.current;
    s.dragging = true;
    s.px = e.clientX;
    s.py = e.clientY;
    e.target.setPointerCapture?.(e.pointerId);
  }
  function onPointerMove(e) {
    const g = group.current;
    if (!g) return;
    const s = stateRef.current;
    if (!s.dragging) return;
    const dx = e.clientX - s.px;
    const dy = e.clientY - s.py;
    s.px = e.clientX;
    s.py = e.clientY;
    const rotY = dx * 0.005;
    const rotX = dy * 0.005;
    g.rotation.y += rotY;
    g.rotation.x += rotX;
    s.vx = rotY;
    s.vy = rotX;
  }
  function onPointerUp(e) {
    const s = stateRef.current;
    s.dragging = false;
    e.target.releasePointerCapture?.(e.pointerId);
  }

  // Build side slice textures that stretch the edge pixel around the sides
  const slices = useMemo(() => {
    const img = texture.image;
    if (!img?.width || !img?.height) return null;
    const sx = 1 / img.width;
    const sy = 1 / img.height;
    function slice(offsetX, offsetY, repeatX, repeatY) {
      const t = texture.clone();
      t.wrapS = ClampToEdgeWrapping;
      t.wrapT = ClampToEdgeWrapping;
      t.magFilter = LinearFilter;
      t.offset.set(offsetX, offsetY);
      t.repeat.set(repeatX, repeatY);
      t.needsUpdate = true;
      return t;
    }
    return {
      left: slice(0, 0, sx, 1),
      right: slice(1 - sx, 0, sx, 1),
      top: slice(0, 1 - sy, 1, sy),
      bottom: slice(0, 0, 1, sy),
    };
  }, [texture]);

  return (
    <group
      ref={group}
      scale={scale}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Front face */}
      <mesh position={[0, 0, depth / 2]}>
        <planeGeometry args={[1, 1, 1, 1]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      {/* Back face (muted) */}
      <mesh position={[0, 0, -depth / 2]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1, 1, 1, 1]} />
        <meshStandardMaterial color="#0f0f0f" roughness={0.95} metalness={0.0} />
      </mesh>

      {/* Left side: stretch leftmost column */}
      {slices && (
        <mesh position={[-0.5, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[depth, 1, 1, 1]} />
          <meshBasicMaterial map={slices.left} toneMapped={false} />
        </mesh>
      )}
      {/* Right side: stretch rightmost column */}
      {slices && (
        <mesh position={[0.5, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[depth, 1, 1, 1]} />
          <meshBasicMaterial map={slices.right} toneMapped={false} />
        </mesh>
      )}
      {/* Top side: stretch top row */}
      {slices && (
        <mesh position={[0, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1, depth, 1, 1]} />
          <meshBasicMaterial map={slices.top} toneMapped={false} />
        </mesh>
      )}
      {/* Bottom side: stretch bottom row */}
      {slices && (
        <mesh position={[0, -0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1, depth, 1, 1]} />
          <meshBasicMaterial map={slices.bottom} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}

export default function ProductScene({textureUrl, width, height}) {
  return (
    <Canvas
      style={{width: '100%', height: '100%', cursor: 'grab'}}
      gl={{alpha: true, antialias: true, preserveDrawingBuffer: false}}
      dpr={[1, 1.5]}
      camera={{position: [0, 0, 2], fov: 50}}
    >
      <Suspense fallback={null}>
        <CanvasPanel url={textureUrl} />
      </Suspense>
      <ambientLight intensity={1.1} />
      <directionalLight position={[2, 2, 3]} intensity={0.5} />
      <pointLight position={[0.8, 0.6, 1.2]} intensity={0.6} />
      <pointLight position={[-0.8, -0.6, 1.2]} intensity={0.6} />
    </Canvas>
  );
}
