// app/routes/contact.jsx
import React from 'react';

export const meta = () => [{title: 'Contact — Ikari'}];

export default function Contact() {
  return (
    <main style={page}>
      <section style={card}>
        <div style={eyebrow}>IKARI</div>
        <h1 style={title}>Contact</h1>
        <p style={lede}>We’re a small studio. Email is the best way to reach us.</p>

        <div style={{marginTop: '1.25rem'}}>
          <a href="mailto:ikarihelp@gmail.com" style={link}>ikarihelp@gmail.com</a>
        </div>
        <div style={{marginTop: '.35rem', opacity: 0.7, fontSize: '.9rem'}}>
          No phone support at this time.
        </div>

        <div style={{marginTop: '1.5rem', opacity: 0.7, fontSize: '.9rem'}}>
          We typically reply within 24–48 hours (Mon–Fri).
        </div>

        <a href="/shop" style={cta}>Browse the Catalog →</a>
      </section>
    </main>
  );
}

const page = {
  minHeight: '100vh',
  background: '#000',
  color: '#fff',
  display: 'grid',
  placeItems: 'center',
  padding: '4rem 1.5rem',
};

const card = {
  textAlign: 'center',
  maxWidth: 720,
};

const eyebrow = {
  fontFamily: 'monospace',
  letterSpacing: '.18em',
  textTransform: 'uppercase',
  opacity: 0.6,
  fontSize: '.75rem',
};

const title = {
  margin: '.25rem 0 .5rem',
  fontSize: '3rem',
  letterSpacing: '.04em',
};

const lede = {
  opacity: 0.8,
  fontSize: '1.05rem',
  lineHeight: 1.6,
};

const link = {
  color: '#ff4d00',
  textDecoration: 'none',
  borderBottom: '1px dashed #ff864d',
  paddingBottom: '2px',
};

const cta = {
  display: 'inline-block',
  marginTop: '1.75rem',
  padding: '.8rem 1.2rem',
  color: '#000',
  background: '#ff4d00',
  border: '1px solid #ff864d',
  borderRadius: 10,
  textDecoration: 'none',
  letterSpacing: '.12em',
  textTransform: 'uppercase',
};

