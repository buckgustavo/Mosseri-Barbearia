// No GitHub Pages o site vive em /Mosseri-Barbearia/, entao caminho absoluto
// como "/fotos/x.jpg" apontaria para a raiz do dominio e quebraria.
// BASE_URL ja termina em "/" tanto em dev ("/") quanto no build.
export const foto = (nome) => `${import.meta.env.BASE_URL}fotos/${nome}.jpg`;
