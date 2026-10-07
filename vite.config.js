import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Sem dominio proprio o Pages serve em https://<user>.github.io/Mosseri-Barbearia/.
  // Com dominio proprio (CNAME em public/) o site vive na raiz: build com VITE_BASE=/.
  // `||` e nao `??`: no Actions a variavel ausente chega como string vazia.
  base: process.env.VITE_BASE || '/Mosseri-Barbearia/',
  plugins: [react()],
  server: {
    // O projeto vive em /mnt/c (filesystem do Windows via WSL2), que não emite
    // eventos inotify: sem polling o HMR nunca vê as alterações.
    watch: { usePolling: true, interval: 300 },
    // Em dev a API responde na mesma origem do site, o que tira CORS do caminho.
    // Suba o backend em ../backend com `npm run dev`.
    proxy: { '/api': process.env.API_URL ?? 'http://127.0.0.1:3333' },
  },
})
