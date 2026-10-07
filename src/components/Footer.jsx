import { Link } from "react-router-dom";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Logo />
          <p>
            Sua identidade, nosso cuidado. Barbearia por hora marcada em
            Cravinhos.
          </p>
        </div>
        <div>
          <h4>Onde</h4>
          <p>Av. Pedro Duarte Amoroso, 622B</p>
          <p>Jardim Itamarati, Cravinhos/SP</p>
          <p>14140-000</p>
        </div>
        <div>
          <h4>Contato</h4>
          <p>(16) 99394-4841</p>
          <a href="https://instagram.com/mosseri.barbearia" target="_blank" rel="noreferrer">
            @mosseri.barbearia
          </a>
        </div>
        <div className="footer-links">
          <h4>Navegar</h4>
          <Link to="/">A Casa</Link>
          <Link to="/agendar">Agendar</Link>
          <Link to="/catalogo">Catálogo</Link>
          <Link to="/instagram">Instagram</Link>
        </div>
      </div>

      <div className="container footer-base">
        <p>Code G.Buck</p>
      </div>
    </footer>
  );
}
