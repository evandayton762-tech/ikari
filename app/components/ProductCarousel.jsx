import React from 'react';

export default function ProductCarousel({images = []}) {
  const [index, setIndex] = React.useState(0);
  const has = images && images.length > 0;
  if (!has) return null;

  const clamp = (i) => (i + images.length) % images.length;
  const prev = () => setIndex((i) => clamp(i - 1));
  const next = () => setIndex((i) => clamp(i + 1));

  return (
    <div style={{position: 'relative', height: '100%'}}>
      <div style={{position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 12}}>
        {images.map((img, i) => (
          <img
            key={img.url + i}
            src={img.url}
            alt={img.altText || 'Product image'}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%', objectFit: 'cover',
              opacity: i === index ? 1 : 0, transition: 'opacity .35s ease',
            }}
          />
        ))}
      </div>
      <button type="button" aria-label="Previous image" onClick={prev} style={arrowBtn}>‹</button>
      <button type="button" aria-label="Next image" onClick={next} style={{...arrowBtn, right: 8}}>›</button>
      <div style={{position:'absolute', bottom: 8, left: 0, right: 0, display:'flex', justifyContent:'center', gap: 6}}>
        {images.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to image ${i+1}`}
            onClick={() => setIndex(i)}
            style={{width:8, height:8, borderRadius:'50%', border:'none', background: i===index?'#fff':'rgba(255,255,255,0.5)', cursor:'pointer'}}
          />
        ))}
      </div>
    </div>
  );
}

const arrowBtn = {
  position: 'absolute', top: '50%', left: 8, transform: 'translateY(-50%)',
  background: 'rgba(0,0,0,0.45)', color: '#fff', border: '1px solid rgba(255,255,255,0.5)',
  borderRadius: 8, width: 36, height: 36, cursor: 'pointer'
};

