import { useState } from "react";
import { admin } from "../../api";
import { Erro, Estado } from "./Ui";
import Periodo from "./Periodo";
import {
  FORMAS, campoDeReais, dataLegivel, filtrarReais, hojeLocal, nomeDaForma, paraCentavos,
  periodoPronto, reais, useAcao, useRecurso,
} from "./comum";

const TIPOS = {
  entrada: { botao: "Entrada", titulo: "Chegou mercadoria", quantidade: "Quantas unidades chegaram" },
  venda: { botao: "Venda", titulo: "Vendeu no balcão", quantidade: "Quantas unidades" },
  perda: { botao: "Perda", titulo: "Quebrou, venceu ou uso interno", quantidade: "Quantas unidades" },
  ajuste: { botao: "Contagem", titulo: "Contei a prateleira", quantidade: "Quantas tem agora" },
};

// Formulário de um movimento. A API decide o sinal; aqui a quantidade é sempre
// o número que a pessoa vê na mão.
function Lancar({ produto, tipo, acao, aoFechar, aoMudar }) {
  const [form, setForm] = useState({
    quantidade: tipo === "ajuste" ? String(Math.max(produto.estoque, 0)) : "1",
    custo: campoDeReais(produto.custo),
    preco: campoDeReais(produto.preco),
    forma: "pix",
    data: hojeLocal(),
    observacao: "",
  });
  const campo = (nome, filtro = (v) => v) => ({
    value: form[nome],
    onChange: (e) => setForm({ ...form, [nome]: filtro(e.target.value) }),
  });
  const quantidade = Number(form.quantidade || 0);

  async function enviar(evento) {
    evento.preventDefault();
    const dados = { produto: produto.id, tipo, quantidade, data: form.data };
    if (form.observacao.trim()) dados.observacao = form.observacao.trim();
    if (tipo === "entrada") {
      dados.custoUnit = paraCentavos(form.custo);
      if (dados.custoUnit == null) return acao.setErro("Custo inválido. Use, por exemplo, 32,50.");
    }
    if (tipo === "venda") {
      dados.precoUnit = paraCentavos(form.preco);
      if (dados.precoUnit == null) return acao.setErro("Preço inválido. Use, por exemplo, 69 ou 59,90.");
      dados.forma = form.forma;
    }
    if (await acao.executar(() => admin.lancarMovimento(dados))) {
      aoFechar();
      aoMudar();
    }
  }

  const unit = tipo === "entrada" ? paraCentavos(form.custo) : tipo === "venda" ? paraCentavos(form.preco) : null;

  return (
    <form className="lancar" onSubmit={enviar}>
      <strong>{TIPOS[tipo].titulo}</strong>
      <div className="admin-form-campos">
        <label className="campo">
          <span>{TIPOS[tipo].quantidade}</span>
          <input required inputMode="numeric" {...campo("quantidade", (v) => v.replace(/\D/g, ""))} />
        </label>
        {tipo === "entrada" && (
          <label className="campo">
            <span>Custo por unidade (R$)</span>
            <input required inputMode="decimal" {...campo("custo", filtrarReais)} />
          </label>
        )}
        {tipo === "venda" && (
          <>
            <label className="campo">
              <span>Preço por unidade (R$)</span>
              <input required inputMode="decimal" {...campo("preco", filtrarReais)} />
            </label>
            <label className="campo">
              <span>Pagamento</span>
              <select {...campo("forma")}>
                {FORMAS.map(([id, rotulo]) => <option key={id} value={id}>{rotulo}</option>)}
              </select>
            </label>
          </>
        )}
        <label className="campo">
          <span>Dia</span>
          <input type="date" required {...campo("data")} />
        </label>
        <label className="campo cresce">
          <span>Observação (opcional)</span>
          <input maxLength={120} {...campo("observacao")} />
        </label>
      </div>
      <div className="linha-acoes">
        {unit != null && quantidade > 0 && (
          <span className="apagado">Total: {reais(unit * quantidade)}</span>
        )}
        <button className="btn-linha" type="button" onClick={aoFechar}>Fechar</button>
        <button className="btn btn-primary" type="submit" disabled={acao.ocupado}>Lançar</button>
      </div>
    </form>
  );
}

function LinhaEstoque({ produto, acao, aoMudar }) {
  const [tipo, setTipo] = useState(null);
  const [custo, setCusto] = useState(campoDeReais(produto.custo));
  const [minimo, setMinimo] = useState(String(produto.minimo));
  const sujo = paraCentavos(custo) !== produto.custo || Number(minimo || 0) !== produto.minimo;

  async function salvar() {
    const centavos = paraCentavos(custo);
    if (centavos == null) return acao.setErro("Custo inválido. Use, por exemplo, 32,50.");
    if (await acao.executar(() => admin.editarEstoque(produto.id, { custo: centavos, minimo: Number(minimo || 0) })))
      aoMudar();
  }

  return (
    <div className={`admin-linha empilha ${produto.ativo ? "" : "inativa"}`}>
      <div className="estoque-topo">
        <div className="estoque-nome">
          <strong>{produto.nome}</strong>
          {!produto.ativo && <span className="pill">fora do site</span>}
        </div>
        <div className={`estoque-saldo ${produto.baixo ? "baixo" : ""}`}>
          <strong>{produto.estoque}</strong>
          <span>{produto.baixo ? "repor" : "em estoque"}</span>
        </div>
      </div>
      <div className="admin-form-campos">
        <label className="campo">
          <span>Custo (R$)</span>
          <input inputMode="decimal" value={custo} onChange={(e) => setCusto(filtrarReais(e.target.value))} />
        </label>
        <label className="campo">
          <span>Avisar com</span>
          <input inputMode="numeric" value={minimo} onChange={(e) => setMinimo(e.target.value.replace(/\D/g, ""))} />
        </label>
        <div className="estoque-fatos">
          <span>Venda <strong>{reais(produto.preco)}</strong></span>
          <span>Margem <strong>{produto.margem == null ? "—" : `${produto.margem.toLocaleString("pt-BR")}%`}</strong></span>
          <span>Parado <strong>{reais(produto.valorEmEstoque)}</strong></span>
        </div>
      </div>
      <div className="linha-acoes estoque-acoes">
        {Object.entries(TIPOS).map(([id, t]) => (
          <button
            key={id}
            className={`btn btn-mini ${tipo === id ? "btn-primary" : "btn-outline"}`}
            onClick={() => setTipo(tipo === id ? null : id)}
          >
            {t.botao}
          </button>
        ))}
        <button className="btn btn-outline btn-mini btn-salvar" onClick={salvar} disabled={!sujo || acao.ocupado}>
          {sujo ? "Salvar custo" : "Salvo"}
        </button>
      </div>
      {tipo && (
        <Lancar key={tipo} produto={produto} tipo={tipo} acao={acao} aoFechar={() => setTipo(null)} aoMudar={aoMudar} />
      )}
    </div>
  );
}

const ROTULO_TIPO = { entrada: "entrada", venda: "venda", perda: "perda", ajuste: "contagem" };

function Movimentos({ periodo, chave, aoExpirar, aoMudar }) {
  const { dados, erro, carregando, recarregar } = useRecurso(
    () => admin.movimentos(periodo),
    aoExpirar,
    `${periodo.de}|${periodo.ate}|${chave}`
  );
  const acao = useAcao(aoExpirar);

  async function desfazer(m) {
    if (!window.confirm(`Desfazer ${ROTULO_TIPO[m.tipo]} de ${m.produto.nome} (${dataLegivel(m.data)})?`)) return;
    if (await acao.executar(() => admin.desfazerMovimento(m.id))) {
      recarregar();
      aoMudar();
    }
  }

  return (
    <div className="bloco">
      <h3 className="bloco-titulo">Movimentações</h3>
      <Erro>{erro || acao.erro}</Erro>
      <Estado carregando={carregando} vazio={dados && !dados.movimentos.length ? "Nada lançado no período." : null}>
        <div className="admin-lista">
          {dados?.movimentos.map((m) => (
            <div className="admin-linha" key={m.id}>
              <div className="linha-principal">
                <strong>{dataLegivel(m.data)}</strong>
                <span className="pill">{ROTULO_TIPO[m.tipo]}</span>
                <span>{m.produto.nome}</span>
                <strong className={m.quantidade < 0 ? "valor saida" : "valor"}>
                  {m.quantidade > 0 ? `+${m.quantidade}` : m.quantidade} un.
                </strong>
                {m.tipo === "venda" && (
                  <span className="apagado">
                    {reais(-m.quantidade * m.precoUnit)} · {nomeDaForma(m.forma)} · lucro{" "}
                    {reais(-m.quantidade * (m.precoUnit - m.custoUnit))}
                  </span>
                )}
                {m.tipo === "entrada" && (
                  <span className="apagado">{reais(m.quantidade * m.custoUnit)} ({reais(m.custoUnit)}/un.)</span>
                )}
                {m.observacao && <span className="apagado">“{m.observacao}”</span>}
              </div>
              <button className="btn-linha" onClick={() => desfazer(m)} disabled={acao.ocupado}>
                Desfazer
              </button>
            </div>
          ))}
        </div>
      </Estado>
    </div>
  );
}

// Estoque × preço: quanto tem, quanto custou, quanto rende. O saldo é a soma
// das movimentações -- não existe campo de "quantidade" pra editar na mão; a
// contagem física é que acerta a diferença.
export default function PainelEstoque({ aoExpirar }) {
  const { dados, erro, carregando, recarregar } = useRecurso(() => admin.estoque(), aoExpirar);
  const acao = useAcao(aoExpirar);
  const [versao, setVersao] = useState(0);
  // O período vale para as movimentações; o saldo e o custo são sempre os de hoje.
  const [periodo, setPeriodo] = useState(periodoPronto("mes"));
  const mudou = () => {
    recarregar();
    setVersao((v) => v + 1);
  };

  return (
    <div className="admin-painel">
      <Periodo periodo={periodo} setPeriodo={setPeriodo} />
      {dados && (
        <div className="numeros">
          <div className="numero">
            <span className="numero-rotulo">Unidades na prateleira</span>
            <strong className="numero-valor">{dados.totais.unidades}</strong>
          </div>
          <div className="numero">
            <span className="numero-rotulo">Parado em estoque (custo)</span>
            <strong className="numero-valor">{reais(dados.totais.custo)}</strong>
          </div>
          <div className="numero">
            <span className="numero-rotulo">Se vender tudo</span>
            <strong className="numero-valor">{reais(dados.totais.venda)}</strong>
            <span className="numero-detalhe">lucro bruto {reais(dados.totais.venda - dados.totais.custo)}</span>
          </div>
          <div className={`numero ${dados.totais.baixos ? "alerta" : ""}`}>
            <span className="numero-rotulo">Para repor</span>
            <strong className="numero-valor">{dados.totais.baixos}</strong>
            <span className="numero-detalhe">no mínimo ou abaixo</span>
          </div>
        </div>
      )}

      <Erro>{erro || acao.erro}</Erro>

      <Estado carregando={carregando && !dados} vazio={dados && !dados.produtos.length ? "Nenhum produto cadastrado." : null}>
        <div className="admin-lista">
          {dados?.produtos.map((p) => (
            <LinhaEstoque
              key={`${p.id}|${p.custo}|${p.minimo}`}
              produto={p}
              acao={acao}
              aoMudar={mudou}
            />
          ))}
        </div>
      </Estado>

      <Movimentos periodo={periodo} chave={versao} aoExpirar={aoExpirar} aoMudar={recarregar} />

      <p className="hint">
        O custo é médio: cada entrada recalcula a média do que está na prateleira, e cada venda
        guarda o custo do momento, então o lucro de venda antiga não muda. Preço de venda e
        cadastro do produto ficam na aba Produtos.
      </p>
    </div>
  );
}
