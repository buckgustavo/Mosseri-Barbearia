import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ATENCAO: esta coordenada e o CENTRO DA AVENIDA, nao o numero 622B.
// O OpenStreetMap nao tem os numeros dessa via cadastrados, entao o geocoder
// devolve o meio da rua, que fica no trecho do Santa Luzia e nao no Itamarati.
// Para acertar: abrir o Google Maps na barbearia, clicar com o botao direito
// sobre ela e copiar o par lat/lon que aparece no topo do menu, e substituir
// os dois numeros abaixo. E o unico ponto do codigo que precisa mudar.
const POSICAO = [-21.3373043, -47.7491244];

// O mapa so busca tiles depois que o visitante pede. Carregar sozinho mandaria
// o IP de todo mundo que abre a home pros servidores da Esri, sem aviso. Ate o
// clique, o cartao e desenhado em CSS (nenhuma imagem de terceiro), com o pino
// e o endereco; o link "Aqui no mapa", na Home, continua levando ao Google Maps.
export default function MiniMapa() {
  const [ativo, setAtivo] = useState(false);

  if (!ativo) {
    return (
      <div className="mapa-canvas mapa-estatico">
        <span className="mapa-estatico-pino" aria-hidden="true">
          <span className="mapa-pino-halo"></span>
          <span className="mapa-pino-ponto"></span>
        </span>
        <p className="mapa-estatico-endereco">
          Av. Pedro Duarte Amoroso, 622B
          <br />
          Jardim Itamarati
        </p>
        <button type="button" className="mapa-estatico-botao" onClick={() => setAtivo(true)}>
          Mostrar mapa
        </button>
        <span className="mapa-estatico-aviso">Carrega imagens da Esri e do OpenStreetMap.</span>
      </div>
    );
  }
  return <MapaInterativo />;
}

function MapaInterativo() {
  const caixa = useRef(null);

  useEffect(() => {
    const mapa = L.map(caixa.current, {
      center: POSICAO,
      zoom: 16,
      zoomControl: false,
      attributionControl: true,
      // mini mapa: e um cartao, nao um mapa para navegar
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
      keyboard: false,
    });

    // Tiles escuros do Esri Dark Gray Canvas, sem chave de API.
    // Antes isto era o dark_all da CARTO, que passou a exigir chave e devolve
    // um tile com "API KEY REQUIRED" escrito em cima no lugar do mapa.
    // ATENCAO: este servico so tem imagem ate o zoom 16, que e o zoom fixo
    // deste cartao. Se um dia o mapa for liberado para navegar, trocar de
    // provedor: acima de 16 ele devolve tile de "sem dados".
    // A ordem do caminho e {z}/{y}/{x}, invertida em relacao ao padrao.
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
      {
        maxZoom: 16,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; Esri',
      }
    ).addTo(mapa);

    // Marcador proprio: ponto azul com halo pulsante
    L.marker(POSICAO, {
      interactive: false,
      keyboard: false,
      icon: L.divIcon({
        className: "mapa-pino",
        html: '<span class="mapa-pino-halo"></span><span class="mapa-pino-ponto"></span>',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      }),
    }).addTo(mapa);

    return () => mapa.remove();
  }, []);

  return <div className="mapa-canvas" ref={caixa} aria-label="Mapa da Mosseri em Cravinhos" />;
}
