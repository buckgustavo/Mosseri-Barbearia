import { useState } from "react";
import { reduzirImagem } from "./imagem";

// Miniatura + "Adicionar/Trocar foto" + "Tirar foto", igual pra produto e
// barbeiro. No celular o botao abre a camera ou a galeria. A imagem e reduzida
// no navegador antes de subir; quem decide o resto e o servidor.
export default function Foto({ nome, url, acao, enviar, remover, aoMudar }) {
  const [enviando, setEnviando] = useState(false);

  async function escolher(evento) {
    const arquivo = evento.target.files?.[0];
    evento.target.value = ""; // permite escolher o mesmo arquivo de novo
    if (!arquivo) return;
    setEnviando(true);
    const imagem = await reduzirImagem(arquivo);
    const feito = await acao.executar(() => enviar(imagem));
    setEnviando(false);
    if (feito) aoMudar();
  }

  async function tirar() {
    if (!window.confirm(`Tirar a foto de "${nome}"?`)) return;
    if (await acao.executar(remover)) aoMudar();
  }

  const rotulo = enviando ? "Enviando…" : url ? "Trocar foto" : "Adicionar foto";

  return (
    <div className="produto-foto">
      {url ? (
        <img src={url} alt={`Foto de ${nome}`} />
      ) : (
        <div className="produto-foto-vazia" aria-hidden="true">sem foto</div>
      )}
      <div className="produto-foto-acoes">
        <label className={`btn btn-outline btn-mini ${acao.ocupado ? "desativado" : ""}`}>
          {rotulo}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/*"
            onChange={escolher}
            disabled={acao.ocupado}
            hidden
          />
        </label>
        {url && (
          <button className="btn-linha" onClick={tirar} disabled={acao.ocupado}>
            Tirar foto
          </button>
        )}
      </div>
    </div>
  );
}
