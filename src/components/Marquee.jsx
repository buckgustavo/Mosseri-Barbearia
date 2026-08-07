export default function Marquee({ text }) {
  // Duas cópias idênticas deslizando -50% dão um loop sem emenda: quando a
  // primeira sai, a segunda já está exatamente na posição inicial dela.
  const run = Array.from({ length: 4 }, (_, i) => (
    <span key={i}>
      {text}
      <span className="marquee-dot">·</span>
    </span>
  ));

  return (
    <div className="marquee">
      <div className="marquee-track">
        <span className="marquee-run">{run}</span>
        <span className="marquee-run" aria-hidden="true">
          {run}
        </span>
      </div>
    </div>
  );
}
