import { useState } from "react";
import { admin } from "../../api";
import { Erro, Estado } from "./Ui";
import { useAcao, useRecurso } from "./comum";

const GRUPOS = ["Serviços", "Combos"];

// Célula da grade serviço × barbeiro. Preço em branco não é preço zero: é
// "esse barbeiro não faz isso", e some da tela do cliente.
function CelulaPreco({ servico, barbeiro, preco, acao, aoMudar }) {
  const [valor, setValor] = useState(preco ?? "");

  async function salvar() {
    const limpo = valor.toString().trim();
    if (limpo === (preco?.toString() ?? "")) return;

    const feito = limpo === ""
      ? await acao.executar(() => admin.removerPreco(servico.id, barbeiro.id))
      : await acao.executar(() => admin.definirPreco(servico.id, barbeiro.id, Number(limpo)));

    if (feito) aoMudar();
    else setValor(preco ?? "");
  }

  // No celular a grade vira uma coluna e o cabecalho com os nomes some: o nome
  // do barbeiro vem junto de cada preco, senao "40" e "35" nao dizem de quem sao.
  return (
    <label className="celula">
      <span className="celula-rotulo">{barbeiro.nome}</span>
      <input
        className="celula-preco"
        inputMode="numeric"
        value={valor}
        placeholder="—"
        aria-label={`Preço de ${servico.nome} com ${barbeiro.nome}`}
        onChange={(e) => setValor(e.target.value.replace(/\D/g, ""))}
        onBlur={salvar}
        onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
        disabled={acao.ocupado}
      />
    </label>
  );
}

function LinhaServico({ servico, barbeiros, acao, aoMudar }) {
  const [rascunho, setRascunho] = useState(servico);
  const sujo =
    rascunho.nome !== servico.nome ||
    rascunho.grupo !== servico.grupo ||
    Number(rascunho.minutos) !== servico.minutos;

  async function salvar() {
    const salvo = await acao.executar(() =>
      admin.editarServico(servico.id, {
        nome: rascunho.nome,
        grupo: rascunho.grupo,
        minutos: Number(rascunho.minutos),
      })
    );
    if (salvo) aoMudar();
  }

  async function alternarAtivo() {
    if (await acao.executar(() => admin.editarServico(servico.id, { ativo: !servico.ativo })))
      aoMudar();
  }

  async function remover() {
    if (!window.confirm(`Remover "${servico.nome}"? Reservas antigas continuam no histórico.`)) return;
    if (await acao.executar(() => admin.removerServico(servico.id))) aoMudar();
  }

  return (
    <div className={`grade-linha ${servico.ativo ? "" : "inativa"}`}>
      <div className="grade-servico">
        <input
          className="entrada-nome"
          maxLength={80}
          value={rascunho.nome}
          onChange={(e) => setRascunho({ ...rascunho, nome: e.target.value })}
        />
        <div className="grade-meta">
          <select
            value={rascunho.grupo}
            onChange={(e) => setRascunho({ ...rascunho, grupo: e.target.value })}
          >
            {GRUPOS.map((g) => <option key={g}>{g}</option>)}
          </select>
          <input
            className="entrada-minutos"
            inputMode="numeric"
            value={rascunho.minutos}
            aria-label="Duração em minutos"
            onChange={(e) => setRascunho({ ...rascunho, minutos: e.target.value.replace(/\D/g, "") })}
          />
          <span className="apagado">min</span>
          <button className="btn-linha" onClick={alternarAtivo} disabled={acao.ocupado}>
            {servico.ativo ? "Ocultar" : "Mostrar"}
          </button>
          <button className="btn-linha" onClick={remover} disabled={acao.ocupado}>
            Remover
          </button>
          {sujo && (
            <button className="btn btn-outline btn-mini" onClick={salvar} disabled={acao.ocupado}>
              Salvar
            </button>
          )}
        </div>
      </div>
      {barbeiros.map((b) => (
        <CelulaPreco
          key={b.id}
          servico={servico}
          barbeiro={b}
          preco={servico.precos[b.id]}
          acao={acao}
          aoMudar={aoMudar}
        />
      ))}
    </div>
  );
}

export default function PainelServicos({ aoExpirar, barbeiros, aoMudarCatalogo }) {
  const { dados, erro, carregando, recarregar } = useRecurso(() => admin.servicos(), aoExpirar);
  const acao = useAcao(aoExpirar);
  const [novo, setNovo] = useState({ nome: "", grupo: "Serviços", minutos: "30" });

  const atualizar = () => {
    recarregar();
    aoMudarCatalogo();
  };

  async function criar(evento) {
    evento.preventDefault();
    const criado = await acao.executar(() =>
      admin.criarServico({
        nome: novo.nome.trim(),
        grupo: novo.grupo,
        minutos: Number(novo.minutos),
      })
    );
    if (!criado) return;
    setNovo({ nome: "", grupo: "Serviços", minutos: "30" });
    atualizar();
  }

  return (
    <div className="admin-painel">
      <form className="admin-form" onSubmit={criar}>
        <div className="admin-form-campos">
          <label className="campo cresce">
            <span>Serviço</span>
            <input
              required minLength={2} maxLength={80} placeholder="Corte, Barba, Combo…"
              value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })}
            />
          </label>
          <label className="campo">
            <span>Grupo</span>
            <select value={novo.grupo} onChange={(e) => setNovo({ ...novo, grupo: e.target.value })}>
              {GRUPOS.map((g) => <option key={g}>{g}</option>)}
            </select>
          </label>
          <label className="campo">
            <span>Minutos</span>
            <input
              required inputMode="numeric" value={novo.minutos}
              onChange={(e) => setNovo({ ...novo, minutos: e.target.value.replace(/\D/g, "") })}
            />
          </label>
          <button className="btn btn-primary" type="submit" disabled={acao.ocupado}>
            {acao.ocupado ? "Salvando…" : "Adicionar serviço"}
          </button>
        </div>
        <Erro>{acao.erro}</Erro>
      </form>

      <Erro>{erro}</Erro>

      <Estado carregando={carregando} vazio={dados && !dados.length ? "Nenhum serviço." : null}>
        <div className="grade-precos" style={{ "--colunas": barbeiros.length }}>
          <div className="grade-linha cabecalho">
            <div className="grade-servico">
              <span className="tg-label">Serviço · duração</span>
            </div>
            {barbeiros.map((b) => (
              <span className="tg-label" key={b.id}>{b.nome}</span>
            ))}
          </div>
          {dados?.map((s) => (
            <LinhaServico
              key={s.id}
              servico={s}
              barbeiros={barbeiros}
              acao={acao}
              aoMudar={atualizar}
            />
          ))}
        </div>
      </Estado>

      <p className="hint">
        Preço em branco significa que o barbeiro não faz o serviço — ele some da tela do cliente.
        A duração muda os horários oferecidos: serviço que não cabe na faixa não aparece.
      </p>
    </div>
  );
}
