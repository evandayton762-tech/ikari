// app/components/Nav.jsx
import React from 'react';
import { Link } from '@remix-run/react';

class TextScramble {
  constructor(el) {
    this.el = el;
    this.chars = '!<>-_\\/[]{}—=+*^?#________';
    this.update = this.update.bind(this);
  }
  setText(newText) {
    const oldText = this.el.innerText;
    const length = Math.max(oldText.length, newText.length);
    const promise = new Promise((r) => (this.resolve = r));
    this.queue = [];
    for (let i = 0; i < length; i++) {
      const from  = oldText[i] || '';
      const to    = newText[i] || '';
      const start = Math.floor(Math.random() * 80);
      const end   = start + Math.floor(Math.random() * 80);
      this.queue.push({ from, to, start, end, char: null });
    }
    cancelAnimationFrame(this.frameRequest);
    this.frame = 0;
    this.update();
    return promise;
  }
  update() {
    let output = '';
    let complete = 0;
    for (let i = 0; i < this.queue.length; i++) {
      let { from, to, start, end, char } = this.queue[i];
      if (this.frame >= end) {
        complete++;
        output += to;
      } else if (this.frame >= start) {
        if (!char || Math.random() < 0.28) {
          char = this.randomChar();
          this.queue[i].char = char;
        }
        output += `<span class="dud">${char}</span>`;
      } else {
        output += from;
      }
    }
    this.el.innerHTML = output;
    if (complete === this.queue.length) {
      this.resolve();
    } else {
      this.frameRequest = requestAnimationFrame(this.update);
      this.frame++;
    }
  }
  randomChar() {
    return this.chars[Math.floor(Math.random() * this.chars.length)];
  }
}

export default function Nav({color = '#fff', invertLogo = color !== '#000'}) {
  const leftLinks  = [ ['Catalog','/catalog'], ['Shop All','/shop'] ];
  const rightLinks = [ ['Contact','/contact'], ['Overview','/overview'] ];

  return (
    <div
      style={{
        position: 'absolute',
        top: '.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        zIndex: 200,
      }}
    >
      <ul style={listStyle}>
        {leftLinks.map(([label, to], i) => (
          <li key={to}>
            <Link to={to} style={anchorStyle}>
              <ScrambleText text={label} color={color} />
            </Link>
          </li>
        ))}
      </ul>

      <div style={{ margin: '0 2rem' }}>
        <Link to="/" style={anchorStyle}>
          <img
            src="/logo.png"
            alt="Ikari"
            style={{
              width: '3rem',
              height: '3rem',
              marginTop: '.2em',
              filter: invertLogo ? 'invert(100%)' : 'none',
            }}
          />
        </Link>
      </div>

      <ul style={listStyle}>
        {rightLinks.map(([label, to], i) => (
          <li key={to}>
            <Link to={to} style={anchorStyle}>
              <ScrambleText text={label} color={color} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

const listStyle = {
  display: 'flex',
  gap: '2rem',
  margin: 0,
  padding: 0,
  listStyle: 'none',
};

const FIXED_LINK_WIDTH_CH = 12; // keep width steady during animation

const anchorStyle = {
  textDecoration: 'none',
  color: 'inherit',
};

const linkStyle = {
  textDecoration: 'none',
  fontFamily: 'var(--font-heading)',
  textTransform: 'uppercase',
  fontSize: '0.825rem',
  letterSpacing: '0.15em',
  cursor: 'pointer',
  display: 'inline-block',
  width: `${FIXED_LINK_WIDTH_CH}ch`,
  textAlign: 'center',
  whiteSpace: 'nowrap',
  fontVariantLigatures: 'none',
};

function ScrambleText({text, color}) {
  const [display, setDisplay] = React.useState(text);
  const raf = React.useRef();
  const running = React.useRef(false);
  const CHARS = '!<>-_\\/[]{}—=+*^?#________';
  const DURATION = 500; // ms

  const start = () => {
    if (running.current) return;
    running.current = true;
    const startTime = performance.now();
    const len = text.length;
    const loop = (now) => {
      const t = Math.min(1, (now - startTime) / DURATION);
      const reveal = Math.floor(t * len);
      let out = '';
      for (let i = 0; i < len; i++) {
        out += i < reveal ? text[i] : CHARS[(Math.random() * CHARS.length) | 0];
      }
      setDisplay(out);
      if (t < 1) raf.current = requestAnimationFrame(loop);
      else {
        setDisplay(text);
        running.current = false;
      }
    };
    raf.current = requestAnimationFrame(loop);
  };

  const stop = () => {
    if (raf.current) cancelAnimationFrame(raf.current);
    running.current = false;
    setDisplay(text);
  };

  return (
    <span
      onMouseEnter={start}
      onMouseLeave={stop}
      style={{...linkStyle, color}}
    >
      {display}
    </span>
  );
}
