import { useCallback, useEffect, useState } from "react";
import { admin, api } from "../api";
import PainelAgenda from "./admin/PainelAgenda";
import PainelBarbeiros from "./admin/PainelBarbeiros";
import PainelExpediente from "./admin/PainelExpediente";
import PainelFolgas from "./admin/PainelFolgas";
import PainelProdutos from "./admin/PainelProdutos";
import PainelServicos from "./admin/PainelServicos";
import { Erro } from "./admin/Ui";

const ABAS = [
  ["agenda", "Agenda do dia"],
  ["folgas", "Folgas e feriados"],
  ["barbeiros", "Barbeiros"],
  ["servicos", "Serviços e preços"],
  ["expediente", "Expediente"],
  ["produtos", "Produtos"],
];

function Entrar({ aoEntrar }) {
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function submeter(evento) {
    evento.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      await admin.entrar(senha);
      setSenha("");
      aoEntrar();
    } catch (e) {
      setErro(e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="container estado-vazio">
      <form className="summary-card admin-entrar" onSubmit={submeter}>
        <div className="summary-title">Área gerencial</div>
        <p className="summary-note">
          A senha é uma só, da barbearia. A sessão vale por 12 horas.
        </p>
        <div className="campo">
          <label htmlFor="senha">Senha</label>
          <input
            id="senha"
            type="password"
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
        </div>
        <Erro>{erro}</Erro>
        <button className="btn btn-primary btn-block" type="submit" disabled={enviando || !senha}>
          {enviando ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}

function TrocarSenha({ aoFechar }) {
  const [atual, setAtual] = useState("");
  const [nova, setNova] = useState("");
  const [erro, setErro] = useState(null);
  const [pronto, setPronto] = useState(false);

  async function submeter(evento) {
    evento.preventDefault();
    setErro(null);
    try {
      // Trocar derruba todas as sessões, inclusive a nossa: a API já devolve
      // um token novo, então quem trocou continua dentro.
      await admin.trocarSenha(atual, nova);
      setPronto(true);
      setAtual("");
      setNova("");
    } catch (e) {
      setErro(e.message);
    }
  }

  return (
    <form className="admin-form admin-senha" onSubmit={submeter}>
      <div className="admin-form-campos">
        <label className="campo">
          <span>Senha atual</span>
          <input type="password" value={atual} onChange={(e) => setAtual(e.target.value)} required />
        </label>
        <label className="campo">
          <span>Nova senha (8+)</span>
          <input
            type="password" minLength={8} value={nova}
            onChange={(e) => setNova(e.target.value)} required
          />
        </label>
        <button className="btn btn-primary" type="submit">Trocar</button>
        <button className="btn btn-outline" type="button" onClick={aoFechar}>Fechar</button>
      </div>
      {pronto && <p className="hint">Senha trocada. Quem estava logado em outro aparelho caiu.</p>}
      <Erro>{erro}</Erro>
    </form>
  );
}

export default function Admin() {
  // verificando -> o token guardado ainda vale? | fora -> login | dentro
  const [sessao, setSessao] = useState("verificando");
  const [aba, setAba] = useState("agenda");
  const [trocando, setTrocando] = useState(false);
  const [barbeiros, setBarbeiros] = useState([]);

  const aoExpirar = useCallback(() => setSessao("fora"), []);

  // A area gerencial nao tem link no site e nao deve aparecer em busca: quem
  // usa chega pelo endereco salvo. O noindex vale enquanto a pagina esta aberta.
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  useEffect(() => {
    if (!admin.temToken()) return setSessao("fora");
    admin.conferir().then(
      () => setSessao("dentro"),
      () => setSessao("fora")
    );
  }, []);

  // Os painéis de folga e de preço precisam da lista de barbeiros ativos; vive
  // aqui pra não virar três requisições iguais em três abas.
  const carregarBarbeiros = useCallback(() => {
    api.barbeiros().then(setBarbeiros).catch(() => setBarbeiros([]));
  }, []);

  useEffect(() => {
    if (sessao === "dentro") carregarBarbeiros();
  }, [sessao, carregarBarbeiros]);

  if (sessao === "verificando") {
    return (
      <div className="container estado-vazio">
        <p className="hint">Conferindo a sessão…</p>
      </div>
    );
  }

  if (sessao === "fora") return <Entrar aoEntrar={() => setSessao("dentro")} />;

  const comum = { aoExpirar, barbeiros, aoMudarCatalogo: carregarBarbeiros };

  return (
    <>
      <div className="page-head admin-cabeca">
        <div className="container">
          <div className="page-head-row">
            <div>
              <span className="eyebrow">Área gerencial</span>
              <h1>A casa por dentro.</h1>
            </div>
            <div className="admin-sessao">
              <button className="btn-linha" onClick={() => setTrocando((t) => !t)}>
                Trocar senha
              </button>
              <button
                className="btn btn-outline"
                onClick={() => admin.sair().then(() => setSessao("fora"))}
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container admin">
        {trocando && <TrocarSenha aoFechar={() => setTrocando(false)} />}

        <div className="tabs admin-abas">
          {ABAS.map(([id, rotulo]) => (
            <button
              key={id}
              className={`tab ${aba === id ? "active" : ""}`}
              onClick={(e) => {
                setAba(id);
                // No celular as abas rolam de lado: a escolhida vem pra vista.
                e.currentTarget.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
              }}
            >
              {rotulo}
            </button>
          ))}
        </div>

        {aba === "agenda" && <PainelAgenda aoExpirar={aoExpirar} />}
        {aba === "folgas" && <PainelFolgas aoExpirar={aoExpirar} barbeiros={barbeiros} />}
        {aba === "barbeiros" && <PainelBarbeiros {...comum} />}
        {aba === "servicos" && <PainelServicos {...comum} />}
        {aba === "expediente" && <PainelExpediente {...comum} />}
        {aba === "produtos" && <PainelProdutos aoExpirar={aoExpirar} />}
      </div>
    </>
  );
}
