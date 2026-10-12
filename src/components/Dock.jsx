import { FLAVORS } from '../data.js';

export default function Dock({ selected, onSelect, onPrev, onNext }) {
  return (
    <nav className="dock" aria-label="Flavor selector">
      <button className="arrow" onClick={onPrev} aria-label="Previous flavor">
        &lsaquo;
      </button>
      <div id="thumbs">
        {FLAVORS.map((f, i) => (
          <button
            key={f.id}
            className={`thumb${selected === i ? ' on' : ''}`}
            style={{ '--c': f.accent }}
            aria-label={f.name}
            onClick={() => onSelect(i)}
          >
            <img alt="" src={f.src} />
            <span>{f.short}</span>
          </button>
        ))}
      </div>
      <button className="arrow" onClick={onNext} aria-label="Next flavor">
        &rsaquo;
      </button>
    </nav>
  );
}
