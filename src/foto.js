import { urlDaApi } from "./api";

// No GitHub Pages o site vive em /Mosseri-Barbearia/, entao caminho absoluto
// como "/fotos/x.jpg" apontaria para a raiz do dominio e quebraria.
// BASE_URL ja termina em "/" tanto em dev ("/") quanto no build.
export const foto = (nome) => `${import.meta.env.BASE_URL}fotos/${nome}.jpg`;

// Barbeiro: foto enviada pelo painel vem da API ("/api/fotos/..."); as antigas
// sao o nome de um arquivo em public/fotos ("thiago"); vazio = sem foto.
export const fotoBarbeiro = (valor) =>
  !valor ? null : valor.startsWith("/api/") ? urlDaApi(valor) : foto(valor);
