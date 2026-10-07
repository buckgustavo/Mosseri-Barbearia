import { useState } from "react";
import { admin, urlDaApi } from "../../api";
import { Erro, Estado } from "./Ui";
import { useAcao, useRecurso } from "./comum";
import { reduzirImagem } from "./imagem";

const GRUPOS = [["cabelo", "Cabelo"], ["barba", "Barba"], ["cuidado", "Cuidado"]];

// Foto do produto. No celular o "Adicionar foto" abre a camera ou a galeria.
function FotoProduto({ produto, acao, aoMudar }) {
  const [enviando, setEnviando] = useState(false);

  async function escolher(evento) {
    const arquivo = evento.target.files?.[0];
    evento.target.value = ""; // permite escolher o mesmo arquivo de novo
    if (!arquivo) return;
    setEnviando(true);
    const imagem = await reduzirImagem(arquivo);
    const feito = await acao.executar(() => admin.enviarFotoProduto(produto.id, imagem));
    setEnviando(false);
    if (feito) aoMudar();
  }

  async function remover() {
    if (!window.confirm(`Tirar a foto de "${produto.nome}"?`)) return;
    if (await acao.executar(() => admin.removerFotoProduto(produto.id))) aoMudar();
  }

  const rotulo = enviando ? "Enviando…" : produto.foto ? "Trocar foto" : "Adicionar foto";

  return (
    <div className="produto-foto">
      {produto.foto ? (
        <img src={urlDaApi(produto.foto)} alt={`Foto de ${produto.nome}`} />
      ) : (
        <div className="produto-foto-vazia" aria-hidden="true">sem foto</div>
      )}
      <div className="produto-foto-acoes">
        <label className={`btn btn-outline btn-mini ${acao.ocupado ? "desativado" : ""}`}>
          {rotulo}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/*"
            onChange={escolher}
            disabled={acao.ocupado}
            hidden
          />
        </label>
        {produto.foto && (
          <button className="btn-linha" onClick={remover} disabled={acao.ocupado}>
            Tirar foto
          </button>
        )}
      </div>
    </div>
  );
}

function LinhaProduto({ produto, acao, aoMudar }) {
  const [rascunho, setRascunho] = useState(produto);
  const sujo =
    rascunho.nome !== produto.nome ||
    rascunho.descricao !== produto.descricao ||
    rascunho.grupo !== produto.grupo ||
    Number(rascunho.preco) !== produto.preco;

  const campo = (nome) => ({
    value: rascunho[nome],
    onChange: (e) => setRascunho({ ...rascunho, [nome]: e.target.value }),
  });

  async function salvar() {
    const salvo = await acao.executar(() =>
      admin.editarProduto(produto.id, {
        nome: rascunho.nome,
        descricao: rascunho.descricao,
        grupo: rascunho.grupo,
        preco: Number(rascunho.preco),
      })
    );
    if (salvo) aoMudar();
  }

  async function alternarAtivo() {
    if (await acao.executar(() => admin.editarProduto(produto.id, { ativo: !produto.ativo })))
      aoMudar();
  }

  async function remover() {
    if (!window.confirm(`Remover "${produto.nome}" do catálogo?`)) return;
    if (await acao.executar(() => admin.removerProduto(produto.id))) aoMudar();
  }

  return (
    <div className={`admin-linha empilha ${produto.ativo ? "" : "inativa"}`}>
      <FotoProduto produto={produto} acao={acao} aoMudar={aoMudar} />
      <div className="admin-form-campos">
        <label className="campo cresce">
          <span>Produto</span>
          <input maxLength={80} {...campo("nome")} />
        </label>
        <label className="campo">
          <span>Grupo</span>
          <select {...campo("grupo")}>
            {GRUPOS.map(([id, rotulo]) => <option key={id} value={id}>{rotulo}</option>)}
          </select>
        </label>
        <label className="campo">
          <span>Preço</span>
          <input
            inputMode="numeric"
            value={rascunho.preco}
            onChange={(e) => setRascunho({ ...rascunho, preco: e.target.value.replace(/\D/g, "") })}
          />
        </label>
      </div>
      <label className="campo">
        <span>Descrição</span>
        <input maxLength={240} {...campo("descricao")} />
      </label>
      <div className="linha-acoes">
        <span className="apagado">id <code>{produto.id}</code></span>
        <button className="btn-linha" onClick={alternarAtivo} disabled={acao.ocupado}>
          {produto.ativo ? "Tirar do site" : "Voltar pro site"}
        </button>
        <button className="btn-linha" onClick={remover} disabled={acao.ocupado}>
          Remover
        </button>
        <button className="btn btn-outline" onClick={salvar} disabled={!sujo || acao.ocupado}>
          {sujo ? "Salvar" : "Salvo"}
        </button>
      </div>
    </div>
  );
}

const VAZIO = { nome: "", descricao: "", grupo: "cabelo", preco: "" };

export default function PainelProdutos({ aoExpirar }) {
  const { dados, erro, carregando, recarregar } = useRecurso(() => admin.produtos(), aoExpirar);
  const acao = useAcao(aoExpirar);
  const [novo, setNovo] = useState(VAZIO);

  async function criar(evento) {
    evento.preventDefault();
    const criado = await acao.executar(() =>
      admin.criarProduto({
        nome: novo.nome.trim(),
        descricao: novo.descricao.trim(),
        grupo: novo.grupo,
        preco: Number(novo.preco),
      })
    );
    if (!criado) return;
    setNovo(VAZIO);
    recarregar();
  }

  return (
    <div className="admin-painel">
      <form className="admin-form" onSubmit={criar}>
        <div className="admin-form-campos">
          <label className="campo cresce">
            <span>Produto</span>
            <input
              required minLength={2} maxLength={80} placeholder="Pomada, óleo, kit…"
              value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })}
            />
          </label>
          <label className="campo">
            <span>Grupo</span>
            <select value={novo.grupo} onChange={(e) => setNovo({ ...novo, grupo: e.target.value })}>
              {GRUPOS.map(([id, rotulo]) => <option key={id} value={id}>{rotulo}</option>)}
            </select>
          </label>
          <label className="campo">
            <span>Preço</span>
            <input
              required inputMode="numeric" placeholder="69" value={novo.preco}
              onChange={(e) => setNovo({ ...novo, preco: e.target.value.replace(/\D/g, "") })}
            />
          </label>
        </div>
        <div className="admin-form-campos">
          <label className="campo cresce">
            <span>Descrição</span>
            <input
              required maxLength={240} placeholder="O que ele faz, em uma linha"
              value={novo.descricao}
              onChange={(e) => setNovo({ ...novo, descricao: e.target.value })}
            />
          </label>
          <button className="btn btn-primary" type="submit" disabled={acao.ocupado}>
            {acao.ocupado ? "Salvando…" : "Adicionar produto"}
          </button>
        </div>
        <Erro>{acao.erro}</Erro>
      </form>

      <Erro>{erro}</Erro>

      <Estado carregando={carregando} vazio={dados && !dados.length ? "Nenhum produto." : null}>
        <div className="admin-lista">
          {dados?.map((p) => (
            <LinhaProduto key={p.id} produto={p} acao={acao} aoMudar={recarregar} />
          ))}
        </div>
      </Estado>

      <p className="hint">
        Foto quadrada fica melhor no catálogo. Ela é reduzida e regravada no envio, sem a
        localização que o celular grava na imagem. Produto sem foto aparece com o espaço vazio.
      </p>
    </div>
  );
}
