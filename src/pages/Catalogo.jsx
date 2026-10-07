import { useEffect, useState } from "react";
import ImgSlot from "../components/ImgSlot";
import { api, urlDaApi } from "../api";

// Os produtos moram no banco e são cadastrados na área gerencial: esta tela só
// desenha o que a API devolver. Produto sem foto recebe o espaço vazio do
// design original.
const ABAS = [
  ["Tudo", null],
  ["Cabelo", "cabelo"],
  ["Barba", "barba"],
  ["Cuidado", "cuidado"],
];

export default function Catalogo() {
  const [aba, setAba] = useState("Tudo");
  const [produtos, setProdutos] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    let vivo = true;
    api.produtos()
      .then((lista) => vivo && setProdutos(lista))
      .catch((e) => vivo && setErro(e.message));
    return () => { vivo = false; };
  }, []);

  const grupo = ABAS.find(([rotulo]) => rotulo === aba)?.[1] ?? null;
  const visiveis = (produtos ?? []).filter((p) => !grupo || p.grupo === grupo);

  return (
    <>
      <div className="page-head">
        <div className="container">
          <div className="page-head-row">
            <div>
              <span className="eyebrow">Catálogo</span>
              <h1>O que fica com você.</h1>
            </div>
            <div className="tabs">
              {ABAS.map(([rotulo]) => (
                <button
                  key={rotulo}
                  className={`tab ${aba === rotulo ? "active" : ""}`}
                  onClick={() => setAba(rotulo)}
                >
                  {rotulo}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {erro && <p className="form-erro">{erro}</p>}
        {!produtos && !erro && <p className="hint">Carregando o catálogo…</p>}
        {produtos && !visiveis.length && <p className="hint">Nada nessa prateleira por enquanto.</p>}

        <div className="product-grid">
          {visiveis.map((p) => (
            <div className="product-card" key={p.id}>
              {p.foto ? (
                <img className="product-foto" src={urlDaApi(p.foto)} alt={p.nome} loading="lazy" />
              ) : (
                <ImgSlot />
              )}
              <div className="product-row">
                <h3>{p.nome}</h3>
                <span className="price">R$ {p.preco}</span>
              </div>
              <p>{p.descricao}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
