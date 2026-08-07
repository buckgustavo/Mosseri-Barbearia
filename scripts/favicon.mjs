// Gera o favicon: disco azul da marca com o infinito branco no centro,
// que e a mesma composicao da foto de perfil do Instagram.
// Rode com: node scripts/favicon.mjs
import sharp from "sharp";

const SIZE = 256;
const BLUE = "#01539c";

const disco = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">
     <circle cx="${SIZE / 2}" cy="${SIZE / 2}" r="${SIZE / 2}" fill="${BLUE}"/>
   </svg>`
);

// o glifo ocupa ~58% da largura do disco para sobrar respiro nas bordas
const glifo = await sharp("src/assets/mosseri-glyph.svg")
  .resize({ width: Math.round(SIZE * 0.58) })
  .png()
  .toBuffer();

// compoe em tamanho cheio primeiro: no mesmo pipeline o sharp redimensiona
// antes de compor, e o glifo nao caberia no disco ja encolhido.
const icone = await sharp(disco)
  .composite([{ input: glifo, gravity: "center" }])
  .png()
  .toBuffer();

for (const px of [32, 180, 256]) {
  const nome = px === 180 ? "public/apple-touch-icon.png" : `public/favicon-${px}.png`;
  await sharp(icone).resize(px, px).png().toFile(nome);
  console.log(nome, `${px}x${px}`);
}
