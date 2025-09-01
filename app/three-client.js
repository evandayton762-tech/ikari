// app/entry.client.jsx
import { RemixBrowser } from '@remix-run/react';
import { startTransition, StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <RemixBrowser />
    </StrictMode>
  );
});

// Mount Three.js scene after hydration
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', async () => {
    const mountPoint = document.getElementById('three-mount');
    if (mountPoint) {
      const { mountThreeScene } = await import('./components/three-scene-mounter');
      mountThreeScene(mountPoint);
    }
  });
}