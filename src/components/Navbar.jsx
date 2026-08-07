import { NavLink } from "react-router-dom";
import Logo from "./Logo";

const links = [
  { to: "/", label: "A Casa", end: true },
  { to: "/catalogo", label: "Catálogo" },
  { to: "/instagram", label: "Instagram" },
];

export default function Navbar() {
  return (
    <header className="nav">
      <div className="nav-inner">
        <NavLink to="/" style={{ display: "flex" }}>
          <Logo />
        </NavLink>
        <nav className="nav-links">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              {l.label}
            </NavLink>
          ))}
          <NavLink to="/agendar" className="btn btn-outline">
            Agendar
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
