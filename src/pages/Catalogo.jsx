import { useState } from "react";
import ImgSlot from "../components/ImgSlot";

const PRODUCTS = [
  {
    name: "Matte Cream",
    price: 69,
    tag: "cabelo",
    desc: "Controle total, visual natural. Fixação seca, sem brilho.",
  },
  {
    name: "Pomada Modeladora",
    price: 59,
    tag: "cabelo",
    desc: "Base de água. Reativa com a mão úmida, sai no banho.",
  },
  {
    name: "Óleo de Barba",
    price: 45,
    tag: "barba",
    desc: "Amacia o fio e trata a pele por baixo. Três gotas bastam.",
  },
  {
    name: "Balm Pós-Barba",
    price: 39,
    tag: "barba",
    desc: "Fecha o poro depois da navalha. Sem álcool, sem ardência.",
  },
  {
    name: "Shampoo Diário",
    price: 49,
    tag: "cuidado",
    desc: "Limpa sem tirar a oleosidade que o couro precisa.",
  },
  {
    name: "Kit Mosseri",
    price: 149,
    tag: "cuidado",
    desc: "Matte Cream, óleo e balm. O básico bem resolvido.",
  },
];

const TABS = ["Tudo", "Cabelo", "Barba", "Cuidado"];

export default function Catalogo() {
  const [tab, setTab] = useState("Tudo");
  const filtered =
    tab === "Tudo"
      ? PRODUCTS
      : PRODUCTS.filter((p) => p.tag === tab.toLowerCase());

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
              {TABS.map((t) => (
                <button
                  key={t}
                  className={`tab ${tab === t ? "active" : ""}`}
                  onClick={() => setTab(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="product-grid">
          {filtered.map((p) => (
            <div className="product-card" key={p.name}>
              <ImgSlot label={p.name} />
              <div className="product-row">
                <h3>{p.name}</h3>
                <span className="price">R$ {p.price}</span>
              </div>
              <p>{p.desc}</p>
            </div>
          ))}
        </div>
        <p className="fine-print">Nomes e preços dos produtos são provisórios.</p>
      </div>
    </>
  );
}
