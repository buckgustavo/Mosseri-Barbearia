import { useCallback, useEffect, useRef, useState } from "react";

// Peças que todo painel da área gerencial repete: carregar do servidor, falhar
// em voz alta e voltar pro login quando o token morre no meio do caminho.

// `chave` e o que faz a carga acontecer de novo: a funcao passada fecha sobre o
// estado da tela (a data da agenda, por exemplo) e mudaria a cada render, entao
// quem decide quando recarregar e a chave, nao a identidade da funcao.
export function useRecurso(carregar, aoExpirar, chave = "") {
  const [estado, setEstado] = useState({ dados: null, erro: null, carregando: true });
  // A função de carga muda a cada render (fecha sobre filtros da tela); a ref
  // mantém o efeito estável sem recarregar sem motivo.
  const ultima = useRef(carregar);
  ultima.current = carregar;

  const recarregar = useCallback(async () => {
    setEstado((atual) => ({ ...atual, carregando: true }));
    try {
      setEstado({ dados: await ultima.current(), erro: null, carregando: false });
    } catch (e) {
      if (e.status === 401) aoExpirar();
      setEstado({ dados: null, erro: e.message, carregando: false });
    }
  }, [aoExpirar]);

  useEffect(() => {
    recarregar();
  }, [recarregar, chave]);

  return { ...estado, recarregar };
}

export function useAcao(aoExpirar) {
  const [erro, setErro] = useState(null);
  const [ocupado, setOcupado] = useState(false);

  const executar = useCallback(
    async (acao) => {
      setOcupado(true);
      setErro(null);
      try {
        return await acao();
      } catch (e) {
        if (e.status === 401) aoExpirar();
        setErro(e.message);
        return undefined;
      } finally {
        setOcupado(false);
      }
    },
    [aoExpirar]
  );

  return { erro, setErro, ocupado, executar };
}

// Preço de tabela (serviço, produto) é real inteiro; o financeiro anda em
// centavos. São duas funções pra ninguém dividir por 100 o que já é real.
export const moeda = (reais) => `R$ ${reais}`;

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const reais = (centavos) => BRL.format(centavos / 100);

// "35", "35,5", "1.234,56" -> centavos. Vazio ou torto vira null. Sem vírgula,
// ponto seguido de 1 ou 2 dígitos é decimal ("35.50", do teclado numérico);
// qualquer outro ponto é separador de milhar.
export function paraCentavos(texto) {
  let limpo = String(texto).trim();
  limpo = limpo.includes(",") || !/\.\d{1,2}$/.test(limpo)
    ? limpo.replace(/\./g, "").replace(",", ".")
    : limpo;
  if (!/^\d+(\.\d{0,2})?$/.test(limpo)) return null;
  return Math.round(Number(limpo) * 100);
}

// Centavos -> o que vai no campo de digitação ("35,00").
export const campoDeReais = (centavos) => (centavos / 100).toFixed(2).replace(".", ",");

// Só deixa passar o que cabe num valor em reais enquanto a pessoa digita.
export const filtrarReais = (texto) => texto.replace(/[^\d,.]/g, "");

export const FORMAS = [
  ["dinheiro", "Dinheiro"],
  ["pix", "Pix"],
  ["debito", "Débito"],
  ["credito", "Crédito"],
];
export const nomeDaForma = (forma) => FORMAS.find(([id]) => id === forma)?.[1] ?? forma;

// O telefone é guardado só com dígito; o link precisa do país na frente.
export const linkWhatsapp = (telefone) => `https://wa.me/55${telefone}`;

export const telefoneLegivel = (d) =>
  d.length === 11
    ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
    : `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;

export const hojeLocal = () => {
  const agora = new Date();
  return new Date(agora.getTime() - agora.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

export const somaDias = (data, n) => {
  const d = new Date(`${data}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

export const dataLegivel = (data) => `${data.slice(8)}/${data.slice(5, 7)}/${data.slice(0, 4)}`;

// Atalhos de período das telas de financeiro e estoque. Tudo em data local.
export function periodoPronto(qual) {
  const hoje = hojeLocal();
  if (qual === "hoje") return { de: hoje, ate: hoje };
  if (qual === "7dias") return { de: somaDias(hoje, -6), ate: hoje };
  if (qual === "mes") return { de: `${hoje.slice(0, 7)}-01`, ate: hoje };
  // Mês passado: do dia 1 ao dia anterior ao 1º deste mês.
  const fim = somaDias(`${hoje.slice(0, 7)}-01`, -1);
  return { de: `${fim.slice(0, 7)}-01`, ate: fim };
}
