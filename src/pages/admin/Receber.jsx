import { useState } from "react";
import { admin } from "../../api";
import { FORMAS, campoDeReais, nomeDaForma, paraCentavos, filtrarReais, reais } from "./comum";

// Marca um atendimento como pago. No balcão é um toque: o valor já vem com o
// preço da reserva e escolher a forma de pagamento é o que confirma.
// `preco` e o valor do pagamento são centavos.
export default function Receber({ codigo, preco, pagamento, acao, aoMudar }) {
  const [aberto, setAberto] = useState(false);
  const [valor, setValor] = useState(campoDeReais(preco));

  if (pagamento) {
    return (
      <div className="receber">
        <span className="pill pago">
          Pago · {nomeDaForma(pagamento.forma)} · {reais(pagamento.valor)}
        </span>
        <button
          className="btn-linha"
          disabled={acao.ocupado}
          onClick={async () => {
            if (!window.confirm("Desfazer o pagamento desse atendimento?")) return;
            if (await acao.executar(() => admin.desfazerPagamento(codigo))) aoMudar();
          }}
        >
          Desfazer
        </button>
      </div>
    );
  }

  if (!aberto) {
    return (
      <button className="btn btn-outline btn-mini" onClick={() => setAberto(true)}>
        Receber
      </button>
    );
  }

  const centavos = paraCentavos(valor);

  async function registrar(forma) {
    if (centavos == null) return acao.setErro("Valor inválido. Use, por exemplo, 35 ou 35,50.");
    if (await acao.executar(() => admin.receber(codigo, { valor: centavos, forma }))) {
      setAberto(false);
      aoMudar();
    }
  }

  return (
    <div className="receber aberto">
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
      {FORMAS.map(([id, rotulo]) => (
        <button
          key={id}
          className="btn btn-outline btn-mini"
          disabled={acao.ocupado || centavos == null}
          onClick={() => registrar(id)}
        >
          {rotulo}
        </button>
      ))}
      <button className="btn-linha" onClick={() => setAberto(false)}>Fechar</button>
    </div>
  );
}
