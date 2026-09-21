import { useState } from "react";
import { admin } from "../../api";
import { Erro, Estado } from "./Ui";
import { useAcao, useRecurso } from "./comum";

function LinhaBarbeiro({ barbeiro, acao, aoMudar }) {
  const [rascunho, setRascunho] = useState(barbeiro);
  const sujo =
    rascunho.nome !== barbeiro.nome ||
    rascunho.descricao !== barbeiro.descricao ||
    rascunho.foto !== barbeiro.foto;

  const campo = (nome) => ({
    value: rascunho[nome] ?? "",
    onChange: (e) => setRascunho({ ...rascunho, [nome]: e.target.value }),
  });

  async function salvar() {
    const salvo = await acao.executar(() =>
      admin.editarBarbeiro(barbeiro.id, {
        nome: rascunho.nome,
        descricao: rascunho.descricao,
        foto: rascunho.foto ?? "",
      })
    );
    if (salvo) aoMudar();
  }

  async function alternarAtivo() {
    if (await acao.executar(() => admin.editarBarbeiro(barbeiro.id, { ativo: !barbeiro.ativo })))
      aoMudar();
  }

  async function remover() {
    const aviso = barbeiro.reservasFuturas
      ? `${barbeiro.nome} tem ${barbeiro.reservasFuturas} reserva(s) futura(s). ` +
        "Ele sai do site, mas as reservas continuam de pé e precisam ser remarcadas. Seguir?"
      : `Remover ${barbeiro.nome} de vez?`;
    if (!window.confirm(aviso)) return;
    if (await acao.executar(() => admin.removerBarbeiro(barbeiro.id))) aoMudar();
  }

  return (
    <div className={`admin-linha empilha ${barbeiro.ativo ? "" : "inativa"}`}>
      <div className="admin-form-campos">
        <label className="campo cresce">
          <span>Nome</span>
          <input maxLength={60} {...campo("nome")} />
        </label>
        <label className="campo cresce">
          <span>Descrição</span>
          <input maxLength={120} {...campo("descricao")} />
        </label>
        <label className="campo">
          <span>Foto (arquivo)</span>
          <input maxLength={60} placeholder="sem foto" {...campo("foto")} />
        </label>
      </div>
      <div className="linha-acoes">
        <span className="apagado">
          id <code>{barbeiro.id}</code>
          {barbeiro.reservasFuturas > 0 && ` · ${barbeiro.reservasFuturas} reserva(s) à frente`}
        </span>
        <button className="btn-linha" onClick={alternarAtivo} disabled={acao.ocupado}>
          {barbeiro.ativo ? "Tirar do site" : "Voltar pro site"}
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

// A foto é o nome do arquivo em public/fotos (juan, thiago). Barbeiro sem foto
// entra assim mesmo: a tela do cliente desenha as iniciais no lugar.
export default function PainelBarbeiros({ aoExpirar, aoMudarCatalogo }) {
  const { dados, erro, carregando, recarregar } = useRecurso(() => admin.barbeiros(), aoExpirar);
  const acao = useAcao(aoExpirar);
  const [novo, setNovo] = useState({ nome: "", descricao: "", foto: "" });

  const atualizar = () => {
    recarregar();
    aoMudarCatalogo();
  };

  async function criar(evento) {
    evento.preventDefault();
    const criado = await acao.executar(() =>
      admin.criarBarbeiro({
        nome: novo.nome.trim(),
        descricao: novo.descricao.trim(),
        ...(novo.foto.trim() ? { foto: novo.foto.trim() } : {}),
      })
    );
    if (!criado) return;
    setNovo({ nome: "", descricao: "", foto: "" });
    atualizar();
  }

  return (
    <div className="admin-painel">
      <form className="admin-form" onSubmit={criar}>
        <div className="admin-form-campos">
          <label className="campo cresce">
            <span>Nome</span>
            <input
              required minLength={2} maxLength={60} placeholder="Como aparece no site"
              value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })}
            />
          </label>
          <label className="campo cresce">
            <span>Descrição</span>
            <input
              required maxLength={120} placeholder="Equipe Mosseri"
              value={novo.descricao} onChange={(e) => setNovo({ ...novo, descricao: e.target.value })}
            />
          </label>
          <label className="campo">
            <span>Foto (opcional)</span>
            <input
              maxLength={60} placeholder="arquivo em /fotos"
              value={novo.foto} onChange={(e) => setNovo({ ...novo, foto: e.target.value })}
            />
          </label>
          <button className="btn btn-primary" type="submit" disabled={acao.ocupado}>
            {acao.ocupado ? "Salvando…" : "Adicionar barbeiro"}
          </button>
        </div>
        <p className="hint">
          O novo barbeiro só aparece pro cliente depois de ganhar preço em algum serviço, na aba
          Serviços e preços.
        </p>
        <Erro>{acao.erro}</Erro>
      </form>

      <Erro>{erro}</Erro>

      <Estado carregando={carregando} vazio={dados && !dados.length ? "Nenhum barbeiro." : null}>
        <div className="admin-lista">
          {dados?.map((b) => (
            <LinhaBarbeiro key={b.id} barbeiro={b} acao={acao} aoMudar={atualizar} />
          ))}
        </div>
      </Estado>
    </div>
  );
}
