import { useEffect, useState } from "react";
import { admin } from "../../api";
import { Erro, Estado } from "./Ui";
import { useAcao, useRecurso } from "./comum";

// A semana do site começa na segunda e termina no domingo.
const SEMANA = [
  [1, "Segunda-feira"], [2, "Terça-feira"], [3, "Quarta-feira"], [4, "Quinta-feira"],
  [5, "Sexta-feira"], [6, "Sábado"], [0, "Domingo"],
];

// Dia sem faixa nenhuma é dia fechado -- não existe um botão "fechado" separado,
// porque seriam dois jeitos de dizer a mesma coisa.
export default function PainelExpediente({ aoExpirar, aoMudarCatalogo }) {
  const { dados, erro, carregando, recarregar } = useRecurso(() => admin.expediente(), aoExpirar);
  const acao = useAcao(aoExpirar);
  const [semana, setSemana] = useState(null);

  useEffect(() => {
    if (!dados) return;
    setSemana(
      Object.fromEntries(
        SEMANA.map(([dia]) => [
          dia,
          dados.filter((f) => f.diaSemana === dia).map((f) => ({ inicio: f.inicio, fim: f.fim })),
        ])
      )
    );
  }, [dados]);

  const mudar = (dia, indice, campo, valor) =>
    setSemana((atual) => ({
      ...atual,
      [dia]: atual[dia].map((f, i) => (i === indice ? { ...f, [campo]: valor } : f)),
    }));

  const adicionar = (dia) =>
    setSemana((atual) => ({
      ...atual,
      [dia]: [...atual[dia], { inicio: "09:00", fim: "12:00" }],
    }));

  const tirar = (dia, indice) =>
    setSemana((atual) => ({ ...atual, [dia]: atual[dia].filter((_, i) => i !== indice) }));

  async function salvar() {
    const lista = SEMANA.flatMap(([dia]) =>
      (semana[dia] ?? []).map((f) => ({ diaSemana: dia, inicio: f.inicio, fim: f.fim }))
    );
    if (await acao.executar(() => admin.salvarExpediente(lista))) {
      recarregar();
      aoMudarCatalogo();
    }
  }

  return (
    <div className="admin-painel">
      <Erro>{erro || acao.erro}</Erro>

      <Estado carregando={carregando || !semana}>
        <div className="admin-lista">
          {semana &&
            SEMANA.map(([dia, nome]) => (
              <div className="admin-linha empilha" key={dia}>
                <div className="linha-principal">
                  <strong>{nome}</strong>
                  {!semana[dia].length && <span className="pill">fechado</span>}
                  <button className="btn-linha" onClick={() => adicionar(dia)}>
                    + faixa
                  </button>
                </div>
                <div className="faixas">
                  {semana[dia].map((f, i) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <div className="faixa" key={i}>
                      <input
                        type="time" step="300" value={f.inicio}
                        aria-label={`${nome}: início da faixa ${i + 1}`}
                        onChange={(e) => mudar(dia, i, "inicio", e.target.value)}
                      />
                      <span className="apagado">às</span>
                      <input
                        type="time" step="300" value={f.fim}
                        aria-label={`${nome}: fim da faixa ${i + 1}`}
                        onChange={(e) => mudar(dia, i, "fim", e.target.value)}
                      />
                      <button className="btn-linha" onClick={() => tirar(dia, i)}>
                        tirar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>

        <div className="admin-rodape">
          <button className="btn btn-primary" onClick={salvar} disabled={acao.ocupado}>
            {acao.ocupado ? "Salvando…" : "Salvar a semana"}
          </button>
          <p className="hint">
            A semana é gravada inteira de uma vez. Dia sem faixa aparece como fechado no site, e
            horário já reservado continua de pé mesmo que a faixa mude.
          </p>
        </div>
      </Estado>
    </div>
  );
}
