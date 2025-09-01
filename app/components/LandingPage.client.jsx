// app/components/LandingPage.client.jsx
import { Suspense, lazy } from 'react';

// Dynamically import ThreeHero to avoid SSR issues
const ThreeHero = lazy(() => import('./ThreeHero.client'));

export default function LandingPage() {
  return (
    <div id="hero-container">
      <Suspense fallback={<div className="loading">Loading...</div>}>
        <ThreeHero />
      </Suspense>

      {/* PNG Overlay Frame */}
      <img
        src="/webframe.png"
        alt="Frame Overlay"
        className="absolute inset-0 w-full h-full pointer-events-none z-50"
      />

      {/* Giant title at top - COSMOS STUDIO style */}
      <h1 
        id="hero-headline"
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                   text-[12vw] leading-[0.8] font-black tracking-tighter text-white 
                   uppercase text-center pointer-events-none z-10"
        style={{ fontFamily: 'Arial Black, sans-serif' }}>
        IKARI
      </h1>

      {/* Small text elements */}
      <div className="absolute top-48 left-24 text-gray-400 text-xs uppercase tracking-wider z-20">
        <div className="text-gray-500 mb-1">Since</div>
        <div className="text-white">2018</div>
      </div>

      <div className="absolute top-48 right-24 text-gray-400 text-xs uppercase tracking-wider text-right z-20">
        <div className="text-gray-500 mb-1">Creating</div>
        <div className="text-white">Memorable</div>
        <div className="text-white">Digital</div>
        <div className="text-white">Experiences</div>
      </div>

      {/* Bottom-left text */}
      <div className="absolute bottom-12 left-12 z-20">
        <div className="text-white uppercase text-sm tracking-wider leading-tight">
          <div>Creative</div>
          <div>UI/UX</div>
          <div>Design Studio</div>
        </div>
      </div>

      {/* Bottom-right circular contact button */}
      <button
        className="absolute bottom-12 right-12 w-32 h-32 rounded-full 
                   border border-gray-600 flex items-center justify-center 
                   text-white uppercase text-sm tracking-wider 
                   hover:bg-white hover:text-black transition-all duration-300 
                   z-20 cursor-pointer enter-button"
        onClick={() => window.dispatchEvent(new Event("startAnim"))}
      >
        Contact
      </button>
    </div>
  );
}