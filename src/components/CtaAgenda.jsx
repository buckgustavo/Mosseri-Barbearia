import { Link } from "react-router-dom";
import glyph from "../assets/mosseri-glyph.svg";
import Marquee from "./Marquee";

// Faixa azul que fecha a pagina: a tarja rolante e o convite para agendar.
// As duas andam sempre juntas e formam um bloco azul so, entao moram no mesmo
// componente -- separar convidava a colar uma sem a outra.
//
// O olho e so "Agenda", sem numero: a faixa deixou de pertencer a contagem das
// secoes da Home quando passou a aparecer tambem em outra pagina.
export default function CtaAgenda() {
  return (
    <>
      <Marquee text="Sua identidade, nosso cuidado · Corte · Barba · Barboterapia" />

      <section className="cta-banner">
        <div className="container cta-banner-inner">
          <div>
            <span className="eyebrow">Agenda</span>
            <h2 style={{ marginTop: 10 }}>A cadeira é sua. Basta marcar.</h2>
          </div>
          <Link to="/agendar" className="btn btn-white">
            Ver horários
          </Link>
        </div>
        <img className="logo-ghost" src={glyph} alt="" aria-hidden="true" />
      </section>
    </>
  );
}
