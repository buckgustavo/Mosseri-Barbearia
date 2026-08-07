import { Link } from "react-router-dom";
import glyph from "../assets/mosseri-glyph.svg";
import Marquee from "../components/Marquee";
import MiniMapa from "../components/MiniMapa";

export default function Home() {
  return (
    <>
      <section className="hero">
        <img className="hero-photo" src="/fotos/vitrine.jpg" alt="" aria-hidden="true" />
        <div className="container">
          <div className="hero-eyebrow-row">
            <span className="eyebrow">
              <span className="eyebrow-rule" />
              Cravinhos / SP · Por hora marcada
            </span>
          </div>
          <h1>Sua identidade, nosso cuidado.</h1>
          <p className="lead">
            Não atendemos todo mundo. Atendemos quem faz questão. Cadeira
            reservada, tempo suficiente, nenhum corte padrão.
          </p>
          <div className="hero-actions">
            <Link to="/agendar" className="btn btn-primary">
              Reservar cadeira
            </Link>
            <Link to="/catalogo" className="btn btn-outline">
              Ver catálogo
            </Link>
          </div>

          <div className="stats-row">
            <div className="stat">
              <div className="num">1:1</div>
              <p>Um barbeiro, uma cadeira, sem revezamento apressado.</p>
            </div>
            <div className="stat">
              <div className="num">45 min</div>
              <p>Tempo mínimo reservado para cada atendimento.</p>
            </div>
            <div className="stat">
              <div className="num">6 dias</div>
              <p>Segunda a sábado. Domingo é o nosso descanso.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="section-num">01</span>
            <span className="eyebrow">Manifesto</span>
          </div>
          <h2>Pressa é o oposto de cuidado.</h2>
          <p className="prose">
            Uma barbearia cheia atende rápido. A gente escolheu o contrário:
            agenda fechada, uma cadeira por vez, o tempo que o seu corte
            pedir. Ninguém vai apressar o corte que está sentado à sua
            frente.
          </p>
          <p className="prose">
            Barbeiros que tratam corte como ofício, não como turno. Luz de
            estúdio, rádio baixo, e a paciência de entender que cuidado e
            identidade caminham juntos. <em>Sua identidade, nosso cuidado</em>{" "}
            não é frase de vitrine. É o método.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="section-num">02</span>
            <span className="eyebrow">A Casa</span>
          </div>
          <div className="cards-grid">
            <div className="card-photo">
              <img className="card-img" src="/fotos/ambiente.jpg" alt="Salão da Mosseri" />
              <h3>Ambiente</h3>
              <p>
                Som baixo, luz medida, nenhuma tela ligada gritando. O
                espaço foi desenhado para você não querer ir embora sem
                pressa.
              </p>
            </div>
            <div className="card-photo">
              <img className="card-img" src="/fotos/time.jpg" alt="Barbeiros da Mosseri" />
              <h3>Time</h3>
              <p>
                Cada barbeiro com o próprio ritmo, todos com a mesma
                postura: você escolhe quem senta ao lado da sua cadeira.
              </p>
            </div>
            <div className="card-photo">
              <img className="card-img" src="/fotos/barboterapia.jpg" alt="Barboterapia com toalha quente" />
              <h3>Barboterapia</h3>
              <p>
                Mais do que estilo, é cuidado. Toalha quente, navalha, pele
                tratada. O ritual inteiro, sem atalho.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ borderBottom: "none" }}>
        <div className="container">
          <div className="section-head">
            <span className="section-num">03</span>
            <span className="eyebrow">Onde estamos</span>
          </div>
          <div className="location-grid">
            <div>
              <h2 style={{ marginBottom: 16 }}>
                Av. Pedro Duarte Amoroso, 622B
              </h2>
              <p className="prose" style={{ marginBottom: 20 }}>
                Jardim Itamarati, Cravinhos/SP
                <br />
                CEP 14140-000
              </p>
              <div className="location-meta">
                <div>
                  <div className="label">Horário</div>
                  <div>14:30 às 20:00</div>
                </div>
                <div>
                  <div className="label">Telefone</div>
                  <div>(16) 99394-4841</div>
                </div>
              </div>
              <div className="location-actions">
                <a
                  className="btn btn-primary"
                  href="https://www.google.com/maps/search/?api=1&query=Av.+Pedro+Duarte+Amoroso+622B+Cravinhos+SP"
                  target="_blank"
                  rel="noreferrer"
                >
                  Como chegar
                </a>
                <Link to="/agendar" className="btn btn-outline">
                  Agendar
                </Link>
              </div>
            </div>
            <div className="map-box">
              <MiniMapa />
              <span className="map-label-top">Cravinhos / SP</span>
              <a
                className="map-label-bottom"
                href="https://www.google.com/maps/search/?api=1&query=Av.+Pedro+Duarte+Amoroso,+622B,+Jardim+Itamarati,+Cravinhos+-+SP,+14140-000"
                target="_blank"
                rel="noreferrer"
              >
                Aqui no mapa
              </a>
            </div>
          </div>
        </div>
      </section>

      <Marquee text="Sua identidade, nosso cuidado · Corte · Barba · Barboterapia" />

      <section className="cta-banner">
        <div className="container cta-banner-inner">
          <div>
            <span className="eyebrow">04 · Agenda</span>
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
