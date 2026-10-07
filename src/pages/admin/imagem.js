// Reduz a foto no navegador antes de mandar: foto de celular tem 3-6 MB e
// 4000px, e o catalogo mostra no maximo 800px. Mandar 1600px em JPEG fica na
// casa de algumas centenas de KB -- sobe rapido no 4G do balcao. O servidor
// reprocessa de qualquer jeito; isto aqui e so pra nao gastar dado a toa.
//
// O canvas tambem descarta os metadados (GPS incluso) e ja aplica a rotacao
// da camera. Se o navegador nao souber abrir o formato (HEIC no Chrome, por
// exemplo), manda o arquivo original e deixa o servidor responder.
export async function reduzirImagem(arquivo, ladoMax = 1600) {
  if (typeof createImageBitmap !== "function") return arquivo;
  let bitmap;
  try {
    bitmap = await createImageBitmap(arquivo, { imageOrientation: "from-image" });
  } catch {
    return arquivo;
  }
  const escala = Math.min(1, ladoMax / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * escala);
  canvas.height = Math.round(bitmap.height * escala);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  const blob = await new Promise((ok) => canvas.toBlob(ok, "image/jpeg", 0.85));
  return blob ?? arquivo;
}
