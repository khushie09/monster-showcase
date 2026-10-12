import { useCallback, useEffect, useState } from 'react';
import Showcase from './components/Showcase.jsx';
import Dock from './components/Dock.jsx';
import { FLAVORS, DEFAULT_ACCENT } from './data.js';
import { useSwapText } from './hooks/useSwapText.js';

const N = FLAVORS.length;

export default function App() {
  // -1 = full lineup, otherwise the index of the focused flavor
  const [selected, setSelected] = useState(-1);

  // Clicking the focused can again returns to the lineup.
  const choose = useCallback((i) => setSelected((prev) => (i === prev ? -1 : i)), []);
  const explore = () => setSelected((p) => (p < 0 ? 0 : p));
  const next = () => setSelected((p) => (p < 0 ? 0 : (p + 1) % N));
  const prev = () => setSelected((p) => (p < 0 ? N - 1 : (p - 1 + N) % N));

  const flavor = selected >= 0 ? FLAVORS[selected] : null;

  // Accent colour follows the focused flavor.
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', flavor ? flavor.accent : DEFAULT_ACCENT);
  }, [flavor]);

  // Keyboard: arrows move between flavors, Escape returns to the lineup.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'Escape') setSelected(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Enable the entrance transitions once the page is mounted.
  useEffect(() => {
    const id = requestAnimationFrame(() => document.body.classList.add('ready'));
    return () => cancelAnimationFrame(id);
  }, []);

  // Headline copy, with fade transitions.
  const [eyebrowText, eyebrowOut] = useSwapText(flavor ? flavor.name.toUpperCase() : 'UNLEASH MORE');
  const [ledeKey, ledeOut] = useSwapText(flavor ? flavor.id : 'default');
  const ledeFlavor = FLAVORS.find((f) => f.id === ledeKey);

  // Description and feature tags for the focused flavor.
  const [descKey, descOut] = useSwapText(flavor ? flavor.id : 'none');
  const descFlavor = FLAVORS.find((f) => f.id === descKey);

  return (
    <>
      <div className="glow" aria-hidden="true" />
      <div className="wm" aria-hidden="true">MONSTER</div>
      <div className="floorglow" aria-hidden="true" />

      <Showcase selected={selected} onSelect={choose} />

      <header className="nav">
        <div className="brand">
          <svg viewBox="0 0 34 38" aria-hidden="true">
            <path d="M2 2h8l-2 30-4-4z" />
            <path d="M13 2h8l-1 34-4-6z" />
            <path d="M24 2h8l-6 26-2-6z" />
          </svg>
          <div>
            <div className="brand-word">MONSTER</div>
            <div className="brand-sub">ENERGY</div>
          </div>
        </div>
        <nav className="links">
          <button className="on" onClick={() => setSelected(-1)}>FLAVORS</button>
          <span>ENERGY</span>
          <span>STORY</span>
          <span>SHOP</span>
        </nav>
      </header>

      <section className="copy">
        <p className={`eyebrow swap${eyebrowOut ? ' out' : ''}`}>{eyebrowText}</p>
        <h1 className="headline">
          <span>Energy</span>
          <span className="l2">
            in every <em>color</em>
          </span>
        </h1>
        <p className={`lede swap${ledeOut ? ' out' : ''}`}>
          {ledeFlavor ? (
            <>
              {ledeFlavor.name}.<br />
              {ledeFlavor.tag}
            </>
          ) : (
            <>
              Same relentless energy.
              <br />
              Different flavors. Find your color.
            </>
          )}
        </p>

        <div className={`desc${flavor ? ' show' : ''}`}>
          <p className={`desc-text swap${descOut ? ' out' : ''}`}>{descFlavor ? descFlavor.desc : ''}</p>
          <div className="chips">
            {descFlavor &&
              descFlavor.chips.map((c) => (
                <span key={c} className="chip">
                  {c}
                </span>
              ))}
          </div>
        </div>

        <button className="cta" onClick={explore}>
          EXPLORE FLAVORS &rarr;
        </button>
      </section>

      <div className="hint">MOVE YOUR CURSOR</div>
      <Dock selected={selected} onSelect={choose} onPrev={prev} onNext={next} />
    </>
  );
}
