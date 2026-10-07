import { api } from "./api";

// Tamanho das letras do site inteiro. A barbearia escolhe na area gerencial;
// o servidor guarda e todo visitante recebe. Aqui so se aplica: a variavel
// --escala-fonte multiplica cada font-size do CSS.
//
// O ultimo valor fica no navegador pra pagina ja abrir no tamanho certo, sem
// "pular" quando a resposta da API chega. E so atalho: quem manda e a API.
const CHAVE = "mosseri:escala-fonte";
export const PADRAO = 100;

export function aplicarEscala(porcento) {
  const raiz = document.documentElement;
  raiz.style.setProperty("--escala-fonte", String(porcento / 100));
  // Acima de 100% o menu do topo nao cabe ao lado do logo (ver index.css).
  if (porcento > 100) raiz.dataset.navCompacta = "";
  else delete raiz.dataset.navCompacta;
}

function lembrar(porcento) {
  try {
    localStorage.setItem(CHAVE, String(porcento));
  } catch {
    /* sem storage, a pagina so abre no padrao ate a API responder */
  }
}

export function aplicarEGuardar(porcento) {
  aplicarEscala(porcento);
  lembrar(porcento);
}

export function iniciarAparencia() {
  try {
    const guardado = Number(localStorage.getItem(CHAVE));
    if (guardado >= 50 && guardado <= 200) aplicarEscala(guardado);
  } catch {
    /* segue no padrao */
  }
  api.aparencia()
    .then(({ escalaFonte }) => aplicarEGuardar(escalaFonte))
    .catch(() => {
      /* API fora do ar: fica o que ja estava aplicado */
    });
}
