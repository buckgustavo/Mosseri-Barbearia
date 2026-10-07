import { useState } from "react";
import { admin } from "../../api";
import { Erro, Estado } from "./Ui";
import Periodo from "./Periodo";
import Receber from "./Receber";
import {
  dataLegivel, filtrarReais, hojeLocal, nomeDaForma, paraCentavos, periodoPronto, reais,
  useAcao, useRecurso,
} from "./comum";

const CATEGORIAS = [
  ["aluguel", "Aluguel"],
  ["contas", "Contas (luz, água, internet)"],
  ["equipe", "Salários e comissões"],
  ["material", "Material de uso"],
  ["manutencao", "Manutenção"],
  ["impostos", "Impostos e taxas"],
  ["marketing", "Divulgação"],
  ["outros", "Outros"],
];
const nomeDaCategoria = (id) => CATEGORIAS.find(([c]) => c === id)?.[1] ?? id;

function Numero({ rotulo, valor, detalhe, tom }) {
  return (
    <div className={`numero ${tom ?? ""}`}>
      <span className="numero-rotulo">{rotulo}</span>
      <strong className="numero-valor">{valor}</strong>
      {detalhe && <span className="numero-detalhe">{detalhe}</span>}
    </div>
  );
}

// Lista ordenada com barra proporcional: uma cor só, o tamanho é o dado.
function Barras({ titulo, linhas, vazio }) {
  const maior = Math.max(...linhas.map((l) => l.valor), 0);
  return (
    <div className="bloco">
      <h3 className="bloco-titulo">{titulo}</h3>
      {!maior ? (
        <p className="hint">{vazio}</p>
      ) : (
        <div className="barras">
          {linhas.map((l) => (
            <div className="barra" key={l.chave} title={`${l.rotulo}: ${reais(l.valor)}`}>
              <div className="barra-topo">
                <span>{l.rotulo}</span>
                <strong>{reais(l.valor)}</strong>
              </div>
              <div className="barra-trilho">
                <div className="barra-cheia" style={{ width: `${(l.valor / maior) * 100}%` }} />
              </div>
              {l.detalhe && <span className="apagado">{l.detalhe}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Resumo({ r }) {
  return (
    <>
      <div className="numeros">
        <Numero
          rotulo="Serviços recebidos"
          valor={reais(r.servicos.recebido)}
          detalhe={`${r.servicos.atendimentos} atendimento(s) · ticket ${reais(r.servicos.ticketMedio)}`}
        />
        <Numero
          rotulo="Produtos vendidos"
          valor={reais(r.produtos.vendido)}
          detalhe={`${r.produtos.unidades} un. · lucro ${reais(r.produtos.lucro)}`}
        />
        <Numero
          rotulo="Despesas"
          valor={reais(r.despesas.total)}
          detalhe={r.produtos.compras ? `+ ${reais(r.produtos.compras)} em compra de estoque` : "sem compra de estoque"}
        />
        <Numero
          rotulo="Saldo de caixa"
          valor={reais(r.caixa.saldo)}
          detalhe={`entrou ${reais(r.caixa.entradas)} · saiu ${reais(r.caixa.saidas)}`}
          tom={r.caixa.saldo < 0 ? "negativo" : ""}
        />
        <Numero
          rotulo="Lucro do período"
          valor={reais(r.resultado.lucro)}
          detalhe="receita − custo do que vendeu − despesas"
          tom={r.resultado.lucro < 0 ? "negativo" : "destaque"}
        />
        <Numero
          rotulo="A receber"
          valor={reais(r.aReceber.valor)}
          detalhe={`${r.aReceber.atendimentos} atendimento(s) sem pagamento`}
          tom={r.aReceber.atendimentos ? "alerta" : ""}
        />
      </div>

      <div className="blocos">
        <Barras
          titulo="Entradas por forma de pagamento"
          vazio="Nada recebido no período."
          linhas={r.porForma.map((f) => ({ chave: f.forma, rotulo: nomeDaForma(f.forma), valor: f.total }))}
        />
        <Barras
          titulo="Serviços por barbeiro"
          vazio="Nenhum atendimento pago no período."
          linhas={r.porBarbeiro.map((b) => ({
            chave: b.id, rotulo: b.nome, valor: b.recebido, detalhe: `${b.atendimentos} atendimento(s)`,
          }))}
        />
        <Barras
          titulo="Despesas por categoria"
          vazio="Nenhuma despesa no período."
          linhas={r.despesas.porCategoria.map((c) => ({
            chave: c.categoria, rotulo: nomeDaCategoria(c.categoria), valor: c.total,
          }))}
        />
      </div>
    </>
  );
}

function Atendimentos({ periodo, aoExpirar, aoMudar }) {
  const [situacao, setSituacao] = useState("pendente");
  const { dados, erro, carregando, recarregar } = useRecurso(
    () => admin.atendimentos({ ...periodo, situacao }),
    aoExpirar,
    `${periodo.de}|${periodo.ate}|${situacao}`
  );
  const acao = useAcao(aoExpirar);
  const mudou = () => {
    recarregar();
    aoMudar();
  };

  return (
    <div className="bloco">
      <div className="bloco-cabeca">
        <h3 className="bloco-titulo">Atendimentos</h3>
        <div className="tabs">
          {[["pendente", "A receber"], ["pago", "Pagos"], ["todos", "Todos"]].map(([id, rotulo]) => (
            <button key={id} className={`tab ${situacao === id ? "active" : ""}`} onClick={() => setSituacao(id)}>
              {rotulo}
            </button>
          ))}
        </div>
      </div>
      <Erro>{erro || acao.erro}</Erro>
      <Estado
        carregando={carregando}
        vazio={
          dados && !dados.atendimentos.length
            ? situacao === "pendente" ? "Nada a receber no período." : "Nenhum atendimento aqui."
            : null
        }
      >
        <div className="admin-lista">
          {dados?.atendimentos.map((a) => (
            <div className="admin-linha" key={a.codigo}>
              <div className="linha-principal">
                <strong>{dataLegivel(a.data)} {a.horario}</strong>
                <span>{a.cliente}</span>
                <span className="apagado">{a.servico.nome} · {a.barbeiro.nome} · {reais(a.preco)}</span>
                {!a.aconteceu && <span className="pill">ainda vai acontecer</span>}
              </div>
              <Receber codigo={a.codigo} preco={a.preco} pagamento={a.pagamento} acao={acao} aoMudar={mudou} />
            </div>
          ))}
        </div>
      </Estado>
    </div>
  );
}

const DESPESA_VAZIA = { data: hojeLocal(), categoria: "contas", descricao: "", valor: "" };

function Despesas({ periodo, aoExpirar, aoMudar }) {
  const { dados, erro, carregando, recarregar } = useRecurso(
    () => admin.despesas(periodo),
    aoExpirar,
    `${periodo.de}|${periodo.ate}`
  );
  const acao = useAcao(aoExpirar);
  const [form, setForm] = useState(DESPESA_VAZIA);
  const campo = (nome) => ({ value: form[nome], onChange: (e) => setForm({ ...form, [nome]: e.target.value }) });

  async function criar(evento) {
    evento.preventDefault();
    const valor = paraCentavos(form.valor);
    if (!valor) return acao.setErro("Valor inválido. Use, por exemplo, 250 ou 250,90.");
    const criada = await acao.executar(() =>
      admin.criarDespesa({ data: form.data, categoria: form.categoria, descricao: form.descricao.trim(), valor })
    );
    if (!criada) return;
    setForm({ ...DESPESA_VAZIA, data: form.data, categoria: form.categoria });
    recarregar();
    aoMudar();
  }

  async function remover(d) {
    if (!window.confirm(`Apagar "${d.descricao}" (${reais(d.valor)})?`)) return;
    if (await acao.executar(() => admin.removerDespesa(d.id))) {
      recarregar();
      aoMudar();
    }
  }

  return (
    <div className="bloco">
      <h3 className="bloco-titulo">Despesas</h3>
      <form className="admin-form" onSubmit={criar}>
        <div className="admin-form-campos">
          <label className="campo">
            <span>Dia</span>
            <input type="date" required {...campo("data")} />
          </label>
          <label className="campo">
            <span>Categoria</span>
            <select {...campo("categoria")}>
              {CATEGORIAS.map(([id, rotulo]) => <option key={id} value={id}>{rotulo}</option>)}
            </select>
          </label>
          <label className="campo cresce">
            <span>Descrição</span>
            <input required maxLength={120} placeholder="Conta de luz de setembro" {...campo("descricao")} />
          </label>
          <label className="campo">
            <span>Valor (R$)</span>
            <input
              required inputMode="decimal" placeholder="250,00" value={form.valor}
              onChange={(e) => setForm({ ...form, valor: filtrarReais(e.target.value) })}
            />
          </label>
          <button className="btn btn-primary" type="submit" disabled={acao.ocupado}>
            Lançar despesa
          </button>
        </div>
        <Erro>{acao.erro}</Erro>
      </form>
      <Erro>{erro}</Erro>
      <Estado carregando={carregando} vazio={dados && !dados.despesas.length ? "Nenhuma despesa no período." : null}>
        <div className="admin-lista">
          {dados?.despesas.map((d) => (
            <div className="admin-linha" key={d.id}>
              <div className="linha-principal">
                <strong>{dataLegivel(d.data)}</strong>
                <span>{d.descricao}</span>
                <span className="pill">{nomeDaCategoria(d.categoria)}</span>
                <strong className="valor">{reais(d.valor)}</strong>
              </div>
              <button className="btn-linha" onClick={() => remover(d)} disabled={acao.ocupado}>
                Apagar
              </button>
            </div>
          ))}
        </div>
      </Estado>
    </div>
  );
}

// O mês da casa numa tela: o que entrou, o que saiu, o que ainda falta
// receber e onde o dinheiro foi parar.
export default function PainelFinanceiro({ aoExpirar }) {
  const [periodo, setPeriodo] = useState(periodoPronto("mes"));
  const resumo = useRecurso(() => admin.resumo(periodo), aoExpirar, `${periodo.de}|${periodo.ate}`);

  return (
    <div className="admin-painel">
      <Periodo periodo={periodo} setPeriodo={setPeriodo} />
      <Erro>{resumo.erro}</Erro>
      {resumo.dados ? <Resumo r={resumo.dados} /> : <Estado carregando={resumo.carregando} />}
      <Atendimentos periodo={periodo} aoExpirar={aoExpirar} aoMudar={resumo.recarregar} />
      <Despesas periodo={periodo} aoExpirar={aoExpirar} aoMudar={resumo.recarregar} />
      <p className="hint">
        Saldo de caixa conta compra de estoque como saída. O lucro conta só o custo dos produtos
        que foram vendidos (ou perdidos). Compra de produto pra revenda se lança na aba Estoque, não
        como despesa, pra não contar duas vezes.
      </p>
    </div>
  );
}
