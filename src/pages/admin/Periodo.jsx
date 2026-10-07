import { periodoPronto } from "./comum";

const ATALHOS = [["hoje", "Hoje"], ["7dias", "7 dias"], ["mes", "Este mês"], ["passado", "Mês passado"]];

// Barra de período compartilhada com o estoque: atalhos + as duas datas.
export default function Periodo({ periodo, setPeriodo }) {
  const ativo = ATALHOS.find(([id]) => {
    const p = periodoPronto(id);
    return p.de === periodo.de && p.ate === periodo.ate;
  })?.[0];

  return (
    <div className="admin-barra">
      <div className="periodo-atalhos">
        {ATALHOS.map(([id, rotulo]) => (
          <button
            key={id}
            className={`tab ${ativo === id ? "active" : ""}`}
            onClick={() => setPeriodo(periodoPronto(id))}
          >
            {rotulo}
          </button>
        ))}
      </div>
      <div className="admin-datas">
        <input
          type="date" aria-label="De" value={periodo.de} max={periodo.ate}
          onChange={(e) => e.target.value && setPeriodo({ ...periodo, de: e.target.value })}
        />
        <span className="apagado">até</span>
        <input
          type="date" aria-label="Até" value={periodo.ate} min={periodo.de}
          onChange={(e) => e.target.value && setPeriodo({ ...periodo, ate: e.target.value })}
        />
      </div>
    </div>
  );
}
