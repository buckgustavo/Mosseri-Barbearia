import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import Logo from "./Logo";

const links = [
  { to: "/", label: "A Casa", end: true },
  { to: "/catalogo", label: "Catálogo" },
  { to: "/instagram", label: "Instagram" },
];

const classeAtiva = ({ isActive }) => (isActive ? "active" : "");

export default function Navbar() {
  // No celular os links nao cabem na barra: viram uma lista que abre pelo
  // botao. Trocar de pagina fecha a lista, senao ela ficaria aberta por cima
  // da pagina nova.
  const [aberto, setAberto] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setAberto(false), [pathname]);

  useEffect(() => {
    if (!aberto) return;
    const fechar = (e) => e.key === "Escape" && setAberto(false);
    window.addEventListener("keydown", fechar);
    return () => window.removeEventListener("keydown", fechar);
  }, [aberto]);

  return (
    <header className={`nav ${aberto ? "nav-aberto" : ""}`}>
      <div className="nav-inner">
        <NavLink to="/" style={{ display: "flex" }}>
          <Logo />
        </NavLink>
        <nav className="nav-links">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={classeAtiva}>
              {l.label}
            </NavLink>
          ))}
          <NavLink to="/agendar" className="btn btn-outline">
            Agendar
          </NavLink>
        </nav>
        <button
          type="button"
          className="nav-botao"
          aria-expanded={aberto}
          aria-controls="nav-menu"
          aria-label={aberto ? "Fechar menu" : "Abrir menu"}
          onClick={() => setAberto((a) => !a)}
        >
          <span aria-hidden="true" />
        </button>
      </div>

      {aberto && (
        <nav id="nav-menu" className="nav-menu">
          <NavLink to="/agendar" className="btn btn-primary btn-block">
            Agendar horário
          </NavLink>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={classeAtiva}>
              {l.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}
