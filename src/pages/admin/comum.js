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

export const moeda = (centavos) => `R$ ${centavos}`;

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
