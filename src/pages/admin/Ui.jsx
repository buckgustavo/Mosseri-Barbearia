// Os dois estados que todo painel desenha igual: erro em vermelho e a espera
// antes dos dados chegarem.
export function Erro({ children }) {
  if (!children) return null;
  return <p className="form-erro">{children}</p>;
}

export function Estado({ carregando, vazio, children }) {
  if (carregando) return <p className="hint">Carregando…</p>;
  if (vazio) return <p className="hint">{vazio}</p>;
  return children;
}
