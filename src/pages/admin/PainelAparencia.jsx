import { useEffect, useRef, useState } from "react";
import { admin, api } from "../../api";
import { PADRAO, aplicarEGuardar, aplicarEscala } from "../../aparencia";
import { Erro, Estado } from "./Ui";
import { useAcao } from "./comum";

// Tamanho das letras do site inteiro, pra todo visitante. Mexer nos botoes ja
// mostra o resultado nesta tela (previa); so vale pros clientes depois de
// "Salvar". Saindo da aba sem salvar, volta ao que estava.
export default function PainelAparencia({ aoExpirar }) {
  const [salvo, setSalvo] = useState(null);
  const [valor, setValor] = useState(null);
  const [faixa, setFaixa] = useState({ minimo: 80, maximo: 120, passo: 5 });
  const [erroCarga, setErroCarga] = useState(null);
  const [aviso, setAviso] = useState(null);
  const acao = useAcao(aoExpirar);
  const salvoRef = useRef(null);

  useEffect(() => {
    api.aparencia()
      .then(({ escalaFonte, minimo, maximo, passo }) => {
        setFaixa({ minimo, maximo, passo });
        setSalvo(escalaFonte);
        setValor(escalaFonte);
        salvoRef.current = escalaFonte;
      })
      .catch((e) => setErroCarga(e.message));
    // Desfaz a previa se sair da aba sem salvar.
    return () => {
      if (salvoRef.current != null) aplicarEscala(salvoRef.current);
    };
  }, []);

  function mudar(novo) {
    const limitado = Math.min(faixa.maximo, Math.max(faixa.minimo, novo));
    setValor(limitado);
    setAviso(null);
    aplicarEscala(limitado);
  }

  async function salvar() {
    const r = await acao.executar(() => admin.salvarAparencia(valor));
    if (!r) return;
    setSalvo(r.escalaFonte);
    salvoRef.current = r.escalaFonte;
    aplicarEGuardar(r.escalaFonte);
    setAviso("Salvo. Os clientes passam a ver o novo tamanho em até 1 minuto.");
  }

  const sujo = valor !== salvo;

  return (
    <div className="admin-painel">
      <Erro>{erroCarga}</Erro>
      <Estado carregando={valor == null && !erroCarga}>
        <div className="admin-form aparencia">
          <span className="tg-label">Tamanho das letras do site</span>
          <div className="aparencia-controle">
            <button
              className="btn btn-outline aparencia-botao"
              onClick={() => mudar(valor - faixa.passo)}
              disabled={valor <= faixa.minimo || acao.ocupado}
              aria-label="Diminuir letras"
            >
              A−
            </button>
            <output className="aparencia-valor" aria-live="polite">{valor}%</output>
            <button
              className="btn btn-outline aparencia-botao"
              onClick={() => mudar(valor + faixa.passo)}
              disabled={valor >= faixa.maximo || acao.ocupado}
              aria-label="Aumentar letras"
            >
              A+
            </button>
          </div>
          <input
            type="range"
            className="aparencia-faixa"
            min={faixa.minimo}
            max={faixa.maximo}
            step={faixa.passo}
            value={valor ?? PADRAO}
            onChange={(e) => mudar(Number(e.target.value))}
            aria-label="Tamanho das letras"
          />
          <div className="aparencia-escala">
            <span>{faixa.minimo}%</span>
            <span>{faixa.maximo}%</span>
          </div>

          <p className="aparencia-previa">
            Prévia: é assim que o texto do site vai aparecer. <strong>Agendar horário</strong> ·
            Corte (social ou degradê) · R$ 40
          </p>

          <div className="linha-acoes">
            {valor !== PADRAO && (
              <button className="btn-linha" onClick={() => mudar(PADRAO)} disabled={acao.ocupado}>
                Voltar ao padrão (100%)
              </button>
            )}
            <button className="btn btn-primary" onClick={salvar} disabled={!sujo || acao.ocupado}>
              {acao.ocupado ? "Salvando…" : sujo ? "Salvar para todos" : "Salvo"}
            </button>
          </div>
          {aviso && <p className="hint">{aviso}</p>}
          <Erro>{acao.erro}</Erro>
        </div>
      </Estado>

      <p className="hint">
        Vale para o site inteiro e para todos os clientes. Acima de 100%, o menu do topo vira o
        botão ☰ também no computador, porque os links deixam de caber ao lado do logo.
      </p>
    </div>
  );
}
