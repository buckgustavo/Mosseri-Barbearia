import Logo from "../components/Logo";

const POSTS = [
  { src: "post-1", alt: "Barbeiro finalizando o corte" },
  { src: "post-2", alt: "Toalha quente no rosto do cliente" },
  { src: "post-3", alt: "Cliente na cadeira depois do corte" },
  { src: "post-4", alt: "Acabamento do degradê na nuca" },
  { src: "post-5", alt: "Tesoura e pente em uso" },
  { src: "post-6", alt: "Acabamento na máquina" },
  { src: "post-7", alt: "Corte finalizado de perfil" },
];

export default function Instagram() {
  return (
    <>
      {/* Mesmo cabecalho do Catalogo e do Agendar: bloco escuro com olho,
          titulo e linha de apoio. O perfil entra como coluna a direita. */}
      <div className="page-head">
        <div className="container page-head-row">
          <div>
            <span className="eyebrow">No Instagram</span>
            <h1>O trabalho, todo dia.</h1>
            <p className="page-lead">
              Cada corte que sai daqui vira registro. Se quer saber como a
              casa trabalha antes de sentar na cadeira, é lá que está.
            </p>
          </div>
          <div className="ig-profile-card">
            <div className="handle">@mosseri.barbearia</div>
            <div className="followers">680 seguidores</div>
            <a
              className="btn btn-primary"
              href="https://instagram.com/mosseri.barbearia"
              target="_blank"
              rel="noreferrer"
            >
              Seguir
            </a>
          </div>
        </div>
      </div>

      <div className="ig-grid">
        {POSTS.map((p) => (
          <a
            key={p.src}
            className="ig-tile"
            href="https://instagram.com/mosseri.barbearia"
            target="_blank"
            rel="noreferrer"
          >
            <img src={`/fotos/${p.src}.jpg`} alt={p.alt} loading="lazy" />
          </a>
        ))}
        <a
          className="ig-view-all"
          href="https://instagram.com/mosseri.barbearia"
          target="_blank"
          rel="noreferrer"
        >
          <Logo withText={false} size={34} circle />
          Ver o feed completo
        </a>
      </div>
    </>
  );
}
