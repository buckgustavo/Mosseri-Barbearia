import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Fontes servidas pelo proprio site (pacotes @fontsource, licenca OFL), e nao
// pelo Google Fonts: assim abrir a pagina nao manda o IP do visitante pra
// ninguem alem de quem hospeda o site.
import '@fontsource/archivo/400.css'
import '@fontsource/archivo/500.css'
import '@fontsource/archivo/600.css'
import '@fontsource/archivo/700.css'
import '@fontsource/archivo/800.css'
import '@fontsource/caveat/600.css'
import './index.css'
import App from './App.jsx'
import { iniciarAparencia } from './aparencia'

// Antes de desenhar: o tamanho das letras ja vem certo na primeira pintura.
iniciarAparencia()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
