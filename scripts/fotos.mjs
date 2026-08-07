// Gera as versoes web das fotos originais (1365x2048, ~600KB cada).
// Rode com: node scripts/fotos.mjs
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const SRC = "/mnt/c/G.buck/Mosseri/fotos-20260807T023624Z-1-001/fotos";
const OUT = "public/fotos";

// [arquivo de origem, nome final, largura, altura, foco do corte, recorte manual]
// O recorte manual existe porque o "attention" do sharp erra em foto de corpo
// inteiro: no Juan ele escolheu o tronco e cortou a cabeca fora.
const JOBS = [
  ["DSC03455", "vitrine", 1800, 1100, "attention"],
  ["DSC03829", "thiago", 400, 400, "attention"],
  ["DSC03837", "juan", 400, 400, "attention", { left: 360, top: 190, width: 760, height: 760 }],
  ["DSC03450", "ambiente", 900, 560, "attention"],
  ["DSC03564", "time", 900, 560, "attention"],
  ["DSC03570", "barboterapia", 900, 560, "attention"],
  ["DSC03492", "post-1", 520, 520, "attention"],
  ["DSC03569", "post-2", 520, 520, "attention"],
  ["DSC03601", "post-3", 520, 520, "attention"],
  ["DSC03686", "post-4", 520, 520, "attention"],
  ["DSC03474", "post-5", 520, 520, "attention"],
  ["DSC03621", "post-6", 520, 520, "attention"],
  ["DSC03687", "post-7", 520, 520, "attention"],
];

await mkdir(OUT, { recursive: true });

let total = 0;
for (const [src, name, w, h, position, recorte] of JOBS) {
  const dest = `${OUT}/${name}.jpg`;
  let img = sharp(`${SRC}/${src}.jpg`);
  if (recorte) img = img.extract(recorte);
  const info = await img
    .resize(w, h, { fit: "cover", position })
    .jpeg({ quality: 78, mozjpeg: true })
    .toFile(dest);
  total += info.size;
  console.log(
    `${name.padEnd(14)} ${String(w).padStart(4)}x${String(h).padEnd(4)} ${(info.size / 1024).toFixed(0).padStart(4)} KB`
  );
}
console.log(`\ntotal: ${(total / 1024 / 1024).toFixed(2)} MB`);
