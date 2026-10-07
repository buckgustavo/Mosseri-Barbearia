import { useState } from "react";
import { admin } from "../../api";
import { FORMAS, campoDeReais, nomeDaForma, paraCentavos, filtrarReais, reais } from "./comum";

// A conta de um atendimento: o que já foi pago (em quantas partes for), o que
// falta, e o botão de receber. No balcão é um toque: o valor já vem com o que
// falta, e escolher a forma de pagamento é o que confirma. Valor menor que o
// que falta pergunta o que fazer com o resto: fica devendo ou vira desconto.
// `conta` é o `financeiro` que a API devolve; tudo em centavos.
export default function Receber({ codigo, conta, acao, aoMudar }) {
  const [aberto, setAberto] = useState(false);
  const [valor, setValor] = useState(campoDeReais(conta.restante));
  const [quitar, setQuitar] = useState(false);

  const centavos = paraCentavos(valor);
  const menor = centavos != null && centavos < conta.restante;
  const demais = centavos != null && centavos > conta.restante;

  function abrir() {
    setValor(campoDeReais(conta.restante));
    setQuitar(false);
    setAberto(true);
  }

  async function registrar(forma) {
    if (centavos == null) return acao.setErro("Valor inválido. Use, por exemplo, 35 ou 35,50.");
    const dados = { valor: centavos, quitar: menor && quitar };
    if (forma) dados.forma = forma;
    if (await acao.executar(() => admin.receber(codigo, dados))) {
      setAberto(false);
      aoMudar();
    }
  }

  async function desfazer(p) {
    const qual = p.forma ? `${nomeDaForma(p.forma)} de ${reais(p.valor)}` : "a cortesia";
    const aviso = p.desconto ? ` O desconto de ${reais(p.desconto)} sai junto e a conta reabre.` : "";
    if (!window.confirm(`Desfazer ${qual}?${aviso}`)) return;
    if (await acao.executar(() => admin.desfazerPagamento(codigo, p.id))) aoMudar();
  }

  return (
    <div className="receber">
      {conta.pagamentos.length > 0 && (
        <div className="receber-partes">
          {conta.pagamentos.map((p) => (
            <span className="parte" key={p.id}>
              {p.forma ? `${nomeDaForma(p.forma)} ${reais(p.valor)}` : "Cortesia"}
              {p.desconto > 0 && p.forma && <span className="apagado"> · desc. {reais(p.desconto)}</span>}
              <button
                className="parte-x"
                onClick={() => desfazer(p)}
                disabled={acao.ocupado}
                aria-label={`Desfazer pagamento ${p.forma ? nomeDaForma(p.forma) : "cortesia"}`}
                title="Desfazer"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {conta.situacao === "pago" ? (
        conta.pagamentos.length > 0 && <span className="pill pago">Pago</span>
      ) : !aberto ? (
        <div className="receber-linha">
          {conta.situacao === "parcial" && (
            <span className="pill parcial">Falta {reais(conta.restante)}</span>
          )}
          <button className="btn btn-outline btn-mini" onClick={abrir}>
            {conta.situacao === "parcial" ? "Receber resto" : "Receber"}
          </button>
        </div>
      ) : (
        <div className="receber-aberto">
          <div className="receber-linha">
            <label className="receber-valor">
              <span>R$</span>
              <input
                inputMode="decimal"
                value={valor}
                onChange={(e) => setValor(filtrarReais(e.target.value))}
                aria-label="Valor recebido"
                autoFocus
              />
            </label>
            <span className="apagado">de {reais(conta.restante)}</span>
          </div>

          {menor && (
            <div className="receber-resto" role="radiogroup" aria-label="O que fazer com o resto">
              <span className="apagado">O resto ({reais(conta.restante - centavos)}):</span>
              <button
                role="radio" aria-checked={!quitar}
                className={`tab ${!quitar ? "active" : ""}`} onClick={() => setQuitar(false)}
              >
                Fica devendo
              </button>
              <button
                role="radio" aria-checked={quitar}
                className={`tab ${quitar ? "active" : ""}`} onClick={() => setQuitar(true)}
              >
                Dar desconto
              </button>
            </div>
          )}

          {demais && <p className="form-erro">Falta só {reais(conta.restante)}.</p>}

          <div className="receber-linha">
            {centavos === 0 ? (
              <button
                className="btn btn-outline btn-mini"
                disabled={acao.ocupado || !quitar}
                onClick={() => registrar(null)}
                title={quitar ? "" : "Marque “Dar desconto” para fechar sem cobrar"}
              >
                Cortesia
              </button>
            ) : (
              FORMAS.map(([id, rotulo]) => (
                <button
                  key={id}
                  className="btn btn-outline btn-mini"
                  disabled={acao.ocupado || centavos == null || demais}
                  onClick={() => registrar(id)}
                >
                  {rotulo}
                </button>
              ))
            )}
            <button className="btn-linha" onClick={() => setAberto(false)}>Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
}
