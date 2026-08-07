import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ATENCAO: esta coordenada e o CENTRO DA AVENIDA, nao o numero 622B.
// O OpenStreetMap nao tem os numeros dessa via cadastrados, entao o geocoder
// devolve o meio da rua, que fica no trecho do Santa Luzia e nao no Itamarati.
// Para acertar: abrir o Google Maps na barbearia, clicar com o botao direito
// sobre ela e copiar o par lat/lon que aparece no topo do menu, e substituir
// os dois numeros abaixo. E o unico ponto do codigo que precisa mudar.
const POSICAO = [-21.3373043, -47.7491244];

export default function MiniMapa() {
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

    // Tiles escuros da CARTO, sem chave de API, no mesmo tom do tema
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        subdomains: "abcd",
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
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
