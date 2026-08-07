import glyph from "../assets/mosseri-glyph.svg";

// A marca acompanha o tamanho da fonte do lockup (altura em `em`), então a
// proporção entre infinito e letreiro fica igual no cabeçalho e no rodapé.
// `circle` é a variante em disco azul, que precisa de tamanho próprio.
export default function Logo({ withText = true, circle = false, size = 36 }) {
  return (
    <span className="logo">
      <span
        className={circle ? "logo-mark logo-mark-circle" : "logo-mark"}
        style={circle ? { width: size, height: size } : undefined}
      >
        <img src={glyph} alt="Mosseri" />
      </span>
      {withText && "Mosseri"}
    </span>
  );
}
