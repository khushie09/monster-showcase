import { useEffect, useRef, useState } from 'react';
import { FLAVORS } from '../data.js';

const TWEEN = 1.25; // seconds for a full move between layouts

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function computeLayout() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const mobile = vw < 900;
  let cardH;
  let centerX;
  let centerY;
  if (mobile) {
    cardH = Math.min(vh * 0.4, 420);
    centerX = 0;
    centerY = vh * 0.13;
  } else {
    cardH = Math.min(vh * 0.74, 640);
    centerX = Math.min(vw * 0.18, 300);
    centerY = 0;
  }
  return { vw, vh, mobile, cardH, cardW: cardH * 0.8, centerX, centerY };
}

// Where card i should sit: a row of cards when nothing is selected,
// or the focused card in the centre with the others pushed to the sides.
function targetFor(i, sel, L) {
  const n = FLAVORS.length;
  if (sel < 0) {
    const off = i - (n - 1) / 2;
    const a = Math.abs(off);
    return {
      x: L.centerX + off * L.cardW * 0.62,
      y: L.centerY,
      z: -a * 90,
      s: L.mobile ? 0.82 - a * 0.05 : 0.9 - a * 0.05,
    };
  }
  const d = i - sel;
  if (d === 0) return { x: L.centerX, y: L.centerY, z: 160, s: 1 };
  const ad = Math.abs(d);
  return {
    x: L.centerX + d * L.cardW * 1.05,
    y: L.centerY,
    z: -320 - (ad - 1) * 120,
    s: 0.55,
  };
}

function rgbOf(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
}

// Fractal noise rendered once into a transparent texture, used for the smoke layers.
function makeSmoke(seedOffset) {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const g = c.getContext('2d');
  const img = g.createImageData(S, S);
  const d = img.data;
  const hash = (x, y) => {
    const h = Math.sin(x * 127.1 + y * 311.7 + seedOffset) * 43758.5453;
    return h - Math.floor(h);
  };
  const noise = (x, y) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi);
    const b = hash(xi + 1, yi);
    const cc = hash(xi, yi + 1);
    const dd = hash(xi + 1, yi + 1);
    return a + (b - a) * u + (cc - a) * v + (a - b - cc + dd) * u * v;
  };
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const nx = (x / S) * 4;
      const ny = (y / S) * 4;
      let v = 0;
      let amp = 0.5;
      let f = 1;
      for (let o = 0; o < 5; o++) {
        v += amp * noise(nx * f, ny * f);
        f *= 2;
        amp *= 0.5;
      }
      const a = Math.min(1, Math.max(0, (v - 0.42) * 1.8));
      const p = (y * S + x) * 4;
      d[p] = 255;
      d[p + 1] = 255;
      d[p + 2] = 255;
      d[p + 3] = a * 255;
    }
  }
  g.putImageData(img, 0, 0);
  return c.toDataURL('image/png');
}

// Random noise tile for the film-grain overlay.
function makeGrain() {
  const S = 160;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const g = c.getContext('2d');
  const img = g.createImageData(S, S);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = Math.random() * 255;
    d[i] = v;
    d[i + 1] = v;
    d[i + 2] = v;
    d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return c.toDataURL('image/png');
}

export default function Showcase({ selected, onSelect }) {
  const [L, setL] = useState(computeLayout);

  const rigRef = useRef(null);
  const worldRef = useRef(null);
  const spotRef = useRef(null);
  const smokeARef = useRef(null);
  const smokeBRef = useRef(null);
  const grainRef = useRef(null);
  const fxCanvasRef = useRef(null);
  const cardRefs = useRef([]);

  const selRef = useRef(selected);
  const layoutRef = useRef(L);
  const mouseRef = useRef({ mx: 0, my: 0, mxS: 0, myS: 0 });
  const spotXRef = useRef(0);
  const fxRef = useRef({ drops: [], pendingBurst: -1, burstDelay: 0, ambientT: 0, flashT: 0 });
  const cardsRef = useRef(
    FLAVORS.map(() => ({
      x: 0, y: 0, z: 0, s: 1,
      from: { x: 0, y: 0, z: 0, s: 1 },
      to: { x: 0, y: 0, z: 0, s: 1 },
      tw: 1,
      delay: 0,
    }))
  );

  // Keep the layout current on resize.
  useEffect(() => {
    const onResize = () => setL(computeLayout());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Snap cards to their positions whenever the layout changes.
  useEffect(() => {
    layoutRef.current = L;
    cardsRef.current.forEach((c, i) => {
      const t = targetFor(i, selRef.current, L);
      c.x = t.x; c.y = t.y; c.z = t.z; c.s = t.s;
      c.from = { x: t.x, y: t.y, z: t.z, s: t.s };
      c.to = { x: t.x, y: t.y, z: t.z, s: t.s };
      c.tw = 1;
      c.delay = 0;
    });
  }, [L]);

  // Intro: start the cards slightly back so they ease forward on load.
  useEffect(() => {
    cardsRef.current.forEach((c) => {
      c.z -= 400;
      c.s *= 0.8;
    });
    if (smokeARef.current) smokeARef.current.style.backgroundImage = `url(${makeSmoke(0)})`;
    if (smokeBRef.current) smokeBRef.current.style.backgroundImage = `url(${makeSmoke(91)})`;
    if (grainRef.current) grainRef.current.style.backgroundImage = `url(${makeGrain()})`;
  }, []);

  // Start a tween toward the new layout whenever the selection changes.
  useEffect(() => {
    selRef.current = selected;
    const Lnow = layoutRef.current;
    cardsRef.current.forEach((c, i) => {
      c.from = { x: c.x, y: c.y, z: c.z, s: c.s };
      c.to = targetFor(i, selected, Lnow);
      c.tw = 0;
      c.delay = selected < 0 ? 0 : Math.abs(i - selected) * 0.06;
    });
    if (selected >= 0) {
      fxRef.current.pendingBurst = selected;
      fxRef.current.burstDelay = 0.35;
    }
  }, [selected]);

  // The animation loop: card tweens, cursor parallax, spotlight, light sweep and splash.
  useEffect(() => {
    const fxCanvas = fxCanvasRef.current;
    const ctx = fxCanvas.getContext('2d');
    let raf = 0;
    let last = performance.now();

    const resizeFx = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      fxCanvas.width = Math.round(window.innerWidth * dpr);
      fxCanvas.height = Math.round(window.innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resizeFx();
    window.addEventListener('resize', resizeFx);

    const onMove = (e) => {
      const m = mouseRef.current;
      m.mx = (e.clientX / window.innerWidth) * 2 - 1;
      m.my = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onMove);

    const rectOf = (i) => cardRefs.current[i].getBoundingClientRect();

    const fireFlash = (i) => {
      const el = cardRefs.current[i] && cardRefs.current[i].querySelector('.flash');
      if (!el || !el.animate) return;
      el.animate(
        [
          { backgroundPosition: '130% 0', opacity: 0 },
          { opacity: 1, offset: 0.2 },
          { backgroundPosition: '-30% 0', opacity: 0 },
        ],
        { duration: 1500, delay: 0, easing: 'cubic-bezier(0.35, 0.7, 0.25, 1)' }
      );
      el.animate(
        [
          { backgroundPosition: '130% 0', opacity: 0 },
          { opacity: 0.6, offset: 0.25 },
          { backgroundPosition: '-30% 0', opacity: 0 },
        ],
        { duration: 1100, delay: 260, easing: 'ease-out' }
      );
    };

    const addDrop = (x, y, vx, vy, color, life) => {
      const fx = fxRef.current;
      if (fx.drops.length > 360) return;
      fx.drops.push({ x, y, vx, vy, r: 1.2 + Math.random() * 3, life, max: life, c: color });
    };
    const spawnBurst = (x, y, color, count) => {
      for (let k = 0; k < count; k++) {
        const ang = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
        const sp = 3 + Math.random() * 7;
        addDrop(x + (Math.random() - 0.5) * 30, y, Math.cos(ang) * sp, Math.sin(ang) * sp, color, 0.9 + Math.random() * 0.8);
      }
    };
    const spawnRing = (x, y, color, count) => {
      for (let k = 0; k < count; k++) {
        const ang = Math.random() * Math.PI * 2;
        const sp = 2 + Math.random() * 3;
        addDrop(x, y, Math.cos(ang) * sp, Math.sin(ang) * sp * 0.35 - 2, color, 0.6 + Math.random() * 0.5);
      }
    };

    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const m = mouseRef.current;
      const sel = selRef.current;
      const Lnow = layoutRef.current;

      m.mxS += (m.mx - m.mxS) * (1 - Math.exp(-dt * 2.6));
      m.myS += (m.my - m.myS) * (1 - Math.exp(-dt * 2.6));
      if (worldRef.current) {
        worldRef.current.style.transform =
          `translate3d(${(m.mxS * 14).toFixed(1)}px,${(m.myS * 8).toFixed(1)}px,0)`;
      }

      // cards
      cardsRef.current.forEach((c, i) => {
        if (c.delay > 0) c.delay -= dt;
        else if (c.tw < 1) c.tw = Math.min(1, c.tw + dt / TWEEN);
        const e = easeInOutCubic(c.tw);
        c.x = c.from.x + (c.to.x - c.from.x) * e;
        c.y = c.from.y + (c.to.y - c.from.y) * e;
        c.z = c.from.z + (c.to.z - c.from.z) * e;
        c.s = c.from.s + (c.to.s - c.from.s) * e;
        const el = cardRefs.current[i];
        if (el) {
          el.style.transform =
            `translate3d(${c.x.toFixed(1)}px,${c.y.toFixed(1)}px,${c.z.toFixed(1)}px) scale(${c.s.toFixed(3)})`;
        }
      });

      // spotlight glides to the centred card
      if (spotRef.current) {
        const target = window.innerWidth / 2 + (sel >= 0 ? cardsRef.current[sel].x : Lnow.centerX);
        spotXRef.current += (target - spotXRef.current) * (1 - Math.exp(-dt * 4));
        spotRef.current.style.left = `${spotXRef.current.toFixed(1)}px`;
        spotRef.current.classList.toggle('on', sel >= 0);
      }

      const fx = fxRef.current;

      // burst from the lid once the card has nearly arrived
      if (fx.pendingBurst >= 0) {
        fx.burstDelay -= dt;
        if (fx.burstDelay <= 0) {
          const i = fx.pendingBurst;
          const r = rectOf(i);
          const rgb = rgbOf(FLAVORS[i].accent);
          fireFlash(i);
          spawnBurst(r.left + r.width * 0.5, r.top + r.height * 0.08, rgb, 56);
          spawnRing(r.left + r.width * 0.5, r.bottom - r.height * 0.04, rgb, 30);
          fx.flashT = 3.4;
          fx.pendingBurst = -1;
        }
      }

      // while a can is focused: repeat the light sweep and add small splashes at its base
      if (sel >= 0) {
        fx.flashT -= dt;
        if (fx.flashT <= 0) {
          fireFlash(sel);
          fx.flashT = 3.4;
        }
        fx.ambientT -= dt;
        if (fx.ambientT <= 0) {
          fx.ambientT = 1.6 + Math.random() * 0.8;
          const r = rectOf(sel);
          spawnRing(
            r.left + r.width * (0.2 + Math.random() * 0.6),
            r.bottom - r.height * 0.03,
            rgbOf(FLAVORS[sel].accent),
            10
          );
        }
      }

      // draw droplets
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (let k = fx.drops.length - 1; k >= 0; k--) {
        const d = fx.drops[k];
        d.vy += 0.32 * dt * 60;
        d.vx *= Math.exp(-dt * 1.2);
        d.x += d.vx * dt * 60;
        d.y += d.vy * dt * 60;
        d.life -= dt;
        if (d.life <= 0 || d.y > window.innerHeight + 20) {
          fx.drops.splice(k, 1);
          continue;
        }
        const a = Math.max(0, d.life / d.max);
        const g = ctx.createRadialGradient(d.x - d.r * 0.35, d.y - d.r * 0.35, d.r * 0.1, d.x, d.y, d.r);
        g.addColorStop(0, `rgba(255,255,255,${(0.9 * a).toFixed(3)})`);
        g.addColorStop(0.45, `rgba(${d.c[0]},${d.c[1]},${d.c[2]},${(0.55 * a).toFixed(3)})`);
        g.addColorStop(1, `rgba(${d.c[0]},${d.c[1]},${d.c[2]},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resizeFx);
      window.removeEventListener('pointermove', onMove);
    };
  }, []);

  // Clicking empty space while a can is focused returns to the full lineup.
  const onRigClick = (e) => {
    if (!e.target.closest('.can') && selected >= 0) onSelect(-1);
  };

  return (
    <>
      <div className="smoke" ref={smokeARef} aria-hidden="true" />
      <div className="smoke b" ref={smokeBRef} aria-hidden="true" />
      <div className="spot" ref={spotRef} aria-hidden="true" />

      <div className="rig" ref={rigRef} onClick={onRigClick} aria-label="Monster Energy flavors">
        <div className="world" ref={worldRef}>
          {FLAVORS.map((f, i) => (
            <div
              key={f.id}
              className="can"
              ref={(el) => (cardRefs.current[i] = el)}
              style={{
                width: L.cardW,
                height: L.cardH,
                marginLeft: -L.cardW / 2,
                marginTop: -L.cardH / 2,
                '--c': f.accent,
              }}
              onClick={() => onSelect(i)}
            >
              <span className="halo" />
              <img src={f.src} alt={`${f.name} can`} draggable="false" />
              <span
                className="flash"
                style={{ maskImage: `url(${f.src})`, WebkitMaskImage: `url(${f.src})` }}
              />
              <span className="ground" />
            </div>
          ))}
        </div>
      </div>

      <div className="grain" ref={grainRef} aria-hidden="true" />
      <canvas className="fx" ref={fxCanvasRef} aria-hidden="true" />
    </>
  );
}
