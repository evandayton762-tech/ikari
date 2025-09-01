// app/routes/overview.jsx
import React, {useEffect} from 'react';

export const meta = () => [{title: 'Overview — Ikari'}];

export default function Overview() {
  useRevealOnScroll();
  return (
    <main style={pageStyle}>
      <style dangerouslySetInnerHTML={{__html: styles}} />
      <header className="reveal in" style={{textAlign: 'center', marginBottom: '2.5rem'}}>
        <div style={eyebrow}>IKARI STUDIO</div>
        <h1 style={title}>Overview</h1>
        <p style={lede}>
          Minimal art objects and canvas prints inspired by anime, science fiction,
          and the everyday pursuit of better design.
        </p>
      </header>
      <section className="reveal" style={section}>
        <h2 style={h2}>Why we exist</h2>
        <p style={p}>
          Ikari began as a small practice making paintings for friends. The founder grew up on anime
          and game art. That visual language shaped how we compose form, color, and texture.
          We build pieces that feel cinematic but live quietly on your wall.
        </p>
      </section>
      <section className="reveal" style={section}> 
        <h2 style={h2}>What we make</h2>
        <p style={p}>
          Limited originals and made‑to‑order canvas prints. Each piece uses archival‑grade materials
          and a controlled production pipeline. The shop is fully powered by Shopify Hydrogen.
        </p>
      </section>
      <section className="reveal" style={section}>
        <h2 style={h2}>Process</h2>
        <ul style={list}> 
          <li>Sketches and studies in digital + traditional workflows.</li>
          <li>Color and composition passes, informed by anime frames and film stills.</li>
          <li>Final paint, scan, and proofing. Prints are calibrated for depth and grain.</li>
        </ul>
      </section>
      <section className="reveal" style={section}>
        <h2 style={h2}>Materials</h2>
        <p style={p}>
          Cotton canvas, pigment inks, and FSC‑certified substrates. We optimize for longevity
          and texture before anything else.
        </p>
      </section>
      <footer className="reveal" style={{textAlign: 'center', marginTop: '2.5rem'}}>
        <a href="/shop" style={cta}>Browse the Catalog →</a>
      </footer>
    </main>
  );
}

function useRevealOnScroll() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.reveal'));
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) entry.target.classList.add('in'); });
    }, {threshold: 0.12});
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

const pageStyle = { minHeight: '100vh', color: '#fff', background: '#000', padding: '6rem 1.5rem 4rem', display:'flex', flexDirection:'column', alignItems:'center' };
const eyebrow = { fontFamily:'monospace', letterSpacing:'.18em', textTransform:'uppercase', opacity:0.6, fontSize:'.75rem' };
const title = { margin: '.25rem 0 0.5rem', fontSize: '3rem', letterSpacing: '.04em' };
const lede = { maxWidth: 820, margin:'0 auto', opacity:0.8, fontSize:'1.05rem', lineHeight:1.6 };
const section = { maxWidth:900, margin:'1.5rem auto 0', textAlign:'center' };
const h2 = { margin:'0 0 .5rem', letterSpacing:'.08em' };
const p = { margin:'0 auto', maxWidth:780, opacity:0.85, lineHeight:1.8, textAlign:'center' };
const list = { margin:'0.25rem auto 0', paddingLeft:0, opacity:0.85, lineHeight:1.8, listStylePosition:'inside', maxWidth:780, textAlign:'left' };
const cta = { display:'inline-block', marginTop:'.5rem', padding:'.8rem 1.2rem', color:'#000', background:'#ff4d00', border:'1px solid #ff864d', borderRadius:10, textDecoration:'none', letterSpacing:'.12em', textTransform:'uppercase' };
const styles = `.reveal{opacity:0;transform:translateY(18px);transition:opacity .5s ease,transform .6s ease}.reveal.in{opacity:1;transform:translateY(0)}`;
